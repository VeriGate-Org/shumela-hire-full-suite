package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.ExportStatus;
import com.arthmatic.shumelahire.entity.ReportExportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportExportJobRepository extends JpaRepository<ReportExportJob, Long> {

    List<ReportExportJob> findByRequestedByIdOrderByCreatedAtDesc(Long employeeId);

    List<ReportExportJob> findByStatus(ExportStatus status);

    List<ReportExportJob> findByReportTypeOrderByCreatedAtDesc(String reportType);
}
