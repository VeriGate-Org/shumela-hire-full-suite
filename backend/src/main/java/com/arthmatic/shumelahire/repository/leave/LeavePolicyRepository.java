package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {

    List<LeavePolicy> findByLeaveTypeId(Long leaveTypeId);

    List<LeavePolicy> findByIsActiveTrue();

    List<LeavePolicy> findByLeaveTypeIdAndIsActiveTrue(Long leaveTypeId);
}
