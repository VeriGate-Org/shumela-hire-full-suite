package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequisitionRepository extends JpaRepository<Requisition, Long> {
    Page<Requisition> findByStatus(RequisitionStatus status, Pageable pageable);
    List<Requisition> findByStatusOrderByCreatedAtDesc(RequisitionStatus status);
    Page<Requisition> findByCreatedBy(Long createdBy, Pageable pageable);
    long countByStatus(RequisitionStatus status);
}
