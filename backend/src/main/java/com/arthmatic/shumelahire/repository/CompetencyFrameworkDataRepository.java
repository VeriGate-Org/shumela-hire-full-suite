package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.CompetencyFramework;
import java.util.List;
import java.util.Optional;

public interface CompetencyFrameworkDataRepository {
    Optional<CompetencyFramework> findById(String id);
    CompetencyFramework save(CompetencyFramework entity);
    List<CompetencyFramework> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<CompetencyFramework> findByIsActiveTrue();
}
