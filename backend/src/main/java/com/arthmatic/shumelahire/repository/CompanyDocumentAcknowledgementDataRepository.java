package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.CompanyDocumentAcknowledgement;

import java.util.List;

public interface CompanyDocumentAcknowledgementDataRepository {

    CompanyDocumentAcknowledgement save(CompanyDocumentAcknowledgement entity);

    List<CompanyDocumentAcknowledgement> findByDocumentId(String documentId);

    List<CompanyDocumentAcknowledgement> findByEmployeeId(String employeeId);

    boolean existsByDocumentIdAndEmployeeId(String documentId, String employeeId);
}
