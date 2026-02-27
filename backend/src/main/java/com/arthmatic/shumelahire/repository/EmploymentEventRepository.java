package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmploymentEventRepository extends JpaRepository<EmploymentEvent, Long> {

    List<EmploymentEvent> findByEmployeeIdOrderByEventDateDesc(Long employeeId);

    Page<EmploymentEvent> findByEmployeeId(Long employeeId, Pageable pageable);

    List<EmploymentEvent> findByEmployeeIdAndEventType(Long employeeId, EmploymentEventType eventType);
}
