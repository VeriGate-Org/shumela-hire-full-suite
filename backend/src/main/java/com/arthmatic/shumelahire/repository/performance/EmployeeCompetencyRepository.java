package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.EmployeeCompetency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeCompetencyRepository extends JpaRepository<EmployeeCompetency, Long> {

    List<EmployeeCompetency> findByEmployeeId(Long employeeId);

    Optional<EmployeeCompetency> findByEmployeeIdAndCompetencyId(Long employeeId, Long competencyId);

    List<EmployeeCompetency> findByCompetencyId(Long competencyId);
}
