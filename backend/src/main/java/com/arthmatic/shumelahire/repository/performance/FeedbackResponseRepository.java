package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.FeedbackResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackResponseRepository extends JpaRepository<FeedbackResponse, Long> {

    List<FeedbackResponse> findByRequestId(Long requestId);

    Optional<FeedbackResponse> findByRequestIdAndRespondentId(Long requestId, Long respondentId);
}
