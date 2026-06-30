package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.ShortlistingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shortlisting")
public class ShortlistingController {

    @Autowired
    private ShortlistingService shortlistingService;

    @PostMapping("/job-postings/{id}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> calculateScores(@PathVariable String id) {
        return ResponseEntity.ok(shortlistingService.calculateScoresForJobPosting(id));
    }

    @PostMapping("/job-postings/{id}/auto-shortlist")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> autoShortlist(
            @PathVariable String id,
            @RequestParam(defaultValue = "60") double threshold) {
        return ResponseEntity.ok(shortlistingService.autoShortlist(id, threshold));
    }

    @GetMapping("/job-postings/{id}/scores")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getScores(@PathVariable String id) {
        return ResponseEntity.ok(shortlistingService.getShortlistingSummary(id));
    }

    @PostMapping("/scores/{id}/override")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> overrideDecision(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        boolean include = Boolean.TRUE.equals(request.get("include"));
        String reason = (String) request.get("reason");
        String userId = request.get("userId") != null
            ? request.get("userId").toString() : null;
        return ResponseEntity.ok(shortlistingService.overrideShortlistDecision(id, include, reason, userId));
    }
}
