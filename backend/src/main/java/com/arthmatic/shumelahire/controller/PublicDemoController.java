package com.arthmatic.shumelahire.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Public endpoint for demo request form submissions.
 * Replaces the former Next.js API route at /api/demo.
 */
@RestController
@RequestMapping("/api/public/demo")
public class PublicDemoController {

    private static final Logger log = LoggerFactory.getLogger(PublicDemoController.class);
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final String[] REQUIRED_FIELDS = {
            "firstName", "lastName", "workEmail", "organisation",
            "jobTitle", "organisationType", "employeeCount"
    };

    private static final String[] REQUIRED_LABELS = {
            "First name", "Last name", "Work email", "Organisation",
            "Job title", "Organisation type", "Employee count"
    };

    @PostMapping
    public ResponseEntity<Map<String, Object>> requestDemo(@RequestBody Map<String, String> body) {
        // Validate required fields
        for (int i = 0; i < REQUIRED_FIELDS.length; i++) {
            String value = body.get(REQUIRED_FIELDS[i]);
            if (value == null || value.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", REQUIRED_LABELS[i] + " is required."
                ));
            }
        }

        // Validate email format
        String email = body.get("workEmail").trim();
        if (!EMAIL_REGEX.matcher(email).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Please provide a valid work email address."
            ));
        }

        // Log the demo request (placeholder for email/CRM integration)
        log.info("[Demo Request] firstName={}, lastName={}, workEmail={}, organisation={}, " +
                        "jobTitle={}, organisationType={}, employeeCount={}, timestamp={}",
                body.get("firstName").trim(),
                body.get("lastName").trim(),
                email,
                body.get("organisation").trim(),
                body.get("jobTitle").trim(),
                body.get("organisationType").trim(),
                body.get("employeeCount").trim(),
                Instant.now()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demo request received"
        ));
    }
}
