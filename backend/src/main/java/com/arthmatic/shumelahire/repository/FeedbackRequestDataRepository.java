package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.FeedbackRequest;
import com.arthmatic.shumelahire.entity.performance.FeedbackStatus;
import java.util.List;
import java.util.Optional;

public interface FeedbackRequestDataRepository {
    Optional<FeedbackRequest> findById(String id);
    FeedbackRequest save(FeedbackRequest entity);
    List<FeedbackRequest> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<FeedbackRequest> findByEmployeeId(String employeeId);
    List<FeedbackRequest> findByRequesterId(String requesterId);
    List<FeedbackRequest> findByEmployeeIdAndStatus(String employeeId, FeedbackStatus status);
    List<FeedbackRequest> findByStatus(FeedbackStatus status);
}
