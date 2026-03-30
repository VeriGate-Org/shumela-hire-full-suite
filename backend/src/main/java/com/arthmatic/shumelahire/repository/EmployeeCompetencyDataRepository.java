package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.EmployeeCompetency;
import java.util.List;
import java.util.Optional;

public interface EmployeeCompetencyDataRepository {
    Optional<EmployeeCompetency> findById(String id);
    EmployeeCompetency save(EmployeeCompetency entity);
    List<EmployeeCompetency> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<EmployeeCompetency> findByEmployeeId(String employeeId);
    Optional<EmployeeCompetency> findByEmployeeIdAndCompetencyId(String employeeId, String competencyId);
    List<EmployeeCompetency> findByCompetencyId(String competencyId);
}
