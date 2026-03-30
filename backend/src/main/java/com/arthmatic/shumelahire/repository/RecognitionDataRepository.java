package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.Recognition;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface RecognitionDataRepository {
    Optional<Recognition> findById(String id);
    Recognition save(Recognition entity);
    List<Recognition> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Recognition> findByToEmployeeIdOrderByCreatedAtDesc(String toEmployeeId);
    List<Recognition> findByFromEmployeeIdOrderByCreatedAtDesc(String fromEmployeeId);
    List<Recognition> findByIsPublicTrueOrderByCreatedAtDesc();
    List<Map<String, Object>> getLeaderboard();
    long getTotalPointsForEmployee(String employeeId);
}
