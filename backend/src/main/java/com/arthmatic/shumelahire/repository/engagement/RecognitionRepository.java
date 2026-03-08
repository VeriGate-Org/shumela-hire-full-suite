package com.arthmatic.shumelahire.repository.engagement;

import com.arthmatic.shumelahire.entity.engagement.Recognition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecognitionRepository extends JpaRepository<Recognition, Long> {

    Page<Recognition> findByToEmployeeIdOrderByCreatedAtDesc(Long toEmployeeId, Pageable pageable);

    Page<Recognition> findByFromEmployeeIdOrderByCreatedAtDesc(Long fromEmployeeId, Pageable pageable);

    Page<Recognition> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT r.toEmployee.id, SUM(r.points) as totalPoints FROM Recognition r " +
           "GROUP BY r.toEmployee.id ORDER BY totalPoints DESC")
    List<Object[]> getLeaderboard(Pageable pageable);

    @Query("SELECT SUM(r.points) FROM Recognition r WHERE r.toEmployee.id = :employeeId")
    Long getTotalPointsForEmployee(Long employeeId);
}
