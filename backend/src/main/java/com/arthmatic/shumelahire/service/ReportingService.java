package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ReportingService {

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private ApplicantDataRepository applicantRepository;

    @Autowired
    private PerformanceAnalyticsService performanceAnalyticsService;

    // CSV Generation Methods

    public String generateApplicationsCSV(LocalDateTime startDate, LocalDateTime endDate, String status) {
        StringBuilder csv = new StringBuilder();
        
        // CSV Headers
        csv.append("ID,Applicant Name,Email,Job Title,Status,Rating,Submitted Date,Updated Date,Experience,Skills\n");
        
        // Get applications data
        List<Application> applications;
        if (startDate != null && endDate != null) {
            applications = applicationRepository.findApplicationsSubmittedBetween(startDate, endDate);
        } else {
            applications = applicationRepository.findAll();
        }
        if (status != null) {
            applications = applications.stream()
                .filter(a -> status.equals(a.getStatus().name()))
                .collect(Collectors.toList());
        }
        
        for (var app : applications) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                app.getId(),
                app.getApplicant().getFullName(),
                app.getApplicant().getEmail(),
                app.getJobTitle(),
                app.getStatus(),
                app.getRating() != null ? app.getRating() : "",
                app.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                app.getUpdatedAt() != null ? app.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "",
                app.getApplicant().getExperience() != null ? app.getApplicant().getExperience() : "",
                app.getApplicant().getSkills() != null ? app.getApplicant().getSkills().replace("\"", "\"\"") : ""
            ));
        }
        
        return csv.toString();
    }

    public String generateInterviewsCSV(LocalDateTime startDate, LocalDateTime endDate) {
        StringBuilder csv = new StringBuilder();
        
        // CSV Headers
        csv.append("ID,Applicant Name,Job Title,Interview Type,Status,Scheduled Date,Interviewer,Rating,Technical Score,Communication Score,Cultural Score,Recommendation,Feedback\n");
        
        // Get interviews data
        List<Interview> interviews = interviewRepository.findByScheduledAtBetween(startDate, endDate);

        for (Interview interview : interviews) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                interview.getId(),
                interview.getApplication().getApplicant().getFullName(),
                interview.getApplication().getJobTitle(),
                interview.getInterviewType(),
                interview.getStatus(),
                interview.getScheduledDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                interview.getInterviewerName(),
                interview.getRating() != null ? interview.getRating() : "",
                interview.getTechnicalScore() != null ? interview.getTechnicalScore() : "",
                interview.getCommunicationScore() != null ? interview.getCommunicationScore() : "",
                interview.getCulturalFitScore() != null ? interview.getCulturalFitScore() : "",
                interview.getRecommendation(),
                interview.getFeedback() != null ? interview.getFeedback().replace("\"", "\"\"") : ""
            ));
        }
        
        return csv.toString();
    }

    public String generateApplicantsCSV() {
        StringBuilder csv = new StringBuilder();
        
        // CSV Headers
        csv.append("ID,Full Name,Email,Phone,Location,Experience,Skills,Source,LinkedIn,Created Date\n");
        
        // Get all applicants
        var applicants = applicantRepository.findAll();
        
        for (var applicant : applicants) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                applicant.getId(),
                applicant.getFullName(),
                applicant.getEmail(),
                applicant.getPhone() != null ? applicant.getPhone() : "",
                applicant.getLocation() != null ? applicant.getLocation() : "",
                applicant.getExperience() != null ? applicant.getExperience() : "",
                applicant.getSkills() != null ? applicant.getSkills().replace("\"", "\"\"") : "",
                applicant.getSource() != null ? applicant.getSource() : "",
                applicant.getLinkedinUrl() != null ? applicant.getLinkedinUrl() : "",
                applicant.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ));
        }
        
        return csv.toString();
    }

    // Analytics Reports

    public String generatePerformanceReportCSV(LocalDateTime startDate, LocalDateTime endDate) {
        StringBuilder csv = new StringBuilder();
        
        Map<String, Object> analytics = performanceAnalyticsService.getRecruitmentMetrics();
        Map<String, Object> interviewMetrics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        
        // Performance Summary Report
        csv.append("ShumelaHire Performance Report\n");
        csv.append("Generated on: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n");
        csv.append("Period: ").append(startDate.format(DateTimeFormatter.ISO_LOCAL_DATE)).append(" to ").append(endDate.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\n\n");
        
        // KPIs Section
        csv.append("KEY PERFORMANCE INDICATORS\n");
        csv.append("Metric,Value\n");
        
        Map<String, Object> timeToHire = (Map<String, Object>) analytics.get("timeToHire");
        Map<String, Object> conversionRates = (Map<String, Object>) analytics.get("conversionRates");
        Map<String, Object> costMetrics = (Map<String, Object>) analytics.get("costMetrics");
        Map<String, Object> schedulingMetrics = (Map<String, Object>) interviewMetrics.get("schedulingMetrics");
        
        csv.append("Average Time to Hire (days),").append(timeToHire.get("averageDays")).append("\n");
        csv.append("Overall Conversion Rate (%),").append(conversionRates.get("overallConversion")).append("\n");
        csv.append("Cost Per Hire ($),").append(costMetrics.get("costPerHire")).append("\n");
        csv.append("Total Interviews Conducted,").append(schedulingMetrics.get("totalInterviews")).append("\n");
        csv.append("Interview Completion Rate (%),").append(schedulingMetrics.get("completionRate")).append("\n");
        
        csv.append("\n");
        
        // Source Effectiveness
        csv.append("RECRUITMENT SOURCE EFFECTIVENESS\n");
        csv.append("Source,Total Applications,Hires,Conversion Rate (%)\n");
        
        Map<String, Object> sourceData = (Map<String, Object>) analytics.get("sourceEffectiveness");
        Map<String, Map<String, Object>> bySource = (Map<String, Map<String, Object>>) sourceData.get("bySource");
        
        for (Map.Entry<String, Map<String, Object>> entry : bySource.entrySet()) {
            Map<String, Object> data = entry.getValue();
            csv.append(entry.getKey()).append(",")
               .append(data.get("totalApplications")).append(",")
               .append(data.get("hires")).append(",")
               .append(data.get("conversionRate")).append("\n");
        }
        
        return csv.toString();
    }

    public String generateHiringTrendsCSV() {
        StringBuilder csv = new StringBuilder();
        
        Map<String, Object> trends = performanceAnalyticsService.getHiringTrendsAnalysis();
        
        csv.append("HIRING TRENDS REPORT\n");
        csv.append("Generated on: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");
        
        // Monthly trends
        csv.append("MONTHLY HIRING TRENDS\n");
        csv.append("Year,Month,Hires,Applications\n");
        
        List<Map<String, Object>> monthlyTrends = (List<Map<String, Object>>) trends.get("monthlyTrends");
        for (Map<String, Object> trend : monthlyTrends) {
            csv.append(trend.get("year")).append(",")
               .append(trend.get("month")).append(",")
               .append(trend.get("hires")).append(",")
               .append(trend.get("applications")).append("\n");
        }
        
        csv.append("\n");
        
        // Department patterns
        csv.append("DEPARTMENT HIRING PATTERNS\n");
        csv.append("Department,Total Hires\n");
        
        Map<String, Object> deptPatterns = (Map<String, Object>) trends.get("departmentPatterns");
        Map<String, Long> byDepartment = (Map<String, Long>) deptPatterns.get("byDepartment");
        
        for (Map.Entry<String, Long> entry : byDepartment.entrySet()) {
            csv.append(entry.getKey()).append(",").append(entry.getValue()).append("\n");
        }
        
        return csv.toString();
    }

    public String generateInterviewerPerformanceCSV() {
        StringBuilder csv = new StringBuilder();
        
        Map<String, Object> interviewAnalytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        
        csv.append("INTERVIEWER PERFORMANCE REPORT\n");
        csv.append("Generated on: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");
        
        csv.append("Interviewer,Total Interviews,Average Rating,Technical Score,Communication Score,Cultural Fit Score\n");
        
        List<Map<String, Object>> interviewerStats = (List<Map<String, Object>>) interviewAnalytics.get("interviewerStats");
        for (Map<String, Object> stat : interviewerStats) {
            csv.append(stat.get("interviewerName")).append(",")
               .append(stat.get("totalInterviews")).append(",")
               .append(stat.get("averageRating")).append(",")
               .append(stat.get("averageTechnicalScore")).append(",")
               .append(stat.get("averageCommunicationScore")).append(",")
               .append(stat.get("averageCulturalScore")).append("\n");
        }
        
        return csv.toString();
    }

    // Executive Summary Report
    public String generateExecutiveSummaryCSV(LocalDateTime startDate, LocalDateTime endDate) {
        StringBuilder csv = new StringBuilder();
        
        Map<String, Object> recruitmentMetrics = performanceAnalyticsService.getRecruitmentMetrics();
        Map<String, Object> interviewMetrics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        Map<String, Object> efficiencyMetrics = performanceAnalyticsService.getRecruitmentEfficiencyMetrics();
        
        csv.append("EXECUTIVE SUMMARY REPORT\n");
        csv.append("ShumelaHire Performance\n");
        csv.append("Report Period: ").append(startDate.format(DateTimeFormatter.ISO_LOCAL_DATE)).append(" to ").append(endDate.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\n");
        csv.append("Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");
        
        // Executive KPIs
        csv.append("EXECUTIVE KEY PERFORMANCE INDICATORS\n");
        csv.append("Metric,Current Value,Target,Status\n");
        
        Map<String, Object> timeToHire = (Map<String, Object>) recruitmentMetrics.get("timeToHire");
        Map<String, Object> conversionRates = (Map<String, Object>) recruitmentMetrics.get("conversionRates");
        Map<String, Object> costMetrics = (Map<String, Object>) recruitmentMetrics.get("costMetrics");
        
        double avgTimeToHire = (Double) timeToHire.get("averageDays");
        double overallConversion = (Double) conversionRates.get("overallConversion");
        double costPerHire = (Double) costMetrics.get("costPerHire");
        
        csv.append("Average Time to Hire (days),").append(avgTimeToHire).append(",30,")
           .append(avgTimeToHire <= 30 ? "On Target" : "Needs Improvement").append("\n");
        csv.append("Overall Conversion Rate (%),").append(overallConversion).append(",15,")
           .append(overallConversion >= 15 ? "Exceeding" : "Below Target").append("\n");
        csv.append("Cost per Hire ($),").append(costPerHire).append(",4000,")
           .append(costPerHire <= 4000 ? "Within Budget" : "Over Budget").append("\n");
        
        csv.append("\n");
        
        // Process Efficiency
        csv.append("PROCESS EFFICIENCY ANALYSIS\n");
        csv.append("Area,Score,Recommendation\n");
        
        List<Map<String, Object>> bottlenecks = (List<Map<String, Object>>) efficiencyMetrics.get("bottlenecks");
        for (Map<String, Object> bottleneck : bottlenecks) {
            csv.append(bottleneck.get("stage")).append(",")
               .append(bottleneck.get("bottleneckScore")).append(",")
               .append(bottleneck.get("impact").equals("High") ? "Immediate attention required" : "Monitor closely")
               .append("\n");
        }
        
        csv.append("\n");
        
        // Strategic Recommendations
        csv.append("STRATEGIC RECOMMENDATIONS\n");
        csv.append("Priority,Area,Recommendation,Expected Impact\n");
        
        if (avgTimeToHire > 30) {
            csv.append("High,Hiring Speed,Streamline interview scheduling process,Reduce time-to-hire by 20%\n");
        }
        
        if (overallConversion < 15) {
            csv.append("High,Conversion Rate,Improve candidate screening and job matching,Increase conversion by 25%\n");
        }
        
        if (costPerHire > 4000) {
            csv.append("Medium,Cost Management,Optimize recruitment source allocation,Reduce cost per hire by 15%\n");
        }
        
        csv.append("Low,Process Automation,Implement additional automation tools,Improve efficiency by 30%\n");
        
        return csv.toString();
    }

    // Custom Report Generator
    public String generateCustomReport(Map<String, Object> reportConfig) {
        StringBuilder csv = new StringBuilder();
        
        String reportType = (String) reportConfig.get("reportType");
        LocalDateTime startDate = (LocalDateTime) reportConfig.get("startDate");
        LocalDateTime endDate = (LocalDateTime) reportConfig.get("endDate");
        List<String> fields = (List<String>) reportConfig.get("fields");
        Map<String, String> filters = (Map<String, String>) reportConfig.get("filters");
        
        csv.append("CUSTOM REPORT: ").append(reportType.toUpperCase()).append("\n");
        csv.append("Period: ").append(startDate.format(DateTimeFormatter.ISO_LOCAL_DATE))
           .append(" to ").append(endDate.format(DateTimeFormatter.ISO_LOCAL_DATE)).append("\n");
        csv.append("Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");
        
        // Build headers based on selected fields
        csv.append(String.join(",", fields)).append("\n");
        
        // Generate data based on report type
        switch (reportType.toLowerCase()) {
            case "applications":
                return generateCustomApplicationsReport(csv, startDate, endDate, fields, filters);
            case "interviews":
                return generateCustomInterviewsReport(csv, startDate, endDate, fields, filters);
            case "analytics":
                return generateCustomAnalyticsReport(csv, startDate, endDate, fields, filters);
            default:
                csv.append("Unknown report type: ").append(reportType).append("\n");
                break;
        }
        
        return csv.toString();
    }

    private String generateCustomApplicationsReport(StringBuilder csv, LocalDateTime startDate, LocalDateTime endDate, List<String> fields, Map<String, String> filters) {
        List<Application> applications = applicationRepository.findApplicationsSubmittedBetween(startDate, endDate);
        String filterStatus = filters.get("status");
        String filterKeyword = filters.get("keyword");
        String filterJobTitle = filters.get("jobTitle");
        if (filterStatus != null) {
            applications = applications.stream()
                .filter(a -> filterStatus.equals(a.getStatus().name()))
                .collect(Collectors.toList());
        }
        if (filterKeyword != null) {
            String kw = filterKeyword.toLowerCase();
            applications = applications.stream()
                .filter(a -> a.getApplicant().getFullName().toLowerCase().contains(kw) ||
                             (a.getJobTitle() != null && a.getJobTitle().toLowerCase().contains(kw)))
                .collect(Collectors.toList());
        }
        if (filterJobTitle != null) {
            applications = applications.stream()
                .filter(a -> filterJobTitle.equals(a.getJobTitle()))
                .collect(Collectors.toList());
        }
        
        for (var app : applications) {
            List<String> values = new ArrayList<>();
            for (String field : fields) {
                switch (field.toLowerCase()) {
                    case "id":
                        values.add(app.getId());
                        break;
                    case "applicant_name":
                        values.add(app.getApplicant().getFullName());
                        break;
                    case "email":
                        values.add(app.getApplicant().getEmail());
                        break;
                    case "job_title":
                        values.add(app.getJobTitle());
                        break;
                    case "status":
                        values.add(app.getStatus().name());
                        break;
                    case "rating":
                        values.add(app.getRating() != null ? String.valueOf(app.getRating()) : "");
                        break;
                    case "submitted_date":
                        values.add(app.getSubmittedAt().format(DateTimeFormatter.ISO_LOCAL_DATE));
                        break;
                    case "source":
                        values.add(app.getApplicant().getSource() != null ? app.getApplicant().getSource() : "");
                        break;
                    default:
                        values.add("");
                        break;
                }
            }
            csv.append(String.join(",", values)).append("\n");
        }
        
        return csv.toString();
    }

    private String generateCustomInterviewsReport(StringBuilder csv, LocalDateTime startDate, LocalDateTime endDate, List<String> fields, Map<String, String> filters) {
        List<Interview> interviews = interviewRepository.findByScheduledAtBetween(startDate, endDate);
        
        // Apply additional filters
        if (filters.get("interviewType") != null) {
            interviews = interviews.stream()
                .filter(i -> i.getInterviewType().name().equals(filters.get("interviewType")))
                .collect(Collectors.toList());
        }
        
        for (var interview : interviews) {
            List<String> values = new ArrayList<>();
            for (String field : fields) {
                switch (field.toLowerCase()) {
                    case "id":
                        values.add(interview.getId());
                        break;
                    case "applicant_name":
                        values.add(interview.getApplication().getApplicant().getFullName());
                        break;
                    case "job_title":
                        values.add(interview.getApplication().getJobTitle());
                        break;
                    case "interview_type":
                        values.add(interview.getInterviewType().name());
                        break;
                    case "status":
                        values.add(interview.getStatus().name());
                        break;
                    case "scheduled_date":
                        values.add(interview.getScheduledDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                        break;
                    case "interviewer":
                        values.add(interview.getInterviewerName());
                        break;
                    case "rating":
                        values.add(interview.getRating() != null ? String.valueOf(interview.getRating()) : "");
                        break;
                    case "recommendation":
                        values.add(interview.getRecommendation() != null ? interview.getRecommendation().name() : "");
                        break;
                    default:
                        values.add("");
                        break;
                }
            }
            csv.append(String.join(",", values)).append("\n");
        }
        
        return csv.toString();
    }

    private String generateCustomAnalyticsReport(StringBuilder csv, LocalDateTime startDate, LocalDateTime endDate, List<String> fields, Map<String, String> filters) {
        Map<String, Object> analytics = performanceAnalyticsService.getRecruitmentMetrics();
        Map<String, Object> interviewAnalytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        
        // Generate analytics summary based on selected fields
        for (String field : fields) {
            switch (field.toLowerCase()) {
                case "time_to_hire":
                    Map<String, Object> timeToHire = (Map<String, Object>) analytics.get("timeToHire");
                    csv.append("Time to Hire (avg),").append(timeToHire.get("averageDays")).append(" days\n");
                    break;
                case "conversion_rate":
                    Map<String, Object> conversionRates = (Map<String, Object>) analytics.get("conversionRates");
                    csv.append("Overall Conversion Rate,").append(conversionRates.get("overallConversion")).append("%\n");
                    break;
                case "cost_per_hire":
                    Map<String, Object> costMetrics = (Map<String, Object>) analytics.get("costMetrics");
                    csv.append("Cost per Hire,$").append(costMetrics.get("costPerHire")).append("\n");
                    break;
                case "interview_completion":
                    Map<String, Object> schedulingMetrics = (Map<String, Object>) interviewAnalytics.get("schedulingMetrics");
                    csv.append("Interview Completion Rate,").append(schedulingMetrics.get("completionRate")).append("%\n");
                    break;
            }
        }
        
        return csv.toString();
    }

    // Bulk Export Methods
    public byte[] generateBulkExportZip(List<String> reportTypes, LocalDateTime startDate, LocalDateTime endDate) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);
        
        for (String reportType : reportTypes) {
            String filename;
            String content;
            
            switch (reportType.toLowerCase()) {
                case "applications":
                    filename = "applications_" + startDate.toLocalDate() + "_to_" + endDate.toLocalDate() + ".csv";
                    content = generateApplicationsCSV(startDate, endDate, null);
                    break;
                case "interviews":
                    filename = "interviews_" + startDate.toLocalDate() + "_to_" + endDate.toLocalDate() + ".csv";
                    content = generateInterviewsCSV(startDate, endDate);
                    break;
                case "performance":
                    filename = "performance_report_" + LocalDateTime.now().toLocalDate() + ".csv";
                    content = generatePerformanceReportCSV(startDate, endDate);
                    break;
                case "executive":
                    filename = "executive_summary_" + LocalDateTime.now().toLocalDate() + ".csv";
                    content = generateExecutiveSummaryCSV(startDate, endDate);
                    break;
                case "trends":
                    filename = "hiring_trends_" + LocalDateTime.now().toLocalDate() + ".csv";
                    content = generateHiringTrendsCSV();
                    break;
                default:
                    continue;
            }
            
            ZipEntry entry = new ZipEntry(filename);
            zos.putNextEntry(entry);
            zos.write(content.getBytes());
            zos.closeEntry();
        }
        
        zos.close();
        return baos.toByteArray();
    }

    // Report Scheduling Support
    public Map<String, Object> getAvailableReportTypes() {
        Map<String, Object> reportTypes = new HashMap<>();
        
        reportTypes.put("applications", Map.of(
            "name", "Applications Report",
            "description", "Detailed application data with filtering options",
            "fields", Arrays.asList("id", "applicant_name", "email", "job_title", "status", "rating", "submitted_date", "source")
        ));
        
        reportTypes.put("interviews", Map.of(
            "name", "Interviews Report", 
            "description", "Interview records with performance metrics",
            "fields", Arrays.asList("id", "applicant_name", "job_title", "interview_type", "status", "scheduled_date", "interviewer", "rating", "recommendation")
        ));
        
        reportTypes.put("performance", Map.of(
            "name", "Performance Analytics",
            "description", "KPIs and performance metrics summary",
            "fields", Arrays.asList("time_to_hire", "conversion_rate", "cost_per_hire", "interview_completion")
        ));
        
        reportTypes.put("executive", Map.of(
            "name", "Executive Summary",
            "description", "High-level performance overview for executives",
            "fields", Arrays.asList("kpis", "efficiency", "recommendations", "trends")
        ));
        
        reportTypes.put("trends", Map.of(
            "name", "Hiring Trends",
            "description", "Temporal and departmental hiring patterns",
            "fields", Arrays.asList("monthly_trends", "department_patterns", "seasonal_analysis")
        ));
        
        return reportTypes;
    }
}
