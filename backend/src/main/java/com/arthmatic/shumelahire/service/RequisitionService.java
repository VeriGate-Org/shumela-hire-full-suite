package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import com.arthmatic.shumelahire.entity.RequisitionApproval;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.service.DelegationMatrixService.ApprovalStage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RequisitionService {

    private static final Logger logger = LoggerFactory.getLogger(RequisitionService.class);

    @Autowired
    private RequisitionDataRepository requisitionRepository;

    @Autowired
    private DelegationMatrixService delegationMatrixService;

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
        return submit(id, null, null);
    }

    /**
     * Submit a requisition into its approval chain.
     *
     * <p>The first stage is now decided by the delegation matrix rather than always being HR, so a
     * requisition routes according to its value from the moment it is submitted.</p>
     */
    public Requisition submit(String id, String actorUserId, String actorName) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        List<ApprovalStage> chain = delegationMatrixService.requiredChain(req);
        ApprovalStage firstStage = chain.get(0);
        req.setStatus(delegationMatrixService.statusForStage(firstStage));

        req.recordApproval(new RequisitionApproval(
                firstStage.name(), "SUBMIT", actorUserId, actorName,
                delegationMatrixService.routingRationale(req)));

        logger.info("Requisition {} submitted; chain={} ({})",
                id, chain, delegationMatrixService.routingRationale(req));
        return requisitionRepository.save(req);
    }

    public Requisition approve(String id) {
        return approve(id, null, null, null);
    }

    /**
     * Approve the stage a requisition is currently awaiting.
     *
     * <p>Where the requisition sits below the delegation threshold this terminates at APPROVED after
     * HR, instead of escalating to an executive whose approval was never required.</p>
     */
    public Requisition approve(String id, String actorUserId, String actorName, String comment) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        ApprovalStage stage = delegationMatrixService.pendingStage(req);
        if (stage == null) {
            throw new IllegalStateException(
                    "Requisition is not awaiting approval (status: " + req.getStatus() + ")");
        }

        req.setStatus(delegationMatrixService.statusAfterApproval(req, stage));
        req.recordApproval(new RequisitionApproval(
                stage.name(), "APPROVE", actorUserId, actorName, comment));

        logger.info("Requisition {} approved at stage {} -> {}", id, stage, req.getStatus());
        return requisitionRepository.save(req);
    }

    public Requisition reject(String id) {
        return reject(id, null, null, null);
    }

    public Requisition reject(String id, String actorUserId, String actorName, String comment) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        ApprovalStage stage = delegationMatrixService.pendingStage(req);
        req.setStatus(RequisitionStatus.REJECTED);
        req.recordApproval(new RequisitionApproval(
                stage != null ? stage.name() : "UNKNOWN", "REJECT", actorUserId, actorName, comment));

        return requisitionRepository.save(req);
    }

    /**
     * The approval stages this requisition must clear, for display alongside its timeline.
     */
    public List<ApprovalStage> requiredChain(Requisition requisition) {
        return delegationMatrixService.requiredChain(requisition);
    }

    public String routingRationale(Requisition requisition) {
        return delegationMatrixService.routingRationale(requisition);
    }
}
