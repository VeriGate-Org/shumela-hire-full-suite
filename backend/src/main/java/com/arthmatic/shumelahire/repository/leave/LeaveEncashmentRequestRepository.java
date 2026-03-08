package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveEncashmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveEncashmentRequestRepository extends JpaRepository<LeaveEncashmentRequest, Long> {

    List<LeaveEncashmentRequest> findByEmployeeId(Long employeeId);

    List<LeaveEncashmentRequest> findByStatus(LeaveEncashmentStatus status);

    long countByEmployeeIdAndCycleYear(Long employeeId, Integer cycleYear);
}
