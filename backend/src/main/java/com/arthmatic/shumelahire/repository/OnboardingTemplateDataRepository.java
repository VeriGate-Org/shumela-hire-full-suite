package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.onboarding.OnboardingTemplate;

import java.util.List;
import java.util.Optional;

public interface OnboardingTemplateDataRepository {
    Optional<OnboardingTemplate> findById(String id);
    OnboardingTemplate save(OnboardingTemplate entity);
    void deleteById(String id);
    List<OnboardingTemplate> findAll();
    List<OnboardingTemplate> findActive();
}
