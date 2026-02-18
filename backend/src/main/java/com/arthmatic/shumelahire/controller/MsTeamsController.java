package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.integration.MsTeamsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/integrations/ms-teams")
@ConditionalOnBean(MsTeamsService.class)
public class MsTeamsController {

    @Autowired
    private MsTeamsService msTeamsService;

    @PostMapping("/test")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> sendTestNotification() {
        boolean sent = msTeamsService.sendNotification(
            "ShumelaHire Test",
            "This is a test notification from ShumelaHire.",
            null
        );
        return ResponseEntity.ok(Map.of("sent", sent));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> payload) {
        // Handle incoming Teams events (e.g., adaptive card actions)
        return ResponseEntity.ok().build();
    }
}
