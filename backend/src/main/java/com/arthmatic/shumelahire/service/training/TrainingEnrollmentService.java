package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.dto.training.TrainingEnrollmentRequest;
import com.arthmatic.shumelahire.dto.training.TrainingEnrollmentResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.training.EnrollmentStatus;
import com.arthmatic.shumelahire.entity.training.SessionStatus;
import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;
import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.training.TrainingEnrollmentRepository;
import com.arthmatic.shumelahire.repository.training.TrainingSessionRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrainingEnrollmentService {

    private static final Logger logger = LoggerFactory.getLogger(TrainingEnrollmentService.class);

    @Autowired
    private TrainingEnrollmentRepository enrollmentRepository;

    @Autowired
    private TrainingSessionRepository sessionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<TrainingEnrollmentResponse> getBySession(Long sessionId) {
        return enrollmentRepository.findBySessionId(sessionId).stream()
                .map(TrainingEnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingEnrollmentResponse> getByEmployee(Long employeeId) {
        return enrollmentRepository.findByEmployeeWithDetails(employeeId).stream()
                .map(TrainingEnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TrainingEnrollmentResponse enroll(TrainingEnrollmentRequest request, String userId) {
        TrainingSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + request.getSessionId()));

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        // Check session is open
        if (session.getStatus() != SessionStatus.OPEN && session.getStatus() != SessionStatus.PLANNED) {
            throw new IllegalArgumentException("Session is not open for enrollment. Current status: " + session.getStatus());
        }

        // Check duplicate enrollment
        Optional<TrainingEnrollment> existing = enrollmentRepository.findBySessionIdAndEmployeeId(
                request.getSessionId(), request.getEmployeeId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Employee is already enrolled in this session");
        }

        // Check available seats
        if (session.getAvailableSeats() != null) {
            long activeEnrollments = enrollmentRepository.countActiveEnrollmentsBySession(session.getId());
            if (activeEnrollments >= session.getAvailableSeats()) {
                throw new IllegalArgumentException("No seats available for this session");
            }
        }

        TrainingEnrollment enrollment = new TrainingEnrollment();
        enrollment.setSession(session);
        enrollment.setEmployee(employee);
        enrollment.setStatus(EnrollmentStatus.REGISTERED);
        enrollment.setEnrolledAt(LocalDateTime.now());

        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "ENROLL", "TRAINING_ENROLLMENT", saved.getId().toString(),
                "Enrolled employee " + employee.getFullName() + " in session #" + session.getId());
        logger.info("Employee {} enrolled in training session #{}", employee.getFullName(), session.getId());

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markAttended(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.ATTENDED);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "MARK_ATTENDED", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as attended");

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markCompleted(Long enrollmentId, BigDecimal score, String certificateUrl, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());
        if (score != null) enrollment.setScore(score);
        if (certificateUrl != null) enrollment.setCertificateUrl(certificateUrl);

        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "COMPLETE", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as completed" + (score != null ? " with score " + score : ""));

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markNoShow(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.NO_SHOW);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "NO_SHOW", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as no-show");

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse cancel(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "CANCEL", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Cancelled enrollment");

        return TrainingEnrollmentResponse.fromEntity(saved);
    }
}
