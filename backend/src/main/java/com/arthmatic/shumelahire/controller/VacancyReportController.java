package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.VacancyReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vacancy-reports")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class VacancyReportController {

    private final VacancyReportService vacancyReportService;

    @Autowired
    public VacancyReportController(VacancyReportService vacancyReportService) {
        this.vacancyReportService = vacancyReportService;
    }

    @GetMapping("/{jobId}/summary")
    public ResponseEntity<?> getVacancySummary(@PathVariable String jobId) {
        try {
            Map<String, Object> summary = vacancyReportService.getVacancySummaryData(jobId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate vacancy summary: " + e.getMessage()));
        }
    }

    @GetMapping("/{jobId}/summary/pdf")
    public ResponseEntity<?> downloadVacancySummaryPdf(@PathVariable String jobId) {
        try {
            byte[] pdf = vacancyReportService.generateVacancySummaryPdf(jobId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=vacancy-summary-" + jobId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate PDF: " + e.getMessage()));
        }
    }

    @GetMapping("/{jobId}/shortlist-pack/pdf")
    public ResponseEntity<?> downloadShortlistPackPdf(@PathVariable String jobId) {
        try {
            byte[] pdf = vacancyReportService.generateShortlistPackPdf(jobId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=shortlist-pack-" + jobId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate shortlist pack: " + e.getMessage()));
        }
    }

    @GetMapping("/{jobId}/demographics/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> downloadDemographicsReportPdf(@PathVariable String jobId) {
        try {
            byte[] pdf = vacancyReportService.generateDemographicsReportPdf(jobId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=demographics-report-" + jobId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate demographics report: " + e.getMessage()));
        }
    }
}
