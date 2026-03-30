package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.FeedbackResponse;
import java.util.List;
import java.util.Optional;

public interface FeedbackResponseDataRepository {
    Optional<FeedbackResponse> findById(String id);
    FeedbackResponse save(FeedbackResponse entity);
    List<FeedbackResponse> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<FeedbackResponse> findByRequestId(String requestId);
    Optional<FeedbackResponse> findByRequestIdAndRespondentId(String requestId, String respondentId);
}
