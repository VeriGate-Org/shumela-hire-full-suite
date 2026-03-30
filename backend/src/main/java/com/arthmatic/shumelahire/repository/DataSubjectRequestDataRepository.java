package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;

import java.util.List;
import java.util.Optional;

public interface DataSubjectRequestDataRepository {
    Optional<DataSubjectRequest> findById(String id);
    DataSubjectRequest save(DataSubjectRequest entity);
    List<DataSubjectRequest> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<DataSubjectRequest> findByStatus(DsarStatus status);
    List<DataSubjectRequest> findByRequesterEmail(String requesterEmail);
    long countByStatus(DsarStatus status);
}
