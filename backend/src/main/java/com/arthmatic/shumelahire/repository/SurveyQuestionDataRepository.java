package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.SurveyQuestion;

import java.util.List;
import java.util.Optional;

public interface SurveyQuestionDataRepository {
    Optional<SurveyQuestion> findById(String id);
    SurveyQuestion save(SurveyQuestion entity);
    List<SurveyQuestion> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SurveyQuestion> findBySurveyIdOrderByDisplayOrderAsc(String surveyId);
}
