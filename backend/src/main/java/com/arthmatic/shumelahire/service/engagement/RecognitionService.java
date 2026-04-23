package com.arthmatic.shumelahire.service.engagement;

import com.arthmatic.shumelahire.dto.engagement.RecognitionCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.RecognitionResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.Recognition;
import com.arthmatic.shumelahire.entity.engagement.RecognitionCategory;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.RecognitionDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class RecognitionService {

    private static final Logger logger = LoggerFactory.getLogger(RecognitionService.class);

    @Autowired
    private RecognitionDataRepository recognitionRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public RecognitionResponse giveRecognition(RecognitionCreateRequest request) {
        Employee fromEmployee = employeeRepository.findById(request.getFromEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("From employee not found: " + request.getFromEmployeeId()));

        Employee toEmployee = employeeRepository.findById(request.getToEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("To employee not found: " + request.getToEmployeeId()));

        if (request.getFromEmployeeId().equals(request.getToEmployeeId())) {
            throw new IllegalArgumentException("Cannot give recognition to yourself");
        }

        Recognition recognition = new Recognition();
        recognition.setFromEmployee(fromEmployee);
        recognition.setToEmployee(toEmployee);
        recognition.setCategory(RecognitionCategory.valueOf(request.getCategory()));
        recognition.setMessage(request.getMessage());
        recognition.setPoints(request.getPoints() != null ? request.getPoints() : 10);
        recognition.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : true);

        recognition = recognitionRepository.save(recognition);

        auditLogService.saveLog(request.getFromEmployeeId().toString(), "GIVE_RECOGNITION", "RECOGNITION",
                recognition.getId().toString(), "Gave recognition to employee " + request.getToEmployeeId());
        logger.info("Employee {} gave recognition to employee {}", request.getFromEmployeeId(), request.getToEmployeeId());

        notificationService.sendInternalNotification(toEmployee.getId(), "Recognition Received",
                fromEmployee.getFullName() + " recognized you: " + request.getMessage(),
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return RecognitionResponse.fromEntity(recognition);
    }

    @Transactional(readOnly = true)
    public List<RecognitionResponse> getRecognitionsFor(String employeeId) {
        List<Recognition> recognitions = recognitionRepository.findByToEmployeeIdOrderByCreatedAtDesc(employeeId);
        enrichRecognitions(recognitions);
        return recognitions.stream()
                .map(RecognitionResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecognitionResponse> getRecognitionsFrom(String employeeId) {
        List<Recognition> recognitions = recognitionRepository.findByFromEmployeeIdOrderByCreatedAtDesc(employeeId);
        enrichRecognitions(recognitions);
        return recognitions.stream()
                .map(RecognitionResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecognitionResponse> getPublicRecognitions() {
        List<Recognition> recognitions = recognitionRepository.findByIsPublicTrueOrderByCreatedAtDesc();
        enrichRecognitions(recognitions);
        return recognitions.stream()
                .map(RecognitionResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
    }

    private void enrichRecognitions(List<Recognition> recognitions) {
        Set<String> employeeIds = new HashSet<>();
        for (Recognition r : recognitions) {
            if (r.getFromEmployee() != null && r.getFromEmployee().getId() != null) {
                employeeIds.add(r.getFromEmployee().getId());
            }
            if (r.getToEmployee() != null && r.getToEmployee().getId() != null) {
                employeeIds.add(r.getToEmployee().getId());
            }
        }
        if (employeeIds.isEmpty()) return;

        Map<String, Employee> employeeMap = new HashMap<>();
        for (String id : employeeIds) {
            employeeRepository.findById(id).ifPresent(emp -> employeeMap.put(id, emp));
        }

        for (Recognition r : recognitions) {
            if (r.getFromEmployee() != null && employeeMap.containsKey(r.getFromEmployee().getId())) {
                r.setFromEmployee(employeeMap.get(r.getFromEmployee().getId()));
            }
            if (r.getToEmployee() != null && employeeMap.containsKey(r.getToEmployee().getId())) {
                r.setToEmployee(employeeMap.get(r.getToEmployee().getId()));
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLeaderboard(int limit) {
        List<Map<String, Object>> results = recognitionRepository.getLeaderboard();
        // Apply limit
        if (limit > 0 && results.size() > limit) {
            return results.subList(0, limit);
        }
        return results;
    }
}
