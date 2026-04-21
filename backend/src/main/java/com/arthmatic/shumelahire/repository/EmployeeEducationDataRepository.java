package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.employee.EmployeeEducation;

import java.util.List;
import java.util.Optional;

public interface EmployeeEducationDataRepository {
    Optional<EmployeeEducation> findById(String id);
    EmployeeEducation save(EmployeeEducation entity);
    void deleteById(String id);
    List<EmployeeEducation> findByEmployeeId(String employeeId);
}
