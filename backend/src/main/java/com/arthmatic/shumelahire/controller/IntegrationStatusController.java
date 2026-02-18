package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.integration.EmailService;
import com.arthmatic.shumelahire.service.integration.MsTeamsService;
import com.arthmatic.shumelahire.service.integration.OutlookCalendarService;
import com.arthmatic.shumelahire.service.integration.SesEmailService;
import com.arthmatic.shumelahire.service.jobboard.JobBoardConnectorRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/integrations")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class IntegrationStatusController {

    @Autowired(required = false)
    private MsTeamsService msTeamsService;

    @Autowired(required = false)
    private OutlookCalendarService outlookCalendarService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JobBoardConnectorRegistry connectorRegistry;

    @Value("${docusign.integration-key:}")
    private String docusignIntegrationKey;

    @Value("${docusign.private-key:}")
    private String docusignPrivateKey;

    @Value("${job-boards.linkedin.enabled:false}")
    private boolean linkedInEnabled;

    @Value("${job-boards.indeed.enabled:false}")
    private boolean indeedEnabled;

    @Value("${job-boards.pnet.enabled:false}")
    private boolean pnetEnabled;

    @Value("${job-boards.career-junction.enabled:false}")
    private boolean careerJunctionEnabled;

    @Value("${ses.enabled:false}")
    private boolean sesEnabled;

    @Value("${microsoft.enabled:false}")
    private boolean microsoftEnabled;

    @GetMapping("/status")
    public ResponseEntity<List<Map<String, Object>>> getIntegrationStatus() {
        List<Map<String, Object>> integrations = new ArrayList<>();

        // DocuSign
        integrations.add(buildStatus("docusign", "DocuSign", "E-Signature",
            docusignIntegrationKey != null && !docusignIntegrationKey.isBlank(),
            docusignPrivateKey != null && !docusignPrivateKey.isBlank() ? "connected" : "disconnected"));

        // LinkedIn Jobs
        integrations.add(buildStatus("linkedin", "LinkedIn Jobs", "Job Boards",
            linkedInEnabled, linkedInEnabled ? "connected" : "disconnected"));

        // Indeed
        integrations.add(buildStatus("indeed", "Indeed", "Job Boards",
            indeedEnabled, indeedEnabled ? "connected" : "disconnected"));

        // PNet
        integrations.add(buildStatus("pnet", "PNet", "Job Boards",
            pnetEnabled, pnetEnabled ? "connected" : "disconnected"));

        // CareerJunction
        integrations.add(buildStatus("career-junction", "CareerJunction", "Job Boards",
            careerJunctionEnabled, careerJunctionEnabled ? "connected" : "disconnected"));

        // MS Teams
        integrations.add(buildStatus("ms-teams", "Microsoft Teams", "Communication",
            msTeamsService != null, msTeamsService != null ? "connected" : "disconnected"));

        // Outlook
        integrations.add(buildStatus("outlook", "Outlook Calendar", "Communication",
            outlookCalendarService != null, outlookCalendarService != null ? "connected" : "disconnected"));

        // AWS SES
        integrations.add(buildStatus("aws-ses", "AWS SES", "Email",
            sesEnabled && emailService instanceof SesEmailService,
            sesEnabled ? "connected" : "disconnected"));

        return ResponseEntity.ok(integrations);
    }

    private Map<String, Object> buildStatus(String id, String name, String category,
                                             boolean configured, String status) {
        Map<String, Object> integration = new LinkedHashMap<>();
        integration.put("id", id);
        integration.put("name", name);
        integration.put("category", category);
        integration.put("configured", configured);
        integration.put("status", status);
        return integration;
    }
}
