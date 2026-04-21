package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.employee.EmployeeSkill;

import java.util.List;
import java.util.Optional;

public interface EmployeeSkillDataRepository {
    Optional<EmployeeSkill> findById(String id);
    EmployeeSkill save(EmployeeSkill entity);
    void deleteById(String id);
    List<EmployeeSkill> findByEmployeeId(String employeeId);
}
