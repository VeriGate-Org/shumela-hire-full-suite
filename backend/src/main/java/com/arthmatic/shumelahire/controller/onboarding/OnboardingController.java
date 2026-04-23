package com.arthmatic.shumelahire.controller.onboarding;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.onboarding.*;
import com.arthmatic.shumelahire.repository.OnboardingTemplateDataRepository;
import com.arthmatic.shumelahire.repository.OnboardingChecklistDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
@FeatureGate("EMPLOYEE_SELF_SERVICE")
public class OnboardingController {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingController.class);

    @Autowired
    private OnboardingTemplateDataRepository templateRepository;

    @Autowired
    private OnboardingChecklistDataRepository checklistRepository;

    @Autowired
    private AuditLogService auditLogService;

    // ---- Templates ----

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getTemplate(@PathVariable String id) {
        return templateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createTemplate(@RequestBody OnboardingTemplate template) {
        try {
            OnboardingTemplate saved = templateRepository.save(template);
            logger.info("Created onboarding template: {}", saved.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateTemplate(@PathVariable String id,
                                            @RequestBody OnboardingTemplate request) {
        try {
            OnboardingTemplate template = templateRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Template not found: " + id));
            if (request.getName() != null) template.setName(request.getName());
            if (request.getDescription() != null) template.setDescription(request.getDescription());
            if (request.getDepartment() != null) template.setDepartment(request.getDepartment());
            if (request.getIsActive() != null) template.setIsActive(request.getIsActive());
            if (request.getItems() != null) template.setItems(request.getItems());
            template.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(templateRepository.save(template));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deleteTemplate(@PathVariable String id) {
        templateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Checklists ----

    @GetMapping("/checklists")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> getChecklists(@RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(checklistRepository.findByStatus(status));
        }
        return ResponseEntity.ok(checklistRepository.findAll());
    }

    @GetMapping("/checklists/employee/{employeeId}")
    public ResponseEntity<?> getChecklistsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(checklistRepository.findByEmployeeId(employeeId));
    }

    @GetMapping("/checklists/{id}")
    public ResponseEntity<?> getChecklist(@PathVariable String id) {
        return checklistRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/checklists")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createChecklist(@RequestBody Map<String, Object> request) {
        try {
            String employeeId = request.get("employeeId").toString();
            String templateId = request.get("templateId").toString();

            OnboardingTemplate template = templateRepository.findById(templateId)
                    .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId));

            OnboardingChecklist checklist = new OnboardingChecklist();
            checklist.setEmployeeId(employeeId);
            checklist.setTemplateId(templateId);
            checklist.setStartDate(LocalDate.now());

            // Create items from template
            if (template.getItems() != null) {
                List<OnboardingChecklistItem> items = template.getItems().stream().map(ti -> {
                    OnboardingChecklistItem item = new OnboardingChecklistItem();
                    item.setTemplateItemId(ti.getId());
                    item.setTitle(ti.getTitle());
                    item.setDescription(ti.getDescription());
                    item.setCategory(ti.getCategory().name());
                    item.setIsRequired(ti.getIsRequired());
                    item.setSortOrder(ti.getSortOrder());
                    if (ti.getDueOffsetDays() != null && ti.getDueOffsetDays() > 0) {
                        item.setDueDate(LocalDate.now().plusDays(ti.getDueOffsetDays()));
                    }
                    return item;
                }).toList();
                checklist.setItems(items);

                // Set due date based on max offset
                int maxOffset = template.getItems().stream()
                        .mapToInt(i -> i.getDueOffsetDays() != null ? i.getDueOffsetDays() : 0)
                        .max().orElse(30);
                checklist.setDueDate(LocalDate.now().plusDays(maxOffset));
            }

            OnboardingChecklist saved = checklistRepository.save(checklist);
            auditLogService.saveLog(employeeId.toString(), "CREATE", "ONBOARDING_CHECKLIST",
                    saved.getId().toString(), "Created onboarding checklist from template: " + template.getName());
            logger.info("Created onboarding checklist for employee {}", employeeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/checklists/{checklistId}/items/{itemId}")
    public ResponseEntity<?> updateChecklistItem(@PathVariable String checklistId,
                                                  @PathVariable String itemId,
                                                  @RequestBody Map<String, Object> request) {
        try {
            OnboardingChecklist checklist = checklistRepository.findById(checklistId)
                    .orElseThrow(() -> new IllegalArgumentException("Checklist not found: " + checklistId));

            if (checklist.getItems() != null) {
                for (OnboardingChecklistItem item : checklist.getItems()) {
                    if (item.getId().equals(itemId)) {
                        String status = (String) request.get("status");
                        if (status != null) {
                            item.setStatus(status);
                            if ("COMPLETED".equals(status)) {
                                item.setCompletedAt(LocalDateTime.now());
                                item.setCompletedBy((String) request.get("completedBy"));
                            }
                        }
                        if (request.containsKey("notes")) {
                            item.setNotes((String) request.get("notes"));
                        }
                        break;
                    }
                }

                // Check if all items completed
                boolean allDone = checklist.getItems().stream()
                        .allMatch(i -> "COMPLETED".equals(i.getStatus()) || !i.getIsRequired());
                if (allDone) {
                    checklist.setStatus(OnboardingChecklist.ChecklistStatus.COMPLETED);
                }
            }

            checklist.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(checklistRepository.save(checklist));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/checklists/{id}/progress")
    public ResponseEntity<?> getProgress(@PathVariable String id) {
        return checklistRepository.findById(id)
                .map(c -> ResponseEntity.ok(Map.of(
                        "completed", c.getCompletedCount(),
                        "total", c.getTotalCount(),
                        "percent", c.getProgressPercent(),
                        "status", c.getStatus().name()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
