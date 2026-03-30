package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.SurveyResponse;

import java.util.List;
import java.util.Optional;

public interface SurveyResponseDataRepository {
    Optional<SurveyResponse> findById(String id);
    SurveyResponse save(SurveyResponse entity);
    List<SurveyResponse> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<SurveyResponse> findBySurveyId(String surveyId);
    List<SurveyResponse> findBySurveyIdAndEmployeeId(String surveyId, String employeeId);
    Double getAverageRating(String surveyId, String questionId);
    long countDistinctRespondents(String surveyId);
    List<SurveyResponse> findBySurveyIdAndQuestionId(String surveyId, String questionId);
    boolean existsBySurveyIdAndEmployeeId(String surveyId, String employeeId);
}
