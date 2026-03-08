package com.arthmatic.shumelahire.repository.engagement;

import com.arthmatic.shumelahire.entity.engagement.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    List<SurveyResponse> findBySurveyId(Long surveyId);

    List<SurveyResponse> findBySurveyIdAndEmployeeId(Long surveyId, Long employeeId);

    @Query("SELECT sr FROM SurveyResponse sr WHERE sr.survey.id = :surveyId AND sr.question.id = :questionId")
    List<SurveyResponse> findBySurveyIdAndQuestionId(@Param("surveyId") Long surveyId, @Param("questionId") Long questionId);

    @Query("SELECT AVG(sr.rating) FROM SurveyResponse sr WHERE sr.survey.id = :surveyId AND sr.question.id = :questionId AND sr.rating IS NOT NULL")
    Double getAverageRating(@Param("surveyId") Long surveyId, @Param("questionId") Long questionId);

    @Query("SELECT COUNT(DISTINCT sr.employee.id) FROM SurveyResponse sr WHERE sr.survey.id = :surveyId")
    Long countDistinctRespondents(@Param("surveyId") Long surveyId);

    boolean existsBySurveyIdAndEmployeeId(Long surveyId, Long employeeId);
}
