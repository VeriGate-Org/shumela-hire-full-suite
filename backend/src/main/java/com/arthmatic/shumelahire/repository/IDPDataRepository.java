package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.IndividualDevelopmentPlan;

import java.util.List;
import java.util.Optional;

public interface IDPDataRepository {
    Optional<IndividualDevelopmentPlan> findById(String id);
    IndividualDevelopmentPlan save(IndividualDevelopmentPlan entity);
    void deleteById(String id);
    List<IndividualDevelopmentPlan> findByEmployeeId(String employeeId);
    List<IndividualDevelopmentPlan> findByManagerId(String managerId);
}
