package com.arthmatic.shumelahire.service.training;

import com.arthmatic.shumelahire.dto.training.TrainingEnrollmentRequest;
import com.arthmatic.shumelahire.dto.training.TrainingEnrollmentResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.training.EnrollmentStatus;
import com.arthmatic.shumelahire.entity.training.SessionStatus;
import com.arthmatic.shumelahire.entity.training.TrainingEnrollment;
import com.arthmatic.shumelahire.entity.training.TrainingSession;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.TrainingEnrollmentDataRepository;
import com.arthmatic.shumelahire.repository.TrainingSessionDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
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
    private TrainingEnrollmentDataRepository enrollmentRepository;

    @Autowired
    private TrainingSessionDataRepository sessionRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TrainingEnrollmentResponse> getBySession(Long sessionId) {
        return enrollmentRepository.findBySessionId(String.valueOf(sessionId)).stream()
                .map(TrainingEnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingEnrollmentResponse> getByEmployee(Long employeeId) {
        return enrollmentRepository.findByEmployeeWithDetails(String.valueOf(employeeId)).stream()
                .map(TrainingEnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TrainingEnrollmentResponse enroll(TrainingEnrollmentRequest request, String userId) {
        TrainingSession session = sessionRepository.findById(String.valueOf(request.getSessionId()))
                .orElseThrow(() -> new IllegalArgumentException("Training session not found: " + request.getSessionId()));

        Employee employee = employeeRepository.findById(String.valueOf(request.getEmployeeId()))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        // Check session is open
        if (session.getStatus() != SessionStatus.OPEN && session.getStatus() != SessionStatus.PLANNED) {
            throw new IllegalArgumentException("Session is not open for enrollment. Current status: " + session.getStatus());
        }

        // Check duplicate enrollment
        Optional<TrainingEnrollment> existing = enrollmentRepository.findBySessionIdAndEmployeeId(
                String.valueOf(request.getSessionId()), String.valueOf(request.getEmployeeId()));
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Employee is already enrolled in this session");
        }

        // Check available seats
        if (session.getAvailableSeats() != null) {
            long activeEnrollments = enrollmentRepository.countActiveEnrollmentsBySession(String.valueOf(session.getId()));
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

        notificationService.sendInternalNotification(employee.getId(), "Training Enrollment",
                "You've been enrolled in '" + session.getCourse().getTitle() + "' — " + session.getStartDate(),
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markAttended(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(String.valueOf(enrollmentId))
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.ATTENDED);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "MARK_ATTENDED", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as attended");

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markCompleted(Long enrollmentId, BigDecimal score, String certificateUrl, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(String.valueOf(enrollmentId))
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());
        if (score != null) enrollment.setScore(score);
        if (certificateUrl != null) enrollment.setCertificateUrl(certificateUrl);

        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "COMPLETE", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as completed" + (score != null ? " with score " + score : ""));

        String courseName = enrollment.getSession().getCourse().getTitle();
        notificationService.sendInternalNotification(enrollment.getEmployee().getId(), "Training Completed",
                "You've completed '" + courseName + "'" + (score != null ? " — Score: " + score : ""),
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse markNoShow(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(String.valueOf(enrollmentId))
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.NO_SHOW);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "NO_SHOW", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Marked enrollment as no-show");

        notificationService.sendInternalNotification(enrollment.getEmployee().getId(), "Training No-Show",
                "You were marked as no-show for '" + enrollment.getSession().getCourse().getTitle() + "'",
                NotificationType.APPROVAL_DENIED, NotificationPriority.HIGH);

        return TrainingEnrollmentResponse.fromEntity(saved);
    }

    public TrainingEnrollmentResponse cancel(Long enrollmentId, String userId) {
        TrainingEnrollment enrollment = enrollmentRepository.findById(String.valueOf(enrollmentId))
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found: " + enrollmentId));

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        TrainingEnrollment saved = enrollmentRepository.save(enrollment);
        auditLogService.saveLog(userId, "CANCEL", "TRAINING_ENROLLMENT", enrollmentId.toString(),
                "Cancelled enrollment");

        notificationService.sendInternalNotification(enrollment.getEmployee().getId(), "Training Cancelled",
                "Your enrollment in '" + enrollment.getSession().getCourse().getTitle() + "' has been cancelled",
                NotificationType.APPROVAL_DENIED, NotificationPriority.MEDIUM);

        return TrainingEnrollmentResponse.fromEntity(saved);
    }
}
