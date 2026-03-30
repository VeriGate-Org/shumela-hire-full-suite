package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.compliance.ConsentRecord;

import java.util.List;
import java.util.Optional;

public interface ConsentRecordDataRepository {
    Optional<ConsentRecord> findById(String id);
    ConsentRecord save(ConsentRecord entity);
    List<ConsentRecord> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<ConsentRecord> findByEmployeeId(String employeeId);
    Optional<ConsentRecord> findByEmployeeIdAndConsentType(String employeeId, String consentType);
    List<ConsentRecord> findByConsentType(String consentType);
    List<ConsentRecord> findByIsGrantedTrue();
    long countByIsGrantedTrue();
    long countByIsGrantedFalse();
}
