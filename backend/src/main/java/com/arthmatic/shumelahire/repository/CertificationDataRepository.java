package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.training.Certification;
import com.arthmatic.shumelahire.entity.training.CertificationStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CertificationDataRepository {
    Optional<Certification> findById(String id);
    Certification save(Certification entity);
    List<Certification> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<Certification> findByEmployeeId(String employeeId);
    List<Certification> findByEmployeeIdAndStatus(String employeeId, CertificationStatus status);
    List<Certification> findExpiringSoon(LocalDate startDate, LocalDate endDate);
    List<Certification> findExpired();
    long countActive();
    long countActiveByEmployee(String employeeId);
}
