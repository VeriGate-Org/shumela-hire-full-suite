package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.service.RequisitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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
    private UserRepository userRepository;

    @GetMapping
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
    public ResponseEntity<Requisition> getById(@PathVariable Long id) {
        return requisitionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Requisition> create(Authentication authentication, @RequestBody Requisition requisition) {
        resolveUserId(authentication).ifPresent(requisition::setCreatedBy);
        return ResponseEntity.ok(requisitionService.create(requisition));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Requisition> update(@PathVariable Long id, @RequestBody Requisition requisition) {
        return ResponseEntity.ok(requisitionService.update(id, requisition));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        requisitionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Requisition> submit(@PathVariable Long id) {
        return ResponseEntity.ok(requisitionService.submit(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Requisition> approve(@PathVariable Long id) {
        return ResponseEntity.ok(requisitionService.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Requisition> reject(@PathVariable Long id) {
        return ResponseEntity.ok(requisitionService.reject(id));
    }

    private Optional<Long> resolveUserId(Authentication authentication) {
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
