package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findByIsActiveTrue();

    Optional<LeaveType> findByCode(String code);

    boolean existsByCode(String code);
}
