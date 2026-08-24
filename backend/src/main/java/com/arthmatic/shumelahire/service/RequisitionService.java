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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class RequisitionService {

    private static final Logger logger = LoggerFactory.getLogger(RequisitionService.class);

    /**
     * Entity type recorded on every requisition audit entry.
     *
     * <p>Must match the value the audit trail is queried by — the UI reads
     * {@code GET /api/audit/entity/REQUISITION/{id}}. Nothing in this codebase wrote audit entries
     * for requisitions before this constant existed, so every requisition audit tab was empty by
     * construction: the requests were well-formed and the answer was genuinely nothing.</p>
     */
    private static final String ENTITY_TYPE = "REQUISITION";

    @Autowired
    private RequisitionDataRepository requisitionRepository;

    @Autowired
    private DelegationMatrixService delegationMatrixService;

    @Autowired
    private AuditLogService auditLogService;

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
        Requisition saved = requisitionRepository.save(requisition);

        audit(saved.getCreatedBy(), "REQUISITION_CREATED", saved.getId(),
                String.format("Requisition raised: %s (%s), band %s",
                        saved.getJobTitle(), saved.getDepartment(), band(saved)));
        return saved;
    }

    public Requisition update(String id, Requisition updated) {
        return update(id, updated, null);
    }

    /**
     * Amend a requisition, recording what actually changed.
     *
     * <p>The audit entry carries a before-and-after for each amended field rather than the bare fact
     * that an amendment occurred. On a requisition the material change is usually the salary band,
     * and a band edited upward after approval — or ahead of routing, to stay under a delegation
     * threshold — is precisely the event an auditor is looking for.</p>
     */
    public Requisition update(String id, Requisition updated, String actorUserId) {
        Requisition existing = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        List<String> changes = new ArrayList<>();
        addChange(changes, "job title", existing.getJobTitle(), updated.getJobTitle());
        addChange(changes, "department", existing.getDepartment(), updated.getDepartment());
        addChange(changes, "location", existing.getLocation(), updated.getLocation());
        addChange(changes, "employment type", existing.getEmploymentType(), updated.getEmploymentType());
        addAmountChange(changes, "salary floor", existing.getSalaryMin(), updated.getSalaryMin());
        addAmountChange(changes, "salary ceiling", existing.getSalaryMax(), updated.getSalaryMax());
        addChange(changes, "description", existing.getDescription(), updated.getDescription());
        addChange(changes, "justification", existing.getJustification(), updated.getJustification());

        existing.setJobTitle(updated.getJobTitle());
        existing.setDepartment(updated.getDepartment());
        existing.setLocation(updated.getLocation());
        existing.setEmploymentType(updated.getEmploymentType());
        existing.setSalaryMin(updated.getSalaryMin());
        existing.setSalaryMax(updated.getSalaryMax());
        existing.setDescription(updated.getDescription());
        existing.setJustification(updated.getJustification());

        Requisition saved = requisitionRepository.save(existing);

        audit(actorUserId, "REQUISITION_UPDATED", id,
                changes.isEmpty()
                        ? "Requisition amended: no field values changed"
                        : "Requisition amended: " + String.join("; ", changes));
        return saved;
    }

    public void delete(String id) {
        delete(id, null);
    }

    public void delete(String id, String actorUserId) {
        // Read before the delete, so the entry says which requisition went rather than only its id.
        String description = requisitionRepository.findById(id)
                .map(r -> String.format("%s (%s)", r.getJobTitle(), r.getDepartment()))
                .orElse("unknown requisition");

        requisitionRepository.deleteById(id);

        audit(actorUserId, "REQUISITION_DELETED", id, "Requisition deleted: " + description);
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
        String rationale = delegationMatrixService.routingRationale(req);
        req.setStatus(delegationMatrixService.statusForStage(firstStage));

        req.recordApproval(new RequisitionApproval(
                firstStage.name(), "SUBMIT", actorUserId, actorName, rationale));

        logger.info("Requisition {} submitted; chain={} ({})", id, chain, rationale);
        Requisition saved = requisitionRepository.save(req);

        // The routing rationale is the governance content of this event: it states why the
        // requisition went where it went — including an escalation above the delegated band.
        audit(actorUserId, "REQUISITION_SUBMITTED", id,
                String.format("Submitted for approval by %s; routed to %s. %s",
                        actor(actorName), firstStage.name(), rationale));
        return saved;
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

        RequisitionStatus previousStatus = req.getStatus();
        req.setStatus(delegationMatrixService.statusAfterApproval(req, stage));
        req.recordApproval(new RequisitionApproval(
                stage.name(), "APPROVE", actorUserId, actorName, comment));

        logger.info("Requisition {} approved at stage {} -> {}", id, stage, req.getStatus());
        Requisition saved = requisitionRepository.save(req);

        audit(actorUserId, "REQUISITION_APPROVED", id,
                String.format("Approved at %s stage by %s; status %s -> %s%s",
                        stage.name(), actor(actorName), previousStatus, req.getStatus(),
                        commentSuffix(comment)));
        return saved;
    }

    public Requisition reject(String id) {
        return reject(id, null, null, null);
    }

    public Requisition reject(String id, String actorUserId, String actorName, String comment) {
        Requisition req = requisitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requisition not found: " + id));

        ApprovalStage stage = delegationMatrixService.pendingStage(req);
        RequisitionStatus previousStatus = req.getStatus();
        req.setStatus(RequisitionStatus.REJECTED);
        req.recordApproval(new RequisitionApproval(
                stage != null ? stage.name() : "UNKNOWN", "REJECT", actorUserId, actorName, comment));

        Requisition saved = requisitionRepository.save(req);

        audit(actorUserId, "REQUISITION_REJECTED", id,
                String.format("Rejected at %s stage by %s; status %s -> REJECTED%s",
                        stage != null ? stage.name() : "UNKNOWN", actor(actorName), previousStatus,
                        commentSuffix(comment)));
        return saved;
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

    /**
     * The stage this requisition is awaiting, or null if it is not in an approval state.
     *
     * <p>Exposed so a caller can show which link of {@link #requiredChain} is the live one without
     * mapping status back to stage itself — that mapping belongs to the delegation matrix, and a
     * second copy of it in the front end is how the two drift apart.
     */
    public ApprovalStage pendingStage(Requisition requisition) {
        return delegationMatrixService.pendingStage(requisition);
    }

    // -- Audit ----------------------------------------------------------------

    /**
     * Write an audit entry against the requisition, and never let an audit failure undo the change
     * that prompted it.
     *
     * <p>{@link AuditLogService#saveLog} rethrows as a {@code RuntimeException}, and this service is
     * {@code @Transactional} — so an unguarded call would abort an approval because its record could
     * not be written. Losing the entry is bad; silently reversing an approval the user was told
     * succeeded is worse. This mirrors the policy {@code AuditAspect} already documents.</p>
     *
     * <p>Always calls the five-argument overload. The four-argument
     * {@code saveLog(userId, action, entityType, details)} looks like this one and passes
     * {@code entityId = null}, which is why 402 of the 467 entries on the IDC tenant cannot be
     * traced back to the record they describe.</p>
     */
    private void audit(String actorUserId, String action, String requisitionId, String details) {
        try {
            auditLogService.saveLog(
                    actorUserId != null ? actorUserId : "SYSTEM",
                    action,
                    ENTITY_TYPE,
                    requisitionId,
                    details);
        } catch (Exception e) {
            logger.error("Audit entry {} for requisition {} was NOT written", action, requisitionId, e);
        }
    }

    private static String actor(String actorName) {
        return actorName != null && !actorName.isBlank() ? actorName : "an unidentified user";
    }

    private static String commentSuffix(String comment) {
        return comment != null && !comment.isBlank() ? ". Comment: " + comment : "";
    }

    private static String band(Requisition requisition) {
        if (requisition.getSalaryMin() == null && requisition.getSalaryMax() == null) {
            return "not stated";
        }
        return String.format("%s-%s",
                requisition.getSalaryMin() != null ? requisition.getSalaryMin().toPlainString() : "not stated",
                requisition.getSalaryMax() != null ? requisition.getSalaryMax().toPlainString() : "not stated");
    }

    private static void addChange(List<String> changes, String field, Object before, Object after) {
        if (!Objects.equals(before, after)) {
            changes.add(String.format("%s %s -> %s", field, describe(before), describe(after)));
        }
    }

    /**
     * Amounts are compared by value, not by {@code equals}: {@code BigDecimal} treats 950000 and
     * 950000.00 as different objects, which would report an amendment that never happened.
     */
    private static void addAmountChange(List<String> changes, String field, BigDecimal before, BigDecimal after) {
        boolean same = (before == null && after == null)
                || (before != null && after != null && before.compareTo(after) == 0);
        if (!same) {
            changes.add(String.format("%s %s -> %s",
                    field,
                    before != null ? before.toPlainString() : "not stated",
                    after != null ? after.toPlainString() : "not stated"));
        }
    }

    private static String describe(Object value) {
        if (value == null) {
            return "not stated";
        }
        String text = value.toString();
        // Descriptions and justifications run to paragraphs; an audit line must stay readable.
        return text.length() > 80 ? text.substring(0, 77) + "..." : text;
    }
}
