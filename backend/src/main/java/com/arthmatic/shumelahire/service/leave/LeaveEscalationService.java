package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class LeaveEscalationService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveEscalationService.class);

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Runs every weekday at 08:00 to check for PENDING leave requests
     * that have exceeded their policy's escalation threshold.
     */
    @Scheduled(cron = "0 0 8 * * MON-FRI")
    public void escalatePendingRequests() {
        logger.info("Running leave escalation check...");
        // Implementation: query leave_requests with status=PENDING
        // joined to leave_policies where escalation_days is set,
        // filter where DATEDIFF(NOW, created_at) > escalation_days,
        // re-assign approver to escalate_to_role and create notification.
        // This is a scheduled job stub — actual DB queries depend on the repository layer.
        logger.info("Leave escalation check complete.");
    }
}
