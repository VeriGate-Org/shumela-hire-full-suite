package com.arthmatic.shumelahire.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Public endpoint for contact enquiry form submissions.
 * Replaces the former Next.js API route at /api/contact.
 */
@RestController
@RequestMapping("/api/public/contact")
public class PublicContactController {

    private static final Logger log = LoggerFactory.getLogger(PublicContactController.class);
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitEnquiry(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String organisation = body.get("organisation");
        String subject = body.get("subject");
        String message = body.get("message");

        // Validate required fields
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Name is required."));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required."));
        }
        if (!EMAIL_REGEX.matcher(email.trim()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Please provide a valid email address."));
        }
        if (organisation == null || organisation.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Organisation is required."));
        }
        if (subject == null || subject.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Subject is required."));
        }
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Message is required."));
        }

        // Log the enquiry (placeholder for email/CRM integration)
        log.info("[Contact Enquiry] name={}, email={}, organisation={}, phone={}, subject={}, message={}, timestamp={}",
                name.trim(),
                email.trim(),
                organisation.trim(),
                body.getOrDefault("phone", ""),
                subject.trim(),
                message.trim(),
                Instant.now()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Enquiry received"
        ));
    }
}
