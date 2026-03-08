package com.arthmatic.shumelahire.repository.engagement;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WellnessProgramRepository extends JpaRepository<WellnessProgram, Long> {

    Page<WellnessProgram> findByIsActiveTrue(Pageable pageable);

    List<WellnessProgram> findByIsActiveTrue();

    List<WellnessProgram> findByProgramType(WellnessProgramType programType);
}
