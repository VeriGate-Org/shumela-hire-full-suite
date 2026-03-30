package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgram;
import com.arthmatic.shumelahire.entity.engagement.WellnessProgramType;

import java.util.List;
import java.util.Optional;

public interface WellnessProgramDataRepository {
    Optional<WellnessProgram> findById(String id);
    WellnessProgram save(WellnessProgram entity);
    List<WellnessProgram> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<WellnessProgram> findByIsActiveTrue();
    List<WellnessProgram> findByProgramType(WellnessProgramType programType);
}
