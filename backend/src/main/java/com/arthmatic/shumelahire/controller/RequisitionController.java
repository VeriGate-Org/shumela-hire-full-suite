package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.RequisitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/requisitions")
public class RequisitionController {

    @Autowired
    private RequisitionService requisitionService;

    @Autowired
    private UserDataRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Page<Requisition>> list(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {

        if (status != null) {
            try {
                RequisitionStatus rs = RequisitionStatus.valueOf(status);
                return ResponseEntity.ok(requisitionService.findByStatus(rs, pageable));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(requisitionService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> getById(@PathVariable String id) {
        return requisitionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> create(Authentication authentication, @RequestBody Requisition requisition) {
        resolveUserId(authentication).ifPresent(requisition::setCreatedBy);
        return ResponseEntity.ok(requisitionService.create(requisition));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> update(Authentication authentication, @PathVariable String id,
                                              @RequestBody Requisition requisition) {
        return ResponseEntity.ok(requisitionService.update(
                id, requisition, resolveUserId(authentication).orElse(null)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        requisitionService.delete(id, resolveUserId(authentication).orElse(null));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> submit(Authentication authentication, @PathVariable String id) {
        return ResponseEntity.ok(requisitionService.submit(
                id, resolveUserId(authentication).orElse(null), resolveUserName(authentication)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> approve(Authentication authentication, @PathVariable String id,
                                               @RequestBody(required = false) ApprovalDecisionRequest body) {
        return ResponseEntity.ok(requisitionService.approve(
                id, resolveUserId(authentication).orElse(null), resolveUserName(authentication),
                body != null ? body.comment() : null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Requisition> reject(Authentication authentication, @PathVariable String id,
                                              @RequestBody(required = false) ApprovalDecisionRequest body) {
        return ResponseEntity.ok(requisitionService.reject(
                id, resolveUserId(authentication).orElse(null), resolveUserName(authentication),
                body != null ? body.comment() : null));
    }

    /** Optional body carrying an approver's comment. */
    public record ApprovalDecisionRequest(String comment) {}

    /**
     * Display name of the acting user, captured onto the approval record so the timeline shows a
     * person rather than an identifier.
     */
    private String resolveUserName(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String name = jwt.getClaimAsString("name");
            return name != null ? name : jwt.getClaimAsString("email");
        }
        if (authentication.getPrincipal() instanceof User user) {
            String first = user.getFirstName();
            String last = user.getLastName();
            if (first != null || last != null) {
                return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
            }
            return user.getEmail();
        }
        return authentication.getName();
    }

    private Optional<String> resolveUserId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email).map(User::getId);
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return Optional.of(user.getId());
        }
        return Optional.empty();
    }
}
