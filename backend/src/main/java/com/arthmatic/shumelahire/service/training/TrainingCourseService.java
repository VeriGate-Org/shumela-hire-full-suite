package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.dto.training.TrainingCourseRequest;
import com.arthmatic.shumelahire.dto.training.TrainingCourseResponse;
import com.arthmatic.shumelahire.entity.training.DeliveryMethod;
import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.repository.training.TrainingCourseRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrainingCourseService {

    private static final Logger logger = LoggerFactory.getLogger(TrainingCourseService.class);

    @Autowired
    private TrainingCourseRepository trainingCourseRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getAll() {
        return trainingCourseRepository.findAll().stream()
                .map(TrainingCourseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getActive() {
        return trainingCourseRepository.findByIsActiveTrue().stream()
                .map(TrainingCourseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrainingCourseResponse getById(Long id) {
        TrainingCourse course = trainingCourseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training course not found: " + id));
        return TrainingCourseResponse.fromEntity(course);
    }

    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> searchCourses(String search) {
        return trainingCourseRepository.searchCourses(search).stream()
                .map(TrainingCourseResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return trainingCourseRepository.findDistinctCategories();
    }

    public TrainingCourseResponse create(TrainingCourseRequest request, String userId) {
        TrainingCourse course = new TrainingCourse();
        course.setTitle(request.getTitle());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        if (request.getDeliveryMethod() != null) {
            course.setDeliveryMethod(DeliveryMethod.valueOf(request.getDeliveryMethod()));
        }
        course.setCategory(request.getCategory());
        course.setProvider(request.getProvider());
        course.setDurationHours(request.getDurationHours());
        course.setMaxParticipants(request.getMaxParticipants());
        course.setCost(request.getCost());
        course.setIsMandatory(request.getIsMandatory() != null ? request.getIsMandatory() : false);
        course.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        TrainingCourse saved = trainingCourseRepository.save(course);
        auditLogService.saveLog(userId, "CREATE", "TRAINING_COURSE", saved.getId().toString(), "Created training course: " + saved.getTitle());
        logger.info("Created training course: {} ({})", saved.getTitle(), saved.getCode());

        return TrainingCourseResponse.fromEntity(saved);
    }

    public TrainingCourseResponse update(Long id, TrainingCourseRequest request, String userId) {
        TrainingCourse course = trainingCourseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training course not found: " + id));

        course.setTitle(request.getTitle());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        if (request.getDeliveryMethod() != null) {
            course.setDeliveryMethod(DeliveryMethod.valueOf(request.getDeliveryMethod()));
        }
        course.setCategory(request.getCategory());
        course.setProvider(request.getProvider());
        course.setDurationHours(request.getDurationHours());
        course.setMaxParticipants(request.getMaxParticipants());
        course.setCost(request.getCost());
        if (request.getIsMandatory() != null) course.setIsMandatory(request.getIsMandatory());
        if (request.getIsActive() != null) course.setIsActive(request.getIsActive());

        TrainingCourse saved = trainingCourseRepository.save(course);
        auditLogService.saveLog(userId, "UPDATE", "TRAINING_COURSE", saved.getId().toString(), "Updated training course: " + saved.getTitle());

        return TrainingCourseResponse.fromEntity(saved);
    }

    public void delete(Long id, String userId) {
        TrainingCourse course = trainingCourseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training course not found: " + id));
        course.setIsActive(false);
        trainingCourseRepository.save(course);
        auditLogService.saveLog(userId, "DELETE", "TRAINING_COURSE", id.toString(), "Deactivated training course: " + course.getTitle());
    }
}
