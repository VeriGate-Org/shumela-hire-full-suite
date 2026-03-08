package com.arthmatic.shumelahire.service.engagement;

import com.arthmatic.shumelahire.dto.engagement.RecognitionCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.RecognitionResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.Recognition;
import com.arthmatic.shumelahire.entity.engagement.RecognitionCategory;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.engagement.RecognitionRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class RecognitionService {

    private static final Logger logger = LoggerFactory.getLogger(RecognitionService.class);

    @Autowired
    private RecognitionRepository recognitionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

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

        return RecognitionResponse.fromEntity(recognition);
    }

    @Transactional(readOnly = true)
    public Page<RecognitionResponse> getRecognitionsFor(Long employeeId, Pageable pageable) {
        return recognitionRepository.findByToEmployeeIdOrderByCreatedAtDesc(employeeId, pageable)
                .map(RecognitionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<RecognitionResponse> getRecognitionsFrom(Long employeeId, Pageable pageable) {
        return recognitionRepository.findByFromEmployeeIdOrderByCreatedAtDesc(employeeId, pageable)
                .map(RecognitionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<RecognitionResponse> getPublicRecognitions(Pageable pageable) {
        return recognitionRepository.findByIsPublicTrueOrderByCreatedAtDesc(pageable)
                .map(RecognitionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLeaderboard(int limit) {
        List<Object[]> results = recognitionRepository.getLeaderboard(PageRequest.of(0, limit));
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        for (Object[] row : results) {
            Long employeeId = (Long) row[0];
            Long totalPoints = (Long) row[1];
            Employee employee = employeeRepository.findById(employeeId).orElse(null);

            Map<String, Object> entry = new HashMap<>();
            entry.put("employeeId", employeeId);
            entry.put("employeeName", employee != null ?
                    employee.getFirstName() + " " + employee.getLastName() : "Unknown");
            entry.put("totalPoints", totalPoints);
            leaderboard.add(entry);
        }

        return leaderboard;
    }
}
