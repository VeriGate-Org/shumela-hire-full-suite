package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.approval.PendingApprovalsResult;
import com.arthmatic.shumelahire.approval.PendingApprovalsService;
import com.arthmatic.shumelahire.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * One queue for everything awaiting approval.
 *
 * <p>The platform has five approval mechanisms on five screens. An approver has no single view of
 * what they owe, which is how a requisition sits for nineteen days while its approver works through
 * a different queue elsewhere in the product.
 */
@RestController
@RequestMapping("/api/approvals")
public class PendingApprovalsController {

    private static final Logger logger = LoggerFactory.getLogger(PendingApprovalsController.class);

    private final PendingApprovalsService pendingApprovalsService;

    public PendingApprovalsController(PendingApprovalsService pendingApprovalsService) {
        this.pendingApprovalsService = pendingApprovalsService;
    }

    /**
     * Everything awaiting approval, oldest first.
     * GET /api/approvals/pending
     *
     * <p>The response distinguishes items confirmed as the caller's from those merely pending
     * somebody — only offers and leave can tell the difference today — and lists any source that
     * failed in {@code unavailableSources}. <b>A caller must treat a partial result as a floor, not
     * a total:</b> an empty list with a failed source means "we could not find out", not "nothing
     * is pending".
     *
     * <p><b>Approval level is read from the caller's user record, never from the request.</b> It
     * used to be a query parameter, which meant any of the five permitted roles could ask for
     * {@code approvalLevel=99} and receive every offer awaiting approval — candidate name, job
     * title and total compensation included. A caller with no recorded level gets no offers, and
     * the reason appears in {@code unavailableSources}.
     *
     * <p><b>Leave is not included yet.</b> Its query takes a manager id rather than the caller's
     * identity, so folding it in changes leave's own contract. That is a deliberate, separate step
     * — and until it happens, this endpoint covers four of the five mechanisms, which the client
     * must not present as all five.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<?> pending(Authentication viewer) {
        try {
            PendingApprovalsResult result = pendingApprovalsService.pendingFor(viewer);
            if (result.isPartial()) {
                logger.warn("Pending approvals returned partially: {} source(s) unavailable",
                        result.getUnavailableSources().size());
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error assembling pending approvals", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }
}
