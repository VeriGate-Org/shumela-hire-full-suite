package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.FeedbackRequest;
import com.arthmatic.shumelahire.entity.performance.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRequestRepository extends JpaRepository<FeedbackRequest, Long> {

    Page<FeedbackRequest> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<FeedbackRequest> findByRequesterId(Long requesterId, Pageable pageable);

    List<FeedbackRequest> findByEmployeeIdAndStatus(Long employeeId, FeedbackStatus status);

    Page<FeedbackRequest> findByStatus(FeedbackStatus status, Pageable pageable);
}
