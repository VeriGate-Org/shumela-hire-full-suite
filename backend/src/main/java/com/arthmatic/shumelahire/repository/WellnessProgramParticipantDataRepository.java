package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgramParticipant;

import java.util.List;
import java.util.Optional;

public interface WellnessProgramParticipantDataRepository {
    Optional<WellnessProgramParticipant> findById(String id);
    WellnessProgramParticipant save(WellnessProgramParticipant entity);
    List<WellnessProgramParticipant> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<WellnessProgramParticipant> findByProgramId(String programId);
    Optional<WellnessProgramParticipant> findByProgramIdAndEmployeeId(String programId, String employeeId);
    boolean existsByProgramIdAndEmployeeId(String programId, String employeeId);
    long countByProgramId(String programId);
}
