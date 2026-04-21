package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.TrainingEvaluation;

import java.util.List;
import java.util.Optional;

public interface TrainingEvaluationDataRepository {
    Optional<TrainingEvaluation> findById(String id);
    TrainingEvaluation save(TrainingEvaluation entity);
    List<TrainingEvaluation> findBySessionId(String sessionId);
    Optional<TrainingEvaluation> findBySessionIdAndEmployeeId(String sessionId, String employeeId);
}
