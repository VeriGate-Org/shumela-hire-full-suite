package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.PipMilestone;
import com.arthmatic.shumelahire.entity.performance.PipMilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipMilestoneRepository extends JpaRepository<PipMilestone, Long> {

    List<PipMilestone> findByPipIdOrderByTargetDateAsc(Long pipId);

    List<PipMilestone> findByPipIdAndStatus(Long pipId, PipMilestoneStatus status);
}
