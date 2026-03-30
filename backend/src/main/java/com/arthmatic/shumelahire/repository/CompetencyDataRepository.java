package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.performance.Competency;
import java.util.List;
import java.util.Optional;

public interface CompetencyDataRepository {
    Optional<Competency> findById(String id);
    Competency save(Competency entity);
    List<Competency> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Competency> findByFrameworkId(String frameworkId);
    List<Competency> findByCategory(String category);
}
