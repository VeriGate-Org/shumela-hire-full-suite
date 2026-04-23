package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for recruiter dashboard analytics and KPIs
 */
@Service
public class RecruiterDashboardService {

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    /**
     * Get comprehensive recruiter metrics for dashboard
     */
    public Map<String, Object> getRecruiterMetrics(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : LocalDateTime.now().minusDays(30);
        
        List<Application> applications = applicationRepository.findRecentApplications(start);
        List<JobPosting> jobPostings = jobPostingRepository.findAll();

        Map<String, Object> metrics = new HashMap<>();
        
        // Basic counts
        metrics.put("totalApplications", applications.size());
        metrics.put("activeJobPostings", jobPostings.size());
        metrics.put("newApplicants", applications.stream()
            .map(app -> app.getApplicant().getId())
            .distinct()
            .count());

        // Application status breakdown
        Map<String, Long> statusCounts = applications.stream()
            .collect(Collectors.groupingBy(
                app -> app.getStatus().toString(),
                Collectors.counting()
            ));
        metrics.put("applicationsByStatus", statusCounts);

        // Conversion rates
        long screeningPassed = applications.stream()
            .mapToLong(app -> app.getStatus().ordinal() > ApplicationStatus.SCREENING.ordinal() ? 1 : 0)
            .sum();
        long interviewed = applications.stream()
            .mapToLong(app -> app.getStatus().ordinal() >= ApplicationStatus.INTERVIEW_SCHEDULED.ordinal() ? 1 : 0)
            .sum();
        long hired = applications.stream()
            .mapToLong(app -> app.getStatus() == ApplicationStatus.HIRED ? 1 : 0)
            .sum();

        metrics.put("conversionRates", Map.of(
            "screeningRate", applications.isEmpty() ? 0.0 : (double) screeningPassed / applications.size() * 100,
            "interviewRate", applications.isEmpty() ? 0.0 : (double) interviewed / applications.size() * 100,
            "hireRate", applications.isEmpty() ? 0.0 : (double) hired / applications.size() * 100
        ));

        // Time-based trends
        Map<String, Long> dailyApplications = applications.stream()
            .collect(Collectors.groupingBy(
                app -> app.getCreatedAt().toLocalDate().toString(),
                Collectors.counting()
            ));
        metrics.put("dailyTrends", dailyApplications);

        return metrics;
    }

    /**
     * Get applications count per vacancy for chart visualization
     */
    public List<Map<String, Object>> getApplicationsPerVacancy(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Application> recentApplications = applicationRepository.findRecentApplications(since);

        Map<String, Long> applicationCounts = recentApplications.stream()
            .collect(Collectors.groupingBy(
                app -> app.getJobTitle(),
                Collectors.counting()
            ));

        return applicationCounts.entrySet().stream()
            .map(entry -> Map.of(
                "vacancy", (Object) entry.getKey(),
                "applications", (Object) entry.getValue(),
                "jobId", (Object) recentApplications.stream()
                    .filter(app -> app.getJobTitle().equals(entry.getKey()))
                    .findFirst()
                    .map(app -> app.getJobPostingId())
                    .orElse("")
            ))
            .sorted((a, b) -> Long.compare((Long) b.get("applications"), (Long) a.get("applications")))
            .collect(Collectors.toList());
    }

    /**
     * Get recruitment pipeline funnel data
     */
    public Map<String, Object> getPipelineFunnel(String department, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Application> applications = applicationRepository.findRecentApplications(since);

        // Filter by department if specified
        if (department != null && !department.isEmpty()) {
            applications = applications.stream()
                .filter(app -> department.equals(app.getDepartment()))
                .collect(Collectors.toList());
        }

        Map<String, Long> funnelData = new LinkedHashMap<>();
        funnelData.put("Applied", (long) applications.size());
        funnelData.put("Screening", applications.stream()
            .mapToLong(app -> app.getStatus().ordinal() > ApplicationStatus.SUBMITTED.ordinal() ? 1 : 0)
            .sum());
        funnelData.put("Interview", applications.stream()
            .mapToLong(app -> app.getStatus().ordinal() >= ApplicationStatus.INTERVIEW_SCHEDULED.ordinal() ? 1 : 0)
            .sum());
        funnelData.put("Offer", applications.stream()
            .mapToLong(app -> app.getStatus().ordinal() >= ApplicationStatus.OFFERED.ordinal() ? 1 : 0)
            .sum());
        funnelData.put("Hired", applications.stream()
            .mapToLong(app -> app.getStatus() == ApplicationStatus.HIRED ? 1 : 0)
            .sum());

        return Map.of(
            "funnel", funnelData,
            "department", department != null ? department : "All Departments",
            "period", days + " days"
        );
    }

