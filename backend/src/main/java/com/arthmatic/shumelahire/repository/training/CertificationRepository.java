package com.arthmatic.shumelahire.repository.training;

import com.arthmatic.shumelahire.entity.training.Certification;
import com.arthmatic.shumelahire.entity.training.CertificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findByEmployeeId(Long employeeId);

    List<Certification> findByEmployeeIdAndStatus(Long employeeId, CertificationStatus status);

    @Query("SELECT c FROM Certification c WHERE c.status = 'ACTIVE' AND c.expiryDate IS NOT NULL " +
           "AND c.expiryDate BETWEEN :now AND :threshold ORDER BY c.expiryDate")
    List<Certification> findExpiringSoon(
            @Param("now") LocalDate now,
            @Param("threshold") LocalDate threshold);

    @Query("SELECT c FROM Certification c WHERE c.status = 'ACTIVE' AND c.expiryDate IS NOT NULL " +
           "AND c.expiryDate < :now")
    List<Certification> findExpired(@Param("now") LocalDate now);

    @Query("SELECT COUNT(c) FROM Certification c WHERE c.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT COUNT(c) FROM Certification c WHERE c.employee.id = :employeeId AND c.status = 'ACTIVE'")
    long countActiveByEmployee(@Param("employeeId") Long employeeId);
}
