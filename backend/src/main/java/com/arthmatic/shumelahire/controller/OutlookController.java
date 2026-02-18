package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.integration.OutlookCalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations/outlook")
@ConditionalOnBean(OutlookCalendarService.class)
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class OutlookController {

    @Autowired
    private OutlookCalendarService outlookCalendarService;

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> request) {
        String subject = (String) request.get("subject");
        String body = (String) request.getOrDefault("body", "");
        String startStr = (String) request.get("start");
        int duration = request.get("duration") instanceof Number n ? n.intValue() : 60;
        String location = (String) request.get("location");
        String interviewerEmail = (String) request.get("interviewerEmail");
        String candidateEmail = (String) request.get("candidateEmail");

        LocalDateTime start = LocalDateTime.parse(startStr);

        String eventId = outlookCalendarService.createInterviewEvent(
            subject, body, start, duration, location, interviewerEmail, candidateEmail
        );

        if (eventId != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("eventId", eventId));
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", "Failed to create calendar event"));
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<?> cancelEvent(@PathVariable String eventId) {
        boolean cancelled = outlookCalendarService.cancelEvent(eventId);
        if (cancelled) {
            return ResponseEntity.ok(Map.of("cancelled", true));
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", "Failed to cancel calendar event"));
    }
}
