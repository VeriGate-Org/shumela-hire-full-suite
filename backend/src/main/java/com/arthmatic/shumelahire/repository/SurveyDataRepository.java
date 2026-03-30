package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.Survey;
import com.arthmatic.shumelahire.entity.engagement.SurveyStatus;

import java.util.List;
import java.util.Optional;

public interface SurveyDataRepository {
    Optional<Survey> findById(String id);
    Survey save(Survey entity);
    List<Survey> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Survey> findByStatus(SurveyStatus status);
    List<Survey> findByCreatedBy(String createdBy);
}
