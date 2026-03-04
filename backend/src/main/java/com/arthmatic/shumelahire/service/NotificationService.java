package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.Notification;
import com.arthmatic.shumelahire.entity.NotificationChannel;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.NotificationRepository;
import com.arthmatic.shumelahire.service.integration.EmailService;
import com.arthmatic.shumelahire.service.integration.MsTeamsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SqsClient sqsClient;

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private MsTeamsService msTeamsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${notification.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${notification.sqs.enabled:false}")
    private boolean sqsEnabled;

    @Value("${notification.sqs.queue-url:}")
    private String sqsQueueUrl;

    @Async
    public void notifyApplicationSubmitted(Application application) {
        logger.info("Sending application submitted notification for application {}", application.getId());

        String subject = "Application Submitted Successfully";
        String message = String.format(
            "Dear %s,\n\n" +
            "Your application for the position '%s' has been submitted successfully.\n\n" +
            "Application Details:\n" +
            "- Position: %s\n" +
            "- Department: %s\n" +
            "- Application ID: %s\n" +
            "- Submitted: %s\n\n" +
            "We will review your application and contact you regarding the next steps.\n\n" +
            "Thank you for your interest in joining our organization.\n\n" +
            "Best regards,\n" +
            "HR Team",
            application.getApplicant().getFullName(),
            application.getJobTitle(),
            application.getJobTitle(),
            application.getDepartment(),
            application.getId(),
            application.getSubmittedAt()
        );

        sendNotification(application.getApplicant().getId(), subject, message,
                        NotificationChannel.EMAIL, "APPLICATION_SUBMITTED");
    }

    @Async
    public void notifyStatusChange(Application application, ApplicationStatus previousStatus) {
        logger.info("Sending status change notification for application {} from {} to {}",
                   application.getId(), previousStatus, application.getStatus());

        String subject = getStatusChangeSubject(application.getStatus());
        String message = getStatusChangeMessage(application, previousStatus);

        sendNotification(application.getApplicant().getId(), subject, message,
                        NotificationChannel.EMAIL, "STATUS_CHANGE");
    }

    @Async
    public void notifyInterviewScheduled(Application application, String interviewDetails) {
        logger.info("Sending interview notification for application {}", application.getId());

        String subject = "Interview Update";
        String message = String.format(
            "Dear %s,\n\n" +
            "Interview update for your application for the position '%s'.\n\n" +
            "%s\n\n" +
            "Best regards,\n" +
            "HR Team",
            application.getApplicant().getFullName(),
            application.getJobTitle(),
            interviewDetails
        );

        sendNotification(application.getApplicant().getId(), subject, message,
                        NotificationChannel.EMAIL, "STATUS_CHANGE");
    }

    @Async
    public void notifyApplicationWithdrawn(Application application) {
        logger.info("Sending withdrawal notification for application {}", application.getId());

        String subject = "Application Withdrawn";
        String message = String.format(
            "Dear %s,\n\n" +
            "Your application for the position '%s' has been withdrawn as requested.\n\n" +
            "Application Details:\n" +
            "- Position: %s\n" +
            "- Application ID: %s\n" +
            "- Withdrawal Date: %s\n" +
            "- Reason: %s\n\n" +
            "You are welcome to apply for other positions or reapply for this position in the future.\n\n" +
            "Thank you for your interest in our organization.\n\n" +
            "Best regards,\n" +
            "HR Team",
            application.getApplicant().getFullName(),
            application.getJobTitle(),
            application.getJobTitle(),
            application.getId(),
            application.getWithdrawnAt(),
            application.getWithdrawalReason()
        );

        sendNotification(application.getApplicant().getId(), subject, message,
                        NotificationChannel.EMAIL, "APPLICATION_WITHDRAWN");
    }

    @Async
    public void notifyApplicationShortlisted(Application application) {
        logger.info("Sending shortlist notification for application {}", application.getId());

        String subject = "Congratulations! You've Been Shortlisted";
        String message = String.format(
            "Dear %s,\n\n" +
            "Congratulations! We are pleased to inform you that your application for the position '%s' has been shortlisted.\n\n" +
            "Application Details:\n" +
            "- Position: %s\n" +
            "- Department: %s\n" +
            "- Application ID: %s\n\n" +
            "We will be in touch soon regarding the next steps in our selection process.\n\n" +
            "Thank you for your continued interest in our organization.\n\n" +
            "Best regards,\n" +
            "HR Team",
            application.getApplicant().getFullName(),
            application.getJobTitle(),
            application.getJobTitle(),
            application.getDepartment(),
            application.getId()
        );

        sendNotification(application.getApplicant().getId(), subject, message,
                        NotificationChannel.EMAIL, "APPLICATION_SHORTLISTED");
    }

    private void sendNotification(Long applicantId, String subject, String message,
                                 NotificationChannel channel, String eventType) {
        try {
            Applicant applicant = applicantRepository.findById(applicantId)
                    .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + applicantId));

            NotificationType notificationType = mapEventTypeToNotificationType(eventType);

            Notification notification = new Notification();
            notification.setRecipientId(applicantId);
            notification.setType(notificationType);
            notification.setChannel(channel);
            notification.setPriority(getNotificationPriority(notificationType));
            notification.setTitle(subject);
            notification.setMessage(message);

            switch (channel) {
                case EMAIL:
                    notification.setEmailTo(applicant.getEmail());
                    notification.setEmailSubject(subject);
                    break;
                case IN_APP:
                case PUSH:
                case WEBHOOK:
                case MS_TEAMS:
                case BROWSER:
                    break;
            }

            boolean sent = false;
            String errorMessage = null;

            try {
                if (sqsEnabled && sqsClient != null && !sqsQueueUrl.isEmpty()) {
                    sent = publishToSqs(applicant, subject, message, channel, eventType);
                } else {
                    switch (channel) {
                        case EMAIL:
                            sent = sendEmail(applicant.getEmail(), subject, message);
                            break;
                        case IN_APP:
                            sent = true;
                            break;
                        case MS_TEAMS:
                            sent = msTeamsService != null && msTeamsService.sendNotification(subject, message, null);
                            break;
                        case PUSH:
                        case WEBHOOK:
                        case BROWSER:
                            sent = true;
                            break;
                    }
                }
            } catch (Exception e) {
                logger.error("Error sending {} notification to applicant {}: {}",
                           channel, applicantId, e.getMessage());
                errorMessage = e.getMessage();
            }

            notification.setIsDelivered(sent);
            notification.setDeliveredAt(sent ? LocalDateTime.now() : null);
            notification.setDeliveryError(errorMessage);

            notificationRepository.save(notification);

            auditLogService.logApplicantAction(applicantId,
                sent ? "NOTIFICATION_SENT" : "NOTIFICATION_FAILED",
                "NOTIFICATION",
                channel + ": " + eventType + (errorMessage != null ? " - " + errorMessage : ""));

            logger.info("Notification {} for applicant {} via {} - Status: {}",
                       eventType, applicantId, channel, sent ? "SENT" : "FAILED");

        } catch (Exception e) {
            logger.error("Failed to send notification to applicant {}: {}", applicantId, e.getMessage(), e);
        }
    }

    private boolean publishToSqs(Applicant applicant, String subject, String message,
                                 NotificationChannel channel, String eventType) {
        try {
            Map<String, Object> sqsMessage = new HashMap<>();
            sqsMessage.put("channel", channel.name());
            sqsMessage.put("eventType", eventType);
            sqsMessage.put("subject", subject);
            sqsMessage.put("message", message);
            sqsMessage.put("recipientEmail", applicant.getEmail());
            sqsMessage.put("recipientPhone", applicant.getPhone());
            sqsMessage.put("recipientName", applicant.getFullName());
            sqsMessage.put("timestamp", LocalDateTime.now().toString());

            String messageBody = objectMapper.writeValueAsString(sqsMessage);

            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(sqsQueueUrl)
                    .messageBody(messageBody)
                    .messageGroupId(channel.name())
                    .build());

            logger.info("Published {} notification to SQS for {}", eventType, applicant.getEmail());
            return true;
        } catch (Exception e) {
            logger.error("Failed to publish to SQS: {}", e.getMessage());
            return false;
        }
    }

    private boolean sendEmail(String email, String subject, String message) {
        if (!emailEnabled) {
            logger.info("Email sending is disabled - would send to {}: {}", email, subject);
            return true;
        }
        return emailService.sendEmail(email, subject, message);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForApplicant(Long applicantId, int limit) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(applicantId)
                .stream()
                .limit(limit)
                .toList();
    }

    public void markNotificationAsRead(Long notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                });
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByRecipient(userId);
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForRecipient(userId, LocalDateTime.now());
    }

    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    private NotificationType mapEventTypeToNotificationType(String eventType) {
        return switch (eventType) {
            case "APPLICATION_SUBMITTED" -> NotificationType.APPLICATION_SUBMITTED;
            case "STATUS_CHANGE" -> NotificationType.PIPELINE_STAGE_CHANGED;
            case "APPLICATION_WITHDRAWN" -> NotificationType.APPLICATION_WITHDRAWN;
            case "APPLICATION_SHORTLISTED" -> NotificationType.APPLICATION_APPROVED;
            default -> NotificationType.APPLICATION_VIEWED;
        };
    }

    private NotificationPriority getNotificationPriority(NotificationType type) {
        return switch (type) {
            case OFFER_EXTENDED, INTERVIEW_SCHEDULED, APPLICATION_REJECTED -> NotificationPriority.HIGH;
            case APPLICATION_APPROVED, APPLICATION_SUBMITTED -> NotificationPriority.MEDIUM;
            default -> NotificationPriority.LOW;
        };
    }

    private String getStatusChangeSubject(ApplicationStatus status) {
        return switch (status) {
            case SCREENING -> "Application Under Review";
            case INTERVIEW_SCHEDULED -> "Interview Scheduled";
            case INTERVIEW_COMPLETED -> "Interview Completed";
            case REFERENCE_CHECK -> "Reference Check in Progress";
            case OFFER_PENDING, OFFERED -> "Job Offer Extended";
            case OFFER_ACCEPTED -> "Offer Accepted - Welcome Aboard!";
            case OFFER_DECLINED -> "Offer Declined";
            case HIRED -> "Welcome to the Team!";
            case REJECTED -> "Application Status Update";
            default -> "Application Status Update";
        };
    }

    private String getStatusChangeMessage(Application application, ApplicationStatus previousStatus) {
        String applicantName = application.getApplicant().getFullName();
        String jobTitle = application.getJobTitle();
        String currentStatus = getStatusDisplayName(application.getStatus());

        return switch (application.getStatus()) {
            case SCREENING -> String.format(
                "Dear %s,\n\nYour application for '%s' is now under review by our hiring team.\n\n" +
                "We will contact you soon with the next steps.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            case INTERVIEW_SCHEDULED -> String.format(
                "Dear %s,\n\nGreat news! We would like to invite you for an interview for the position '%s'.\n\n" +
                "We will send you the interview details separately.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            case INTERVIEW_COMPLETED -> String.format(
                "Dear %s,\n\nThank you for taking the time to interview for the position '%s'.\n\n" +
                "We are currently reviewing all candidates and will be in touch soon.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            case OFFER_PENDING, OFFERED -> String.format(
                "Dear %s,\n\nCongratulations! We are pleased to extend an offer for the position '%s'.\n\n" +
                "Please review the offer details and let us know your decision.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            case HIRED -> String.format(
                "Dear %s,\n\nWelcome to the team! We are excited to have you join us in the role of '%s'.\n\n" +
                "We will send you onboarding information separately.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            case REJECTED -> String.format(
                "Dear %s,\n\nThank you for your interest in the position '%s'.\n\n" +
                "After careful consideration, we have decided to move forward with other candidates.\n\n" +
                "We encourage you to apply for other opportunities with us.\n\nBest regards,\nHR Team",
                applicantName, jobTitle);
            default -> String.format(
                "Dear %s,\n\nYour application for '%s' has been updated.\n\n" +
                "Current Status: %s\n\nBest regards,\nHR Team",
                applicantName, jobTitle, currentStatus);
        };
    }

    private boolean isImportantStatusChange(ApplicationStatus status) {
        return status == ApplicationStatus.INTERVIEW_SCHEDULED ||
               status == ApplicationStatus.OFFERED ||
               status == ApplicationStatus.HIRED ||
               status == ApplicationStatus.REJECTED;
    }

    private String getStatusDisplayName(ApplicationStatus status) {
        return switch (status) {
            case SUBMITTED -> "Application Submitted";
            case SCREENING -> "Under Review";
            case INTERVIEW_SCHEDULED -> "Interview Scheduled";
            case INTERVIEW_COMPLETED -> "Interview Completed";
            case REFERENCE_CHECK -> "Reference Check";
            case OFFER_PENDING -> "Offer Pending";
            case OFFERED -> "Offer Extended";
            case OFFER_ACCEPTED -> "Offer Accepted";
            case OFFER_DECLINED -> "Offer Declined";
            case HIRED -> "Hired";
            case REJECTED -> "Not Selected";
            case WITHDRAWN -> "Withdrawn";
        };
    }
}
