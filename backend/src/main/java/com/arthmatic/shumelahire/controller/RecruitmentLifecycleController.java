package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.LifecycleEvent;
import com.arthmatic.shumelahire.dto.RecruitmentLifecycle;
import com.arthmatic.shumelahire.service.RecruitmentLifecycleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lifecycle")
// TA_MANAGER removed 23 Aug 2026 — not a role this system has, so it never matched. The three
// roles beside it already grant the access intended, making this a no-op correction.
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HR_MANAGER')")
public class RecruitmentLifecycleController {

    @Autowired
    private RecruitmentLifecycleService lifecycleService;

    /**
     * Get the full recruitment lifecycle for an application.
     */
    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<RecruitmentLifecycle> getByApplication(@PathVariable String applicationId) {
        RecruitmentLifecycle lifecycle = lifecycleService.getByApplicationId(applicationId);
        return ResponseEntity.ok(lifecycle);
    }

    /**
     * Get lifecycle views for all applications under a requisition.
     */
    @GetMapping("/requisitions/{requisitionId}")
    public ResponseEntity<List<RecruitmentLifecycle>> getByRequisition(@PathVariable String requisitionId) {
        List<RecruitmentLifecycle> lifecycles = lifecycleService.getByRequisitionId(requisitionId);
        return ResponseEntity.ok(lifecycles);
    }

    /**
     * Get just the events (no summary wrapper) for an application.
     */
    @GetMapping("/applications/{applicationId}/events")
    public ResponseEntity<List<LifecycleEvent>> getEvents(@PathVariable String applicationId) {
        List<LifecycleEvent> events = lifecycleService.getEventsByApplicationId(applicationId);
        return ResponseEntity.ok(events);
    }
}
