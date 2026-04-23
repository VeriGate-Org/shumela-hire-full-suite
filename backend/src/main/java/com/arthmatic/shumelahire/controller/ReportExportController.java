package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.ReportExportJobResponse;
import com.arthmatic.shumelahire.dto.ReportExportRequest;
import com.arthmatic.shumelahire.service.ReportExportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports/export")
@FeatureGate("REPORT_EXPORT")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class ReportExportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportExportController.class);

    @Autowired
    private ReportExportService reportExportService;

    @PostMapping
    public ResponseEntity<?> exportReport(@Valid @RequestBody ReportExportRequest request) {
        try {
            ReportExportJobResponse response = reportExportService.queueExport(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<ReportExportJobResponse>> getJobs(
            @RequestParam(required = false) String employeeId) {
        if (employeeId != null) {
            return ResponseEntity.ok(reportExportService.getByUser(employeeId));
        }
        return ResponseEntity.ok(reportExportService.getAll());
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> getJob(@PathVariable String id) {
        try {
            return ResponseEntity.ok(reportExportService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
