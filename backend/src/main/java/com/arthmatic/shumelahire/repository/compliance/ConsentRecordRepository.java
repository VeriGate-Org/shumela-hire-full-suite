package com.arthmatic.shumelahire.repository.compliance;

import com.arthmatic.shumelahire.entity.compliance.ConsentRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Long> {

    List<ConsentRecord> findByEmployeeId(Long employeeId);

    Optional<ConsentRecord> findByEmployeeIdAndConsentType(Long employeeId, String consentType);

    Page<ConsentRecord> findByConsentType(String consentType, Pageable pageable);

    List<ConsentRecord> findByIsGrantedTrue();

    long countByIsGrantedTrue();

    long countByIsGrantedFalse();
}
