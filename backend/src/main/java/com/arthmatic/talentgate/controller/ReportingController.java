package com.arthmatic.talentgate.controller;

import com.arthmatic.talentgate.service.ReportingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
public class ReportingController {

    @Autowired
    private ReportingService reportingService;

    // CSV Export Endpoints

    @GetMapping("/applications/csv")
    public ResponseEntity<String> exportApplicationsCSV(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status) {
        
        LocalDateTime start = startDate != null ? 
            LocalDateTime.parse(startDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(3);
        LocalDateTime end = endDate != null ? 
            LocalDateTime.parse(endDate + "T23:59:59") : 
            LocalDateTime.now();

        String csv = reportingService.generateApplicationsCSV(start, end, status);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=applications_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/interviews/csv")
    public ResponseEntity<String> exportInterviewsCSV(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? 
            LocalDateTime.parse(startDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(3);
        LocalDateTime end = endDate != null ? 
            LocalDateTime.parse(endDate + "T23:59:59") : 
            LocalDateTime.now();

        String csv = reportingService.generateInterviewsCSV(start, end);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=interviews_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/applicants/csv")
    public ResponseEntity<String> exportApplicantsCSV() {
        
        String csv = reportingService.generateApplicantsCSV();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=applicants_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    // Analytics Reports

    @GetMapping("/performance/csv")
    public ResponseEntity<String> exportPerformanceReportCSV(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? 
            LocalDateTime.parse(startDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(6);
        LocalDateTime end = endDate != null ? 
            LocalDateTime.parse(endDate + "T23:59:59") : 
            LocalDateTime.now();

        String csv = reportingService.generatePerformanceReportCSV(start, end);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=performance_report_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/hiring-trends/csv")
    public ResponseEntity<String> exportHiringTrendsCSV() {
        
        String csv = reportingService.generateHiringTrendsCSV();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=hiring_trends_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/interviewer-performance/csv")
    public ResponseEntity<String> exportInterviewerPerformanceCSV() {
        
        String csv = reportingService.generateInterviewerPerformanceCSV();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=interviewer_performance_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/executive-summary/csv")
    public ResponseEntity<String> exportExecutiveSummaryCSV(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start = startDate != null ? 
            LocalDateTime.parse(startDate + "T00:00:00") : 
            LocalDateTime.now().minusMonths(6);
        LocalDateTime end = endDate != null ? 
            LocalDateTime.parse(endDate + "T23:59:59") : 
            LocalDateTime.now();

        String csv = reportingService.generateExecutiveSummaryCSV(start, end);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=executive_summary_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    // Custom Report Generation

    @PostMapping("/custom/csv")
    public ResponseEntity<String> exportCustomReportCSV(@RequestBody Map<String, Object> reportConfig) {
        
        String csv = reportingService.generateCustomReport(reportConfig);

        String reportType = (String) reportConfig.get("reportType");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=custom_" + reportType + "_" + 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv");
        headers.add("Content-Type", "text/csv");

        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    // Bulk Export

    @PostMapping("/bulk/zip")
    public ResponseEntity<byte[]> exportBulkReportsZip(@RequestBody Map<String, Object> exportConfig) {
        try {
            @SuppressWarnings("unchecked")
            List<String> reportTypes = (List<String>) exportConfig.get("reportTypes");
            
            String startDateStr = (String) exportConfig.get("startDate");
            String endDateStr = (String) exportConfig.get("endDate");
            
            LocalDateTime startDate = startDateStr != null ? 
                LocalDateTime.parse(startDateStr + "T00:00:00") : 
                LocalDateTime.now().minusMonths(3);
            LocalDateTime endDate = endDateStr != null ? 
                LocalDateTime.parse(endDateStr + "T23:59:59") : 
                LocalDateTime.now();

            byte[] zipData = reportingService.generateBulkExportZip(reportTypes, startDate, endDate);

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=bulk_reports_" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".zip");
            headers.add("Content-Type", "application/zip");

            return new ResponseEntity<>(zipData, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Report Configuration Endpoints

    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> getAvailableReportTypes() {
        Map<String, Object> reportTypes = reportingService.getAvailableReportTypes();
        return ResponseEntity.ok(reportTypes);
    }

    @GetMapping("/preview/{reportType}")
    public ResponseEntity<Map<String, Object>> previewReport(
            @PathVariable String reportType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer limit) {
        
        // Return preview data for the frontend
        Map<String, Object> preview = Map.of(
            "reportType", reportType,
            "estimatedRows", getEstimatedRowCount(reportType, startDate, endDate),
            "availableFields", getAvailableFields(reportType),
            "sampleData", getSampleData(reportType, limit != null ? limit : 5)
        );
        
        return ResponseEntity.ok(preview);
    }

    // Helper Methods

    private int getEstimatedRowCount(String reportType, String startDate, String endDate) {
        // Simplified estimation logic
        switch (reportType.toLowerCase()) {
            case "applications":
                return 150; // Estimated based on typical volume
            case "interviews":
                return 75;
            case "applicants":
                return 50;
            default:
                return 10;
        }
    }

    private List<String> getAvailableFields(String reportType) {
        switch (reportType.toLowerCase()) {
            case "applications":
                return List.of("id", "applicant_name", "email", "job_title", "status", "rating", "submitted_date", "source");
            case "interviews":
                return List.of("id", "applicant_name", "job_title", "interview_type", "status", "scheduled_date", "interviewer", "rating", "recommendation");
            case "applicants":
                return List.of("id", "full_name", "email", "phone", "location", "experience", "skills", "source", "linkedin", "created_date");
            default:
                return List.of();
        }
    }

    private List<Map<String, Object>> getSampleData(String reportType, int limit) {
        // Return sample data structure for preview
        switch (reportType.toLowerCase()) {
            case "applications":
                return List.of(
                    Map.of("id", 1, "applicant_name", "John Doe", "email", "john@example.com", "job_title", "Software Engineer", "status", "Under Review"),
                    Map.of("id", 2, "applicant_name", "Jane Smith", "email", "jane@example.com", "job_title", "Product Manager", "status", "Interviewed")
                );
            case "interviews":
                return List.of(
                    Map.of("id", 1, "applicant_name", "John Doe", "interview_type", "Technical", "status", "Completed", "rating", 4.2),
                    Map.of("id", 2, "applicant_name", "Jane Smith", "interview_type", "Behavioral", "status", "Scheduled", "rating", null)
                );
            default:
                return List.of();
        }
    }

    // Report Scheduling Endpoints (for future enhancement)

    @PostMapping("/schedule")
    public ResponseEntity<Map<String, Object>> scheduleReport(@RequestBody Map<String, Object> scheduleConfig) {
        // For now, return a placeholder response
        Map<String, Object> response = Map.of(
            "message", "Report scheduling functionality will be available in future version",
            "scheduled", false,
            "config", scheduleConfig
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/scheduled")
    public ResponseEntity<List<Map<String, Object>>> getScheduledReports() {
        // Placeholder for scheduled reports list
        List<Map<String, Object>> scheduledReports = List.of(
            Map.of(
                "id", 1,
                "reportType", "performance",
                "frequency", "weekly",
                "nextRun", LocalDateTime.now().plusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "status", "active"
            )
        );
        
        return ResponseEntity.ok(scheduledReports);
    }
}