    /**
     * Get average time to fill positions
     */
    public Map<String, Object> getTimeToFill(String department, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Application> hiredApplications = applicationRepository.findByStatusOrderBySubmittedAtDesc(ApplicationStatus.HIRED);
        
        // Filter by recent updates and department
        hiredApplications = hiredApplications.stream()
            .filter(app -> app.getUpdatedAt() != null && app.getUpdatedAt().isAfter(since))
            .filter(app -> department == null || department.isEmpty() || department.equals(app.getDepartment()))
            .collect(Collectors.toList());

        List<Map<String, Object>> timeToFillData = hiredApplications.stream()
            .map(app -> {
                long daysToFill = ChronoUnit.DAYS.between(
                    app.getJobPosting().getPublishedAt().toLocalDate(),
                    app.getUpdatedAt().toLocalDate()
                );
                return Map.of(
                    "jobTitle", (Object) app.getJobTitle(),
                    "department", (Object) app.getDepartment(),
                    "daysToFill", (Object) daysToFill,
                    "hiredDate", (Object) app.getUpdatedAt().toLocalDate().toString()
                );
            })
            .collect(Collectors.toList());

        double averageDays = hiredApplications.stream()
            .mapToLong(app -> ChronoUnit.DAYS.between(
                app.getJobPosting().getPublishedAt().toLocalDate(),
                app.getUpdatedAt().toLocalDate()
            ))
            .average()
            .orElse(0.0);

        return Map.of(
            "averageDays", averageDays,
            "positions", timeToFillData,
            "department", department != null ? department : "All Departments"
        );
    }

    /**
     * Get recent recruitment activity
     */
    public List<Map<String, Object>> getRecentActivity(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Application> recentApplications = applicationRepository.findRecentApplications(since);
        
        return recentApplications.stream()
            .limit(limit)
            .map(app -> Map.of(
                "id", (Object) app.getId(),
                "applicantName", (Object) app.getApplicant().getFullName(),
                "jobTitle", (Object) app.getJobTitle(),
                "status", (Object) app.getStatus().toString(),
                "action", (Object) getActionDescription(app.getStatus()),
                "timestamp", (Object) app.getUpdatedAt() != null ? app.getUpdatedAt() : app.getCreatedAt(),
                "department", (Object) app.getDepartment()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get statistics by department
     */
    public Map<String, Object> getDepartmentStats(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Application> applications = applicationRepository.findRecentApplications(since);

        Map<String, Map<String, Object>> departmentStats = applications.stream()
            .collect(Collectors.groupingBy(
                app -> app.getDepartment(),
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    apps -> {
                        Map<String, Object> stats = new HashMap<>();
                        stats.put("totalApplications", apps.size());
                        stats.put("uniqueApplicants", apps.stream()
                            .map(app -> app.getApplicant().getId())
                            .distinct().count());
                        stats.put("hired", apps.stream()
                            .mapToLong(app -> app.getStatus() == ApplicationStatus.HIRED ? 1 : 0)
                            .sum());
                        stats.put("averageTimeToFill", apps.stream()
                            .filter(app -> app.getStatus() == ApplicationStatus.HIRED)
                            .mapToLong(app -> ChronoUnit.DAYS.between(
                                app.getJobPosting().getPublishedAt().toLocalDate(),
                                app.getUpdatedAt().toLocalDate()
                            ))
                            .average().orElse(0.0));
                        return stats;
                    }
                )
            ));

        return Map.of(
            "departments", departmentStats,
            "period", days + " days"
        );
    }

    /**
     * Helper method to get action description based on status
     */
    private String getActionDescription(ApplicationStatus status) {
        switch (status) {
            case SUBMITTED:
                return "Application submitted";
            case SCREENING:
                return "Under screening";
            case INTERVIEW_SCHEDULED:
                return "Interview scheduled";
            case INTERVIEW_COMPLETED:
                return "Interview completed";
            case REFERENCE_CHECK:
                return "Reference check";
            case OFFER_PENDING:
                return "Offer being prepared";
            case OFFERED:
                return "Offer extended";
            case OFFER_ACCEPTED:
                return "Offer accepted";
            case HIRED:
                return "Candidate hired";
            case REJECTED:
                return "Application rejected";
            case WITHDRAWN:
                return "Application withdrawn";
            default:
                return "Status updated";
        }
    }
}
