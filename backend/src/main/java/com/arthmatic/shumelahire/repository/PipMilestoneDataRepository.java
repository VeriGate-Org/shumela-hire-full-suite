package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.PipMilestone;
import com.arthmatic.shumelahire.entity.performance.PipMilestoneStatus;
import java.util.List;
import java.util.Optional;

public interface PipMilestoneDataRepository {
    Optional<PipMilestone> findById(String id);
    PipMilestone save(PipMilestone entity);
    List<PipMilestone> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PipMilestone> findByPipIdOrderByTargetDateAsc(String pipId);
    List<PipMilestone> findByPipIdAndStatus(String pipId, PipMilestoneStatus status);
}
