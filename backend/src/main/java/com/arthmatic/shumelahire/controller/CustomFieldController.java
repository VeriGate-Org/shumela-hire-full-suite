package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.employee.CustomFieldRequest;
import com.arthmatic.shumelahire.dto.employee.CustomFieldResponse;
import com.arthmatic.shumelahire.dto.employee.CustomFieldValueRequest;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.service.CustomFieldService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-fields")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class CustomFieldController {

    private static final Logger logger = LoggerFactory.getLogger(CustomFieldController.class);

    @Autowired
    private CustomFieldService customFieldService;

    @PostMapping
    public ResponseEntity<?> createField(@Valid @RequestBody CustomFieldRequest request) {
        try {
            CustomFieldResponse response = customFieldService.createField(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to create custom field: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating custom field", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateField(@PathVariable Long id,
                                        @Valid @RequestBody CustomFieldRequest request) {
        try {
            CustomFieldResponse response = customFieldService.updateField(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating custom field {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteField(@PathVariable Long id) {
        try {
            customFieldService.deleteField(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting custom field {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/entity/{entityType}")
    public ResponseEntity<?> getFieldsByEntityType(@PathVariable CustomFieldEntityType entityType) {
        try {
            List<CustomFieldResponse> fields = customFieldService.getFieldsByEntityType(entityType);
            return ResponseEntity.ok(fields);
        } catch (Exception e) {
            logger.error("Error getting custom fields for {}", entityType, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/entity/{entityType}/all")
    public ResponseEntity<?> getAllFieldsByEntityType(@PathVariable CustomFieldEntityType entityType) {
        try {
            List<CustomFieldResponse> fields = customFieldService.getAllFieldsByEntityType(entityType);
            return ResponseEntity.ok(fields);
        } catch (Exception e) {
            logger.error("Error getting all custom fields for {}", entityType, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PostMapping("/values/{entityType}/{entityId}")
    public ResponseEntity<?> setFieldValues(@PathVariable CustomFieldEntityType entityType,
                                           @PathVariable Long entityId,
                                           @Valid @RequestBody List<CustomFieldValueRequest> values) {
        try {
            customFieldService.setFieldValues(entityId, entityType, values);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error setting field values for {} {}", entityType, entityId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/values/{entityType}/{entityId}")
    public ResponseEntity<?> getFieldValues(@PathVariable CustomFieldEntityType entityType,
                                           @PathVariable Long entityId) {
        try {
            Map<String, String> values = customFieldService.getFieldValues(entityId, entityType);
            return ResponseEntity.ok(values);
        } catch (Exception e) {
            logger.error("Error getting field values for {} {}", entityType, entityId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    public static class ErrorResponse {
        private String message;
        private long timestamp;

        public ErrorResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }
}
