package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.WorkflowDefinition;
import com.arthmatic.shumelahire.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.arthmatic.shumelahire.annotation.FeatureGate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
@FeatureGate("WORKFLOW_MANAGEMENT")
public class WorkflowController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowController.class);

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public ResponseEntity<?> getAllWorkflows() {
        try {
            List<WorkflowDefinition> workflows = workflowService.getAllWorkflows();
            return ResponseEntity.ok(workflows);
        } catch (Exception e) {
            logger.error("Error fetching workflows", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkflow(@PathVariable String id) {
        try {
            WorkflowDefinition workflow = workflowService.getWorkflowById(id);
            return ResponseEntity.ok(workflow);
        } catch (IllegalArgumentException e) {
            logger.warn("Workflow not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching workflow {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createWorkflow(@RequestBody WorkflowDefinition workflow) {
        try {
            logger.info("Creating workflow: {}", workflow.getName());
            WorkflowDefinition created = workflowService.createWorkflow(workflow);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            logger.error("Error creating workflow", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkflow(@PathVariable String id, @RequestBody WorkflowDefinition workflow) {
        try {
            logger.info("Updating workflow: {}", id);
            WorkflowDefinition updated = workflowService.updateWorkflow(id, workflow);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to update workflow {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating workflow {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkflow(@PathVariable String id) {
        try {
            logger.info("Deleting workflow: {}", id);
            workflowService.deleteWorkflow(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to delete workflow {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting workflow {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<?> duplicateWorkflow(@PathVariable String id) {
        try {
            logger.info("Duplicating workflow: {}", id);
            WorkflowDefinition duplicated = workflowService.duplicateWorkflow(id);
            return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to duplicate workflow {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error duplicating workflow {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleWorkflow(@PathVariable String id, @RequestParam boolean isActive) {
        try {
            logger.info("Toggling workflow {} to active={}", id, isActive);
            WorkflowDefinition toggled = workflowService.toggleWorkflow(id, isActive);
            return ResponseEntity.ok(toggled);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to toggle workflow {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error toggling workflow {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }
}
