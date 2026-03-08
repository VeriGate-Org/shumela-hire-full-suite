package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.dto.training.TrainingSessionRequest;
import com.arthmatic.shumelahire.dto.training.TrainingSessionResponse;
import com.arthmatic.shumelahire.entity.training.SessionStatus;
import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.repository.training.TrainingCourseRepository;
import com.arthmatic.shumelahire.repository.training.TrainingSessionRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrainingSessionService {

    private static final Logger logger = LoggerFactory.getLogger(TrainingSessionService.class);

    @Autowired
    private TrainingSessionRepository trainingSessionRepository;

    @Autowired
    private TrainingCourseRepository trainingCourseRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> getAll() {
        return trainingSessionRepository.findAll().stream()
                .map(TrainingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> getByCourse(Long courseId) {
        return trainingSessionRepository.findByCourseId(courseId).stream()
                .map(TrainingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrainingSessionResponse getById(Long id) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + id));
        return TrainingSessionResponse.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> getUpcoming() {
        return trainingSessionRepository.findUpcomingSessions(LocalDateTime.now()).stream()
                .map(TrainingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> getOpenWithSeats() {
        return trainingSessionRepository.findOpenWithAvailableSeats().stream()
                .map(TrainingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TrainingSessionResponse create(TrainingSessionRequest request, String userId) {
        TrainingCourse course = trainingCourseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Training course not found: " + request.getCourseId()));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        TrainingSession session = new TrainingSession();
        session.setCourse(course);
        session.setTrainerName(request.getTrainerName());
        session.setLocation(request.getLocation());
        session.setStartDate(request.getStartDate());
        session.setEndDate(request.getEndDate());
        session.setStatus(request.getStatus() != null ? SessionStatus.valueOf(request.getStatus()) : SessionStatus.PLANNED);
        session.setAvailableSeats(request.getAvailableSeats() != null ? request.getAvailableSeats() : course.getMaxParticipants());

        TrainingSession saved = trainingSessionRepository.save(session);
        auditLogService.saveLog(userId, "CREATE", "TRAINING_SESSION", saved.getId().toString(),
                "Created session for course: " + course.getTitle());
        logger.info("Created training session #{} for course {}", saved.getId(), course.getCode());

        return TrainingSessionResponse.fromEntity(saved);
    }

    public TrainingSessionResponse update(Long id, TrainingSessionRequest request, String userId) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + id));

        session.setTrainerName(request.getTrainerName());
        session.setLocation(request.getLocation());
        session.setStartDate(request.getStartDate());
        session.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            session.setStatus(SessionStatus.valueOf(request.getStatus()));
        }
        if (request.getAvailableSeats() != null) {
            session.setAvailableSeats(request.getAvailableSeats());
        }

        TrainingSession saved = trainingSessionRepository.save(session);
        auditLogService.saveLog(userId, "UPDATE", "TRAINING_SESSION", saved.getId().toString(),
                "Updated training session");

        return TrainingSessionResponse.fromEntity(saved);
    }

    public TrainingSessionResponse openSession(Long id, String userId) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + id));
        session.setStatus(SessionStatus.OPEN);
        TrainingSession saved = trainingSessionRepository.save(session);
        auditLogService.saveLog(userId, "OPEN", "TRAINING_SESSION", id.toString(), "Opened session for enrollment");
        return TrainingSessionResponse.fromEntity(saved);
    }

    public TrainingSessionResponse closeSession(Long id, String userId) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + id));
        session.setStatus(SessionStatus.COMPLETED);
        TrainingSession saved = trainingSessionRepository.save(session);
        auditLogService.saveLog(userId, "CLOSE", "TRAINING_SESSION", id.toString(), "Closed/completed training session");
        return TrainingSessionResponse.fromEntity(saved);
    }

    public TrainingSessionResponse cancelSession(Long id, String userId) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + id));
        session.setStatus(SessionStatus.CANCELLED);
        TrainingSession saved = trainingSessionRepository.save(session);
        auditLogService.saveLog(userId, "CANCEL", "TRAINING_SESSION", id.toString(), "Cancelled training session");
        return TrainingSessionResponse.fromEntity(saved);
    }
}
