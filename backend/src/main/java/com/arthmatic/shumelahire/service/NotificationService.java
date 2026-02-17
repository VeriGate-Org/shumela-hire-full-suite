package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    /**
     * Notify when application status changes
     */
    @Async
    public void notifyStatusChange(Application application, String oldStatus, String newStatus) {
        try {
            logger.info("Sending status change notification for application {} from {} to {}", 
                       application.getId(), oldStatus, newStatus);
            
            // In a real implementation, this would send emails, SMS, or push notifications
            // For now, we'll just log the notification
            
            String message = String.format(
                "Dear %s, your application for %s has been updated from %s to %s.",
                application.getApplicant().getFullName(),
                application.getJobTitle(),
                oldStatus,
                newStatus
            );
            
            logger.info("Notification message: {}", message);
            
        } catch (Exception e) {
            logger.error("Failed to send status change notification for application {}", 
                        application.getId(), e);
        }
    }
    
    /**
     * Notify when application is submitted
     */
    @Async
    public void notifyApplicationSubmitted(Application application) {
        try {
            logger.info("Sending application submitted notification for application {}", 
                       application.getId());
            
            String message = String.format(
                "Dear %s, we have received your application for %s. We will review it and get back to you soon.",
                application.getApplicant().getFullName(),
                application.getJobTitle()
            );
            
            logger.info("Notification message: {}", message);
            
        } catch (Exception e) {
            logger.error("Failed to send application submitted notification for application {}", 
                        application.getId(), e);
        }
    }
    
    /**
     * Notify when interview is scheduled
     */
    @Async
    public void notifyInterviewScheduled(Application application, String interviewDetails) {
        try {
            logger.info("Sending interview scheduled notification for application {}", 
                       application.getId());
            
            String message = String.format(
                "Dear %s, your interview for %s has been scheduled. Details: %s",
                application.getApplicant().getFullName(),
                application.getJobTitle(),
                interviewDetails
            );
            
            logger.info("Notification message: {}", message);
            
        } catch (Exception e) {
            logger.error("Failed to send interview scheduled notification for application {}", 
                        application.getId(), e);
        }
    }
    
    /**
     * Notify when offer is extended
     */
    @Async
    public void notifyOfferExtended(Application application, String offerDetails) {
        try {
            logger.info("Sending offer extended notification for application {}", 
                       application.getId());
            
            String message = String.format(
                "Dear %s, congratulations! We are pleased to offer you the position of %s. Details: %s",
                application.getApplicant().getFullName(),
                application.getJobTitle(),
                offerDetails
            );
            
            logger.info("Notification message: {}", message);
            
        } catch (Exception e) {
            logger.error("Failed to send offer extended notification for application {}", 
                        application.getId(), e);
        }
    }
    
    /**
     * Send general notification
     */
    @Async
    public void sendNotification(String recipient, String subject, String message) {
        try {
            logger.info("Sending notification to {}: {}", recipient, subject);
            logger.info("Message: {}", message);
            
            // In a real implementation, this would use email service, SMS service, etc.
            
        } catch (Exception e) {
            logger.error("Failed to send notification to {}", recipient, e);
        }
    }
}
