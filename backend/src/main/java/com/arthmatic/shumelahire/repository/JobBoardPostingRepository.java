package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.entity.PostingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobBoardPostingRepository extends JpaRepository<JobBoardPosting, Long> {

    List<JobBoardPosting> findByJobPostingId(String jobPostingId);

    List<JobBoardPosting> findByStatus(PostingStatus status);

    List<JobBoardPosting> findByBoardTypeAndStatus(JobBoardType boardType, PostingStatus status);

    @Query("SELECT p FROM TgJobBoardPosting p WHERE p.status = 'POSTED' AND p.expiresAt < :now")
    List<JobBoardPosting> findExpiredPostings(@Param("now") LocalDateTime now);
}
