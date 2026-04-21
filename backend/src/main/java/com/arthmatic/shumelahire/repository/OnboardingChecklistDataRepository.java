package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.onboarding.OnboardingChecklist;

import java.util.List;
import java.util.Optional;

public interface OnboardingChecklistDataRepository {
    Optional<OnboardingChecklist> findById(String id);
    OnboardingChecklist save(OnboardingChecklist entity);
    void deleteById(String id);
    List<OnboardingChecklist> findByEmployeeId(String employeeId);
    List<OnboardingChecklist> findByStatus(String status);
    List<OnboardingChecklist> findAll();
}
