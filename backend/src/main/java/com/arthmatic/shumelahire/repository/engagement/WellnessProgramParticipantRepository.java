package com.arthmatic.shumelahire.repository.engagement;

import com.arthmatic.shumelahire.entity.engagement.WellnessProgramParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WellnessProgramParticipantRepository extends JpaRepository<WellnessProgramParticipant, Long> {

    List<WellnessProgramParticipant> findByProgramId(Long programId);

    Optional<WellnessProgramParticipant> findByProgramIdAndEmployeeId(Long programId, Long employeeId);

    boolean existsByProgramIdAndEmployeeId(Long programId, Long employeeId);

    long countByProgramId(Long programId);
}
