package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.AuditLogRepository;
import com.arthmatic.shumelahire.repository.JobBoardPostingRepository;
import com.arthmatic.shumelahire.repository.TenantRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class VacancyReportService {

    private static final Logger logger = LoggerFactory.getLogger(VacancyReportService.class);
    private static final String POPIA_NOTICE = "This report contains personal information processed in accordance with the Protection of Personal Information Act (POPIA). Distribution is restricted to authorised personnel only.";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private static final String DEMO_TENANT_SUBDOMAIN = "idc-demo";

    private final ApplicationRepository applicationRepository;
    private final JobBoardPostingRepository jobBoardPostingRepository;
    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;

    @Autowired
    public VacancyReportService(ApplicationRepository applicationRepository,
                                JobBoardPostingRepository jobBoardPostingRepository,
                                AuditLogRepository auditLogRepository,
                                TenantRepository tenantRepository) {
        this.applicationRepository = applicationRepository;
        this.jobBoardPostingRepository = jobBoardPostingRepository;
        this.auditLogRepository = auditLogRepository;
        this.tenantRepository = tenantRepository;
    }

    public Map<String, Object> getVacancySummaryData(String jobId) {
        List<Application> applications = applicationRepository.findByJobId(jobId);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("jobId", jobId);
        summary.put("reportGeneratedAt", LocalDateTime.now().format(DATE_FORMAT));
        summary.put("totalApplications", applications.size());

        // By status
        Map<String, Long> byStatus = applications.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()));
        summary.put("applicationsByStatus", byStatus);

        // By source
        Map<String, Long> bySource = applications.stream()
                .filter(a -> a.getApplicant() != null && a.getApplicant().getSource() != null)
                .collect(Collectors.groupingBy(a -> a.getApplicant().getSource(), Collectors.counting()));
        summary.put("applicationsBySource", bySource);

        // Shortlisted count
        long shortlisted = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW_SCHEDULED ||
                             a.getStatus() == ApplicationStatus.OFFERED ||
                             a.getStatus() == ApplicationStatus.OFFER_ACCEPTED)
                .count();
        summary.put("shortlistedCount", shortlisted);

        // Demographics (only if consent given)
        Map<String, Object> demographics = getDemographicsBreakdown(applications);
        summary.put("demographics", demographics);

        return summary;
    }

    public byte[] generateVacancySummaryPdf(String jobId) throws IOException {
        byte[] demoReport = loadDemoReport("ShumelaHire-IDC-Vacancy-Summary-Report.pdf");
        if (demoReport != null) return demoReport;

        Map<String, Object> data = getVacancySummaryData(jobId);
        List<Application> applications = applicationRepository.findByJobId(jobId);
        String jobTitle = applications.isEmpty() ? "Unknown Position" : applications.get(0).getJobTitle();

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                float y = 780;
                float margin = 50;
                // Title
                cs.beginText();
                cs.setFont(fontBold, 18);
                cs.newLineAtOffset(margin, y);
                cs.showText("Vacancy Summary Report");
                cs.endText();
                y -= 25;

                cs.beginText();
                cs.setFont(fontRegular, 11);
                cs.newLineAtOffset(margin, y);
                cs.showText("Position: " + jobTitle + "  |  Job ID: " + jobId);
                cs.endText();
                y -= 15;

                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("Generated: " + data.get("reportGeneratedAt"));
                cs.endText();
                y -= 30;

                // Summary stats
                cs.beginText();
                cs.setFont(fontBold, 13);
                cs.newLineAtOffset(margin, y);
                cs.showText("Application Summary");
                cs.endText();
                y -= 20;

                String[] stats = {
                    "Total Applications: " + data.get("totalApplications"),
                    "Shortlisted Candidates: " + data.get("shortlistedCount")
                };
                for (String stat : stats) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin + 10, y);
                    cs.showText(stat);
                    cs.endText();
                    y -= 15;
                }
                y -= 10;

                // By status
                @SuppressWarnings("unchecked")
                Map<String, Long> byStatus = (Map<String, Long>) data.get("applicationsByStatus");
                if (byStatus != null && !byStatus.isEmpty()) {
                    cs.beginText();
                    cs.setFont(fontBold, 13);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Applications by Status");
                    cs.endText();
                    y -= 20;

                    for (Map.Entry<String, Long> entry : byStatus.entrySet()) {
                        cs.beginText();
                        cs.setFont(fontRegular, 10);
                        cs.newLineAtOffset(margin + 10, y);
                        cs.showText(entry.getKey() + ": " + entry.getValue());
                        cs.endText();
                        y -= 15;
                    }
                    y -= 10;
                }

                // By source
                @SuppressWarnings("unchecked")
                Map<String, Long> bySource = (Map<String, Long>) data.get("applicationsBySource");
                if (bySource != null && !bySource.isEmpty()) {
                    cs.beginText();
                    cs.setFont(fontBold, 13);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Applications by Source");
                    cs.endText();
                    y -= 20;

                    for (Map.Entry<String, Long> entry : bySource.entrySet()) {
                        cs.beginText();
                        cs.setFont(fontRegular, 10);
                        cs.newLineAtOffset(margin + 10, y);
                        cs.showText(entry.getKey() + ": " + entry.getValue());
                        cs.endText();
                        y -= 15;
                    }
                }

                // POPIA footer
                y = 40;
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, y);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public byte[] generateShortlistPackPdf(String jobId) throws IOException {
        byte[] demoReport = loadDemoReport("ShumelaHire-IDC-Shortlist-Pack.pdf");
        if (demoReport != null) return demoReport;

        List<Application> applications = applicationRepository.findByJobId(jobId);
        String jobTitle = applications.isEmpty() ? "Unknown Position" : applications.get(0).getJobTitle();

        List<Application> shortlisted = applications.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW_SCHEDULED ||
                             a.getStatus() == ApplicationStatus.OFFERED ||
                             a.getStatus() == ApplicationStatus.OFFER_ACCEPTED)
                .collect(Collectors.toList());

        try (PDDocument document = new PDDocument()) {
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            // Cover page
            PDPage coverPage = new PDPage(PDRectangle.A4);
            document.addPage(coverPage);

            try (PDPageContentStream cs = new PDPageContentStream(document, coverPage)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 20);
                cs.newLineAtOffset(margin, y);
                cs.showText("Shortlist Pack");
                cs.endText();
                y -= 25;

                cs.beginText();
                cs.setFont(fontRegular, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Position: " + jobTitle);
                cs.endText();
                y -= 20;

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Shortlisted Candidates: " + shortlisted.size());
                cs.endText();
                y -= 15;

                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("Generated: " + LocalDateTime.now().format(DATE_FORMAT));
                cs.endText();

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            // One page per candidate
            for (Application app : shortlisted) {
                PDPage candidatePage = new PDPage(PDRectangle.A4);
                document.addPage(candidatePage);

                try (PDPageContentStream cs = new PDPageContentStream(document, candidatePage)) {
                    float margin = 50;
                    float y = 780;
                    Applicant applicant = app.getApplicant();

                    cs.beginText();
                    cs.setFont(fontBold, 14);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Candidate Profile");
                    cs.endText();
                    y -= 25;

                    String[][] fields = {
                        {"Name", applicant != null ? applicant.getFullName() : "N/A"},
                        {"Email", applicant != null ? applicant.getEmail() : "N/A"},
                        {"Phone", applicant != null && applicant.getPhone() != null ? applicant.getPhone() : "N/A"},
                        {"Location", applicant != null && applicant.getLocation() != null ? applicant.getLocation() : "N/A"},
                        {"Experience", applicant != null && applicant.getExperience() != null ? applicant.getExperience() : "N/A"},
                        {"Status", app.getStatus().getDisplayName()},
                        {"Rating", app.getRating() != null ? app.getRating() + "/5" : "Not rated"},
                        {"Applied", app.getSubmittedAt() != null ? app.getSubmittedAt().format(DATE_FORMAT) : "N/A"}
                    };

                    for (String[] field : fields) {
                        cs.beginText();
                        cs.setFont(fontBold, 10);
                        cs.newLineAtOffset(margin, y);
                        cs.showText(field[0] + ": ");
                        cs.setFont(fontRegular, 10);
                        cs.showText(field[1]);
                        cs.endText();
                        y -= 16;
                    }

                    if (app.getScreeningNotes() != null && !app.getScreeningNotes().isEmpty()) {
                        y -= 10;
                        cs.beginText();
                        cs.setFont(fontBold, 11);
                        cs.newLineAtOffset(margin, y);
                        cs.showText("Screening Notes");
                        cs.endText();
                        y -= 16;

                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 10, y);
                        String notes = app.getScreeningNotes();
                        if (notes.length() > 200) notes = notes.substring(0, 200) + "...";
                        cs.showText(notes);
                        cs.endText();
                    }

                    // POPIA footer
                    cs.beginText();
                    cs.setFont(fontItalic, 7);
                    cs.newLineAtOffset(margin, 40);
                    cs.showText(POPIA_NOTICE);
                    cs.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public byte[] generateDemographicsReportPdf(String jobId) throws IOException {
        List<Application> applications = applicationRepository.findByJobId(jobId);
        String jobTitle = applications.isEmpty() ? "Unknown Position" : applications.get(0).getJobTitle();
        Map<String, Object> demographics = getDemographicsBreakdown(applications);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 18);
                cs.newLineAtOffset(margin, y);
                cs.showText("Employment Equity Report");
                cs.endText();
                y -= 25;

                cs.beginText();
                cs.setFont(fontRegular, 11);
                cs.newLineAtOffset(margin, y);
                cs.showText("Position: " + jobTitle + "  |  Job ID: " + jobId);
                cs.endText();
                y -= 15;

                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("Generated: " + LocalDateTime.now().format(DATE_FORMAT));
                cs.endText();
                y -= 10;

                int totalWithConsent = (int) demographics.getOrDefault("totalWithConsent", 0);
                int totalApplicants = (int) demographics.getOrDefault("totalApplicants", 0);

                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("Applicants with demographics consent: " + totalWithConsent + " of " + totalApplicants);
                cs.endText();
                y -= 30;

                // Gender breakdown
                y = writeDemographicSection(cs, fontBold, fontRegular, "Gender Distribution", demographics, "genderBreakdown", margin, y, totalWithConsent);
                y -= 10;

                // Race breakdown
                y = writeDemographicSection(cs, fontBold, fontRegular, "Race Distribution (Employment Equity Act)", demographics, "raceBreakdown", margin, y, totalWithConsent);
                y -= 10;

                // Disability breakdown
                y = writeDemographicSection(cs, fontBold, fontRegular, "Disability Status", demographics, "disabilityBreakdown", margin, y, totalWithConsent);
                y -= 10;

                // Citizenship breakdown
                y = writeDemographicSection(cs, fontBold, fontRegular, "Citizenship Status", demographics, "citizenshipBreakdown", margin, y, totalWithConsent);

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    public byte[] generateResponseHandlingPdf(String jobId) throws IOException {
        byte[] demoReport = loadDemoReport("ShumelaHire-IDC-Response-Handling-Report.pdf");
        if (demoReport != null) return demoReport;

        List<Application> applications = applicationRepository.findByJobId(jobId);
        String jobTitle = applications.isEmpty() ? "Unknown Position" : applications.get(0).getJobTitle();
        List<JobBoardPosting> boardPostings = jobBoardPostingRepository.findByJobPostingId(jobId);
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("JOB_POSTING", jobId);

        try (PDDocument document = new PDDocument()) {
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            // Page 1 — Cover & Timeline
            PDPage coverPage = new PDPage(PDRectangle.A4);
            document.addPage(coverPage);

            try (PDPageContentStream cs = new PDPageContentStream(document, coverPage)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 20);
                cs.newLineAtOffset(margin, y);
                cs.showText("Response Handling Report");
                cs.endText();
                y -= 25;

                cs.beginText();
                cs.setFont(fontRegular, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Position: " + jobTitle);
                cs.endText();
                y -= 20;

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Job ID: " + jobId);
                cs.endText();
                y -= 15;

                cs.beginText();
                cs.setFont(fontRegular, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("Generated: " + LocalDateTime.now().format(DATE_FORMAT));
                cs.endText();
                y -= 30;

                // Key milestone dates
                cs.beginText();
                cs.setFont(fontBold, 13);
                cs.newLineAtOffset(margin, y);
                cs.showText("Recruitment Timeline");
                cs.endText();
                y -= 20;

                // Derive dates from applications and audit logs
                String createdDate = applications.stream()
                        .map(Application::getSubmittedAt)
                        .filter(Objects::nonNull)
                        .min(LocalDateTime::compareTo)
                        .map(d -> d.format(DATE_FORMAT))
                        .orElse("N/A");

                String closedDate = auditLogs.stream()
                        .filter(a -> a.getAction() != null && a.getAction().contains("CLOSE"))
                        .map(AuditLog::getTimestamp)
                        .findFirst()
                        .map(d -> d.format(DATE_FORMAT))
                        .orElse("Ongoing");

                String publishedDate = auditLogs.stream()
                        .filter(a -> a.getAction() != null && a.getAction().contains("PUBLISH"))
                        .map(AuditLog::getTimestamp)
                        .reduce((first, second) -> second) // get earliest (list is desc)
                        .map(d -> d.format(DATE_FORMAT))
                        .orElse("N/A");

                String[][] milestones = {
                        {"First Application Received", createdDate},
                        {"Position Published", publishedDate},
                        {"Total Applications", String.valueOf(applications.size())},
                        {"Position Status", closedDate.equals("Ongoing") ? "Open" : "Closed (" + closedDate + ")"}
                };

                for (String[] milestone : milestones) {
                    cs.beginText();
                    cs.setFont(fontBold, 10);
                    cs.newLineAtOffset(margin + 10, y);
                    cs.showText(milestone[0] + ": ");
                    cs.setFont(fontRegular, 10);
                    cs.showText(milestone[1]);
                    cs.endText();
                    y -= 16;
                }

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            // Page 2 — Advertising Channels
            PDPage channelsPage = new PDPage(PDRectangle.A4);
            document.addPage(channelsPage);

            try (PDPageContentStream cs = new PDPageContentStream(document, channelsPage)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.newLineAtOffset(margin, y);
                cs.showText("Advertising Channels");
                cs.endText();
                y -= 25;

                if (boardPostings.isEmpty()) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("No job board postings recorded.");
                    cs.endText();
                } else {
                    // Table header
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin, y);
                    cs.showText("Board");
                    cs.endText();
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin + 120, y);
                    cs.showText("Posted");
                    cs.endText();
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin + 210, y);
                    cs.showText("Status");
                    cs.endText();
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin + 290, y);
                    cs.showText("Views");
                    cs.endText();
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin + 340, y);
                    cs.showText("Clicks");
                    cs.endText();
                    cs.beginText();
                    cs.setFont(fontBold, 9);
                    cs.newLineAtOffset(margin + 390, y);
                    cs.showText("Apps");
                    cs.endText();
                    y -= 16;

                    // Draw header line
                    cs.moveTo(margin, y + 4);
                    cs.lineTo(margin + 440, y + 4);
                    cs.stroke();

                    for (JobBoardPosting posting : boardPostings) {
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin, y);
                        cs.showText(posting.getBoardType().getDisplayName());
                        cs.endText();
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 120, y);
                        cs.showText(posting.getPostedAt() != null ? posting.getPostedAt().format(DATE_FORMAT) : "N/A");
                        cs.endText();
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 210, y);
                        cs.showText(posting.getStatus().name());
                        cs.endText();
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 290, y);
                        cs.showText(String.valueOf(posting.getViewCount() != null ? posting.getViewCount() : 0));
                        cs.endText();
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 340, y);
                        cs.showText(String.valueOf(posting.getClickCount() != null ? posting.getClickCount() : 0));
                        cs.endText();
                        cs.beginText();
                        cs.setFont(fontRegular, 9);
                        cs.newLineAtOffset(margin + 390, y);
                        cs.showText(String.valueOf(posting.getApplicationCount() != null ? posting.getApplicationCount() : 0));
                        cs.endText();
                        y -= 15;
                    }
                }

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            // Page 3 — Screening & Ranking
            PDPage screeningPage = new PDPage(PDRectangle.A4);
            document.addPage(screeningPage);

            try (PDPageContentStream cs = new PDPageContentStream(document, screeningPage)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.newLineAtOffset(margin, y);
                cs.showText("Screening & Ranking");
                cs.endText();
                y -= 25;

                // Applications by status
                cs.beginText();
                cs.setFont(fontBold, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Applications by Status");
                cs.endText();
                y -= 18;

                Map<String, Long> byStatus = applications.stream()
                        .collect(Collectors.groupingBy(a -> a.getStatus().getDisplayName(), Collectors.counting()));

                for (Map.Entry<String, Long> entry : byStatus.entrySet()) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin + 10, y);
                    cs.showText(entry.getKey() + ": " + entry.getValue());
                    cs.endText();
                    y -= 15;
                }
                y -= 10;

                // Shortlisted candidates sorted by rating
                cs.beginText();
                cs.setFont(fontBold, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Shortlisted Candidates");
                cs.endText();
                y -= 18;

                List<Application> shortlisted = applications.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW_SCHEDULED ||
                                     a.getStatus() == ApplicationStatus.OFFERED ||
                                     a.getStatus() == ApplicationStatus.OFFER_ACCEPTED)
                        .sorted((a, b) -> {
                            Integer ra = a.getRating() != null ? a.getRating() : 0;
                            Integer rb = b.getRating() != null ? b.getRating() : 0;
                            return rb.compareTo(ra);
                        })
                        .collect(Collectors.toList());

                if (shortlisted.isEmpty()) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin + 10, y);
                    cs.showText("No shortlisted candidates.");
                    cs.endText();
                } else {
                    for (Application app : shortlisted) {
                        if (y < 60) break; // avoid overflowing into footer
                        Applicant applicant = app.getApplicant();
                        String name = applicant != null ? applicant.getFullName() : "N/A";
                        String rating = app.getRating() != null ? app.getRating() + "/5" : "Unrated";
                        String notes = app.getScreeningNotes() != null ? app.getScreeningNotes() : "";
                        if (notes.length() > 80) notes = notes.substring(0, 80) + "...";

                        cs.beginText();
                        cs.setFont(fontBold, 9);
                        cs.newLineAtOffset(margin + 10, y);
                        cs.showText(name);
                        cs.setFont(fontRegular, 9);
                        cs.showText("  |  Rating: " + rating);
                        if (!notes.isEmpty()) {
                            cs.showText("  |  " + notes);
                        }
                        cs.endText();
                        y -= 14;
                    }
                }

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            // Page 4 — Regret & Audit Trail
            PDPage auditPage = new PDPage(PDRectangle.A4);
            document.addPage(auditPage);

            try (PDPageContentStream cs = new PDPageContentStream(document, auditPage)) {
                float margin = 50;
                float y = 780;

                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.newLineAtOffset(margin, y);
                cs.showText("Regret & Audit Trail");
                cs.endText();
                y -= 25;

                // Rejected/withdrawn counts
                long rejected = applications.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.REJECTED)
                        .count();
                long withdrawn = applications.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.WITHDRAWN)
                        .count();

                cs.beginText();
                cs.setFont(fontBold, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Regret Summary");
                cs.endText();
                y -= 18;

                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin + 10, y);
                cs.showText("Rejected: " + rejected + "  |  Withdrawn: " + withdrawn);
                cs.endText();
                y -= 25;

                // Audit trail
                cs.beginText();
                cs.setFont(fontBold, 12);
                cs.newLineAtOffset(margin, y);
                cs.showText("Audit Trail");
                cs.endText();
                y -= 18;

                if (auditLogs.isEmpty()) {
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin + 10, y);
                    cs.showText("No audit log entries found.");
                    cs.endText();
                } else {
                    for (AuditLog log : auditLogs) {
                        if (y < 60) break;
                        String timestamp = log.getTimestamp() != null ? log.getTimestamp().format(DATE_FORMAT) : "N/A";
                        String action = log.getAction() != null ? log.getAction() : "N/A";
                        String userId = log.getUserId() != null ? log.getUserId() : "System";
                        String details = log.getDetails() != null ? log.getDetails() : "";
                        if (details.length() > 60) details = details.substring(0, 60) + "...";

                        cs.beginText();
                        cs.setFont(fontRegular, 8);
                        cs.newLineAtOffset(margin + 10, y);
                        cs.showText(timestamp + "  |  " + action + "  |  User: " + userId);
                        if (!details.isEmpty()) {
                            cs.showText("  |  " + details);
                        }
                        cs.endText();
                        y -= 13;
                    }
                }

                // POPIA footer
                cs.beginText();
                cs.setFont(fontItalic, 7);
                cs.newLineAtOffset(margin, 40);
                cs.showText(POPIA_NOTICE);
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    @SuppressWarnings("unchecked")
    private float writeDemographicSection(PDPageContentStream cs, PDType1Font fontBold, PDType1Font fontRegular,
                                          String title, Map<String, Object> demographics, String key,
                                          float margin, float y, int total) throws IOException {
        cs.beginText();
        cs.setFont(fontBold, 12);
        cs.newLineAtOffset(margin, y);
        cs.showText(title);
        cs.endText();
        y -= 18;

        Map<String, Long> breakdown = (Map<String, Long>) demographics.getOrDefault(key, Collections.emptyMap());
        if (breakdown.isEmpty()) {
            cs.beginText();
            cs.setFont(fontRegular, 10);
            cs.newLineAtOffset(margin + 10, y);
            cs.showText("No data available");
            cs.endText();
            y -= 15;
        } else {
            for (Map.Entry<String, Long> entry : breakdown.entrySet()) {
                double pct = total > 0 ? (entry.getValue() * 100.0 / total) : 0;
                cs.beginText();
                cs.setFont(fontRegular, 10);
                cs.newLineAtOffset(margin + 10, y);
                cs.showText(String.format("%s: %d (%.1f%%)", entry.getKey(), entry.getValue(), pct));
                cs.endText();
                y -= 15;
            }
        }
        return y;
    }

    private boolean isDemoTenant() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) return false;
        return tenantRepository.findById(tenantId)
                .map(tenant -> DEMO_TENANT_SUBDOMAIN.equals(tenant.getSubdomain()))
                .orElse(false);
    }

    private byte[] loadDemoReport(String filename) {
        if (!isDemoTenant()) return null;
        try {
            ClassPathResource resource = new ClassPathResource("demo-reports/" + filename);
            return resource.getInputStream().readAllBytes();
        } catch (IOException e) {
            logger.debug("Demo report not found: {}", filename);
            return null;
        }
    }

    private Map<String, Object> getDemographicsBreakdown(List<Application> applications) {
        Map<String, Object> demographics = new LinkedHashMap<>();

        List<Applicant> consented = applications.stream()
                .map(Application::getApplicant)
                .filter(Objects::nonNull)
                .filter(a -> Boolean.TRUE.equals(a.getDemographicsConsent()))
                .collect(Collectors.toList());

        demographics.put("totalApplicants", applications.size());
        demographics.put("totalWithConsent", consented.size());

        demographics.put("genderBreakdown", consented.stream()
                .filter(a -> a.getGender() != null)
                .collect(Collectors.groupingBy(Applicant::getGender, Collectors.counting())));

        demographics.put("raceBreakdown", consented.stream()
                .filter(a -> a.getRace() != null)
                .collect(Collectors.groupingBy(Applicant::getRace, Collectors.counting())));

        demographics.put("disabilityBreakdown", consented.stream()
                .filter(a -> a.getDisabilityStatus() != null)
                .collect(Collectors.groupingBy(Applicant::getDisabilityStatus, Collectors.counting())));

        demographics.put("citizenshipBreakdown", consented.stream()
                .filter(a -> a.getCitizenshipStatus() != null)
                .collect(Collectors.groupingBy(Applicant::getCitizenshipStatus, Collectors.counting())));

        return demographics;
    }
}
