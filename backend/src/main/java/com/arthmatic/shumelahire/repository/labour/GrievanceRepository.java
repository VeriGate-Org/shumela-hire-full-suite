package com.arthmatic.shumelahire.repository.labour;

import com.arthmatic.shumelahire.entity.labour.Grievance;
import com.arthmatic.shumelahire.entity.labour.GrievanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    Page<Grievance> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<Grievance> findByStatus(GrievanceStatus status, Pageable pageable);

    Page<Grievance> findByAssignedToId(Long assignedToId, Pageable pageable);

    long countByStatus(GrievanceStatus status);
}
