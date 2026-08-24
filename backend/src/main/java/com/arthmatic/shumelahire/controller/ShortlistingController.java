package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.ShortlistingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shortlisting")
public class ShortlistingController {

    @Autowired
    private ShortlistingService shortlistingService;

    @Autowired
    private UserDataRepository userRepository;

    @PostMapping("/job-postings/{id}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> calculateScores(@PathVariable String id) {
        return ResponseEntity.ok(shortlistingService.calculateScoresForJobPosting(id));
    }

    @PostMapping("/job-postings/{id}/auto-shortlist")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> autoShortlist(
            @PathVariable String id,
            @RequestParam(defaultValue = "60") double threshold,
            Authentication authentication) {
        return ResponseEntity.ok(
                shortlistingService.autoShortlist(id, threshold, resolveUserId(authentication)));
    }

    @GetMapping("/job-postings/{id}/scores")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getScores(@PathVariable String id) {
        return ResponseEntity.ok(shortlistingService.getShortlistingSummary(id));
    }

    @PostMapping("/scores/{id}/override")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> overrideDecision(
            @PathVariable String id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        boolean include = Boolean.TRUE.equals(request.get("include"));
        String reason = (String) request.get("reason");

        // The actor comes from the token, never from the body. This endpoint writes an audit
        // entry naming who overrode an automated decision about a candidate; a client-supplied
        // userId would let a caller attribute their own override to a colleague, and an audit
        // record that names the wrong person is worse than no record — it looks authoritative.
        return ResponseEntity.ok(shortlistingService.overrideShortlistDecision(
                id, include, reason, resolveUserId(authentication)));
    }

    /**
     * Stored shortlist state for many applications at once.
     *
     * <p>A board or list renders a shortlist control per candidate. Letting each one read its own
     * state would put a request per card on the page — the pipeline shows every active candidate,
     * so that is an N+1 on the busiest screen in the product. This mirrors
     * {@code /api/background-checks/summary?applicationIds=}, which the pipeline already uses for
     * exactly this reason.
     */
    @GetMapping("/applications/shortlist-states")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getShortlistStates(@RequestParam String applicationIds) {
        List<String> ids = Arrays.stream(applicationIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return ResponseEntity.ok(shortlistingService.getShortlistStatesForApplications(ids));
    }

    /**
     * The stored shortlist state for one application, so a shortlist control can render what is
     * actually true instead of assuming "not shortlisted" until someone clicks it.
     */
    @GetMapping("/applications/{applicationId}/shortlist")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getShortlistState(@PathVariable String applicationId) {
        return ResponseEntity.ok(shortlistingService.getShortlistStateForApplication(applicationId));
    }

    /**
     * Include or exclude one application from the shortlist.
     *
     * <p>Keyed on the application rather than a score id so that any surface showing a candidate can
     * offer the action without first knowing whether scoring has been run for that vacancy. The
     * service computes the score if it is missing.
     *
     * <p>{@code include} defaults to true: the overwhelmingly common call is "shortlist this
     * person", and a body-less POST should do the obvious thing rather than silently exclude them.
     */
    @PostMapping("/applications/{applicationId}/shortlist")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> shortlistApplication(
            @PathVariable String applicationId,
            @RequestBody(required = false) Map<String, Object> request,
            Authentication authentication) {
        boolean include = request == null || !request.containsKey("include")
                || Boolean.TRUE.equals(request.get("include"));
        String reason = request == null ? null : (String) request.get("reason");

        return ResponseEntity.ok(shortlistingService.setShortlistedForApplication(
                applicationId, include, reason, resolveUserId(authentication)));
    }

    private String resolveUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalStateException("Unable to resolve user from authentication");
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .map(User::getId)
                        .orElseThrow(() -> new IllegalStateException("User not found for email: " + email));
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }
        throw new IllegalStateException("Unable to resolve user from authentication");
    }
}
