package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ReportExportJobResponse;
import com.arthmatic.shumelahire.dto.ReportExportRequest;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.ReportExportJobDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReportExportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportExportService.class);

    @Autowired
    private ReportExportJobDataRepository exportJobRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Queue a new export job. Mock implementation that creates the job and
     * immediately marks it as completed with a placeholder file URL.
     */
    public ReportExportJobResponse queueExport(ReportExportRequest request) {
        Employee requestedBy = employeeRepository.findById(String.valueOf(request.getRequestedBy()))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getRequestedBy()));

        ReportExportJob job = new ReportExportJob();
        job.setReportType(request.getReportType());
        job.setFormat(ExportFormat.valueOf(request.getFormat()));
        job.setStatus(ExportStatus.QUEUED);
        job.setParameters(request.getParameters());
        job.setRequestedBy(requestedBy);

        ReportExportJob saved = exportJobRepository.save(job);
        logger.info("Report export job #{} queued: type={}, format={}", saved.getId(),
                saved.getReportType(), saved.getFormat());

        // Mock: immediately mark as completed
        saved.setStatus(ExportStatus.COMPLETED);
        saved.setFileUrl("/exports/report-" + saved.getId() + "." + request.getFormat().toLowerCase());
        saved.setFileSize(1024L);
        saved.setCompletedAt(LocalDateTime.now());
        saved = exportJobRepository.save(saved);

        auditLogService.saveLog(request.getRequestedBy().toString(), "EXPORT", "REPORT_EXPORT",
                saved.getId().toString(), "Exported report: " + saved.getReportType() + " as " + saved.getFormat());

        return ReportExportJobResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportExportJobResponse> getByUser(String employeeId) {
        return exportJobRepository.findByRequestedByIdOrderByCreatedAtDesc(employeeId).stream()
                .map(ReportExportJobResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReportExportJobResponse getById(String id) {
        ReportExportJob job = exportJobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Export job not found: " + id));
        return ReportExportJobResponse.fromEntity(job);
    }

    @Transactional(readOnly = true)
    public List<ReportExportJobResponse> getAll() {
        return exportJobRepository.findAll().stream()
                .map(ReportExportJobResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
