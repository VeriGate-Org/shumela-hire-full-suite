package com.arthmatic.shumelahire.repository.performance;

import com.arthmatic.shumelahire.entity.performance.Competency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetencyRepository extends JpaRepository<Competency, Long> {

    List<Competency> findByFrameworkId(Long frameworkId);

    List<Competency> findByCategory(String category);
}
