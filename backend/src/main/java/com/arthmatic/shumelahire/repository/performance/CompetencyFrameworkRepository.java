package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.CompetencyFramework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetencyFrameworkRepository extends JpaRepository<CompetencyFramework, Long> {

    List<CompetencyFramework> findByIsActiveTrue();
}
