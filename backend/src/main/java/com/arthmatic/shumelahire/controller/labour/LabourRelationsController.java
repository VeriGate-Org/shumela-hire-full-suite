package com.arthmatic.shumelahire.controller.labour;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.labour.DisciplinaryCaseResponse;
import com.arthmatic.shumelahire.dto.labour.GrievanceResponse;
import com.arthmatic.shumelahire.service.labour.LabourRelationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/labour-relations")
@FeatureGate("LABOUR_RELATIONS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class LabourRelationsController {

    @Autowired
    private LabourRelationsService labourRelationsService;

    // ---- Disciplinary Cases ----

    @PostMapping("/disciplinary")
    public ResponseEntity<?> createDisciplinaryCase(
            @RequestParam Long employeeId,
            @RequestParam String offenceCategory,
            @RequestParam String offenceDescription,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate incidentDate,
            @RequestParam Long createdBy) {
        try {
            DisciplinaryCaseResponse dc = labourRelationsService.createDisciplinaryCase(
                    employeeId, offenceCategory, offenceDescription, incidentDate, createdBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(dc);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/disciplinary/{id}")
    public ResponseEntity<?> getDisciplinaryCase(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(labourRelationsService.getDisciplinaryCase(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/disciplinary")
    public ResponseEntity<List<DisciplinaryCaseResponse>> getDisciplinaryCases(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status) {
        if (employeeId != null) {
            return ResponseEntity.ok(labourRelationsService.getDisciplinaryCasesByEmployee(employeeId));
        }
        if (status != null) {
            return ResponseEntity.ok(labourRelationsService.getDisciplinaryCasesByStatus(status));
        }
        return ResponseEntity.ok(labourRelationsService.getAllDisciplinaryCases());
    }

    @PutMapping("/disciplinary/{id}")
    public ResponseEntity<?> updateDisciplinaryCase(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String outcome,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hearingDate,
            @RequestParam(required = false) String notes) {
        try {
            return ResponseEntity.ok(labourRelationsService.updateDisciplinaryCase(id, status, outcome, hearingDate, notes));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Grievances ----

    @PostMapping("/grievances")
    public ResponseEntity<?> fileGrievance(
            @RequestParam Long employeeId,
            @RequestParam String grievanceType,
            @RequestParam String description,
            @RequestParam(required = false) Long assignedToId) {
        try {
            GrievanceResponse grievance = labourRelationsService.fileGrievance(
                    employeeId, grievanceType, description, assignedToId);
            return ResponseEntity.status(HttpStatus.CREATED).body(grievance);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/grievances/{id}")
    public ResponseEntity<?> getGrievance(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(labourRelationsService.getGrievance(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/grievances")
    public ResponseEntity<List<GrievanceResponse>> getGrievances(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status) {
        if (employeeId != null) {
            return ResponseEntity.ok(labourRelationsService.getGrievancesByEmployee(employeeId));
        }
        if (status != null) {
            return ResponseEntity.ok(labourRelationsService.getGrievancesByStatus(status));
        }
        return ResponseEntity.ok(labourRelationsService.getAllGrievances());
    }

    @PutMapping("/grievances/{id}")
    public ResponseEntity<?> updateGrievance(@PathVariable Long id,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String resolution) {
        try {
            return ResponseEntity.ok(labourRelationsService.updateGrievance(id, status, resolution));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Dashboard ----

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(labourRelationsService.getDashboardStats());
    }
}
