package com.arthmatic.shumelahire.repository.compliance;

import com.arthmatic.shumelahire.entity.compliance.DataSubjectRequest;
import com.arthmatic.shumelahire.entity.compliance.DsarStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSubjectRequestRepository extends JpaRepository<DataSubjectRequest, Long> {

    Page<DataSubjectRequest> findByStatus(DsarStatus status, Pageable pageable);

    List<DataSubjectRequest> findByRequesterEmail(String requesterEmail);

    long countByStatus(DsarStatus status);
}
