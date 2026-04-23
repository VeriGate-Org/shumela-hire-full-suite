package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class RequisitionService {

    @Autowired
    private RequisitionDataRepository requisitionRepository;

    public Page<Requisition> findAll(Pageable pageable) {
        return requisitionRepository.findAll(pageable);
    }

    public Page<Requisition> findByStatus(RequisitionStatus status, Pageable pageable) {
        return requisitionRepository.findByStatus(status, pageable);
    }

    public Optional<Requisition> findById(String id) {
        return requisitionRepository.findById(id);
    }

    public Requisition create(Requisition requisition) {
        requisition.setStatus(RequisitionStatus.DRAFT);
        return requisitionRepository.save(requisition);
    }

    public Requisition update(String id, Requisition updated) {
        Requisition existing = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        existing.setJobTitle(updated.getJobTitle());
        existing.setDepartment(updated.getDepartment());
        existing.setLocation(updated.getLocation());
        existing.setEmploymentType(updated.getEmploymentType());
        existing.setSalaryMin(updated.getSalaryMin());
        existing.setSalaryMax(updated.getSalaryMax());
        existing.setDescription(updated.getDescription());
        existing.setJustification(updated.getJustification());

        return requisitionRepository.save(existing);
    }

    public void delete(String id) {
        requisitionRepository.deleteById(id);
    }

    public Requisition submit(String id) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));
        req.setStatus(RequisitionStatus.PENDING_HR_APPROVAL);
        return requisitionRepository.save(req);
    }

    public Requisition approve(String id) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        if (req.getStatus() == RequisitionStatus.PENDING_HR_APPROVAL) {
            req.setStatus(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);
        } else if (req.getStatus() == RequisitionStatus.PENDING_EXECUTIVE_APPROVAL) {
            req.setStatus(RequisitionStatus.APPROVED);
        }
        return requisitionRepository.save(req);
    }

    public Requisition reject(String id) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));
        req.setStatus(RequisitionStatus.REJECTED);
        return requisitionRepository.save(req);
    }
}
