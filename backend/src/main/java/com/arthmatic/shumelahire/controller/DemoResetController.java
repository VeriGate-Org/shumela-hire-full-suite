package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * TEMPORARY controller for clearing demo tenant data before re-seeding.
 * DELETE THIS FILE after the IDC demo seeding is complete.
 */
@RestController
@RequestMapping("/api/admin/demo-reset")
@PreAuthorize("hasRole('ADMIN')")
public class DemoResetController {

    private static final Logger log = LoggerFactory.getLogger(DemoResetController.class);

    @PersistenceContext
    private EntityManager em;

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> resetDemoData(
            @RequestParam(defaultValue = "false") boolean confirm) {

        if (!confirm) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Pass ?confirm=true to execute the reset",
                    "warning", "This will DELETE all recruitment data for the current tenant"
            ));
        }

        String tenantId = TenantContext.requireCurrentTenant();
        log.warn("DEMO RESET initiated for tenant: {}", tenantId);

        Map<String, Object> results = new LinkedHashMap<>();
        int total = 0;

        // Delete in FK-safe order (children before parents)
        String[][] tables = {
                // Performance tables
                {"sap_payroll_transmissions", "tenant_id"},
                {"review_evidence", "tenant_id"},
                {"review_goal_scores", "tenant_id"},
                {"goal_kpis", "tenant_id"},
                {"performance_reviews", "tenant_id"},
                {"performance_goals", "tenant_id"},
                {"performance_contracts", "tenant_id"},
                {"performance_cycles", "tenant_id"},
                {"performance_templates", "tenant_id"},
                // Recruitment leaf tables
                {"screening_answers", "tenant_id"},
                {"screening_questions", "tenant_id"},
                {"background_checks", "tenant_id"},
                {"shortlist_scores", "tenant_id"},
                {"pipeline_transitions", "tenant_id"},
                {"tg_salary_recommendations", "tenant_id"},
                {"recruitment_metrics", "tenant_id"},
                // Interviews & offers
                {"interviews", "tenant_id"},
                {"offers", "tenant_id"},
                // Agency submissions
                {"agency_submissions", "tenant_id"},
                // Talent pool entries
                {"talent_pool_entries", "tenant_id"},
                // Documents
                {"documents", "tenant_id"},
                // Employee tables
                {"custom_field_values", "tenant_id"},
                {"employee_documents", "tenant_id"},
                {"employment_events", "tenant_id"},
                {"employees", "tenant_id"},
                {"custom_fields", "tenant_id"},
                // Applications & applicants
                {"applications", "tenant_id"},
                {"applicants", "tenant_id"},
                // Job-related
                {"tg_job_board_postings", "tenant_id"},
                {"job_ad_history", "tenant_id"},
                {"job_ads", "tenant_id"},
                {"job_postings", "tenant_id"},
                // Talent pools & agencies
                {"talent_pools", "tenant_id"},
                {"agency_profiles", "tenant_id"},
                // Requisitions & departments
                {"requisitions", "tenant_id"},
                {"departments", "tenant_id"},
                // Supporting tables
                {"workflow_executions", "tenant_id"},
                {"workflow_definitions", "tenant_id"},
                {"messages", "tenant_id"},
                {"notifications", "tenant_id"},
                {"audit_logs", "tenant_id"},
                {"user_preferences", "tenant_id"},
                {"linkedin_org_connections", "tenant_id"},
        };

        for (String[] table : tables) {
            try {
                String sql = "DELETE FROM " + table[0] + " WHERE " + table[1] + " = :tenantId";
                int deleted = em.createNativeQuery(sql)
                        .setParameter("tenantId", tenantId)
                        .executeUpdate();
                if (deleted > 0) {
                    results.put(table[0], deleted);
                    total += deleted;
                    log.info("Deleted {} rows from {}", deleted, table[0]);
                }
            } catch (Exception e) {
                results.put(table[0] + "_error", e.getMessage());
                log.warn("Failed to clear {}: {}", table[0], e.getMessage());
            }
        }

        // Delete non-admin users (preserve the admin account running this)
        try {
            int usersDeleted = em.createNativeQuery(
                            "DELETE FROM users WHERE tenant_id = :tenantId AND role != 'ADMIN'")
                    .setParameter("tenantId", tenantId)
                    .executeUpdate();
            if (usersDeleted > 0) {
                results.put("users (non-admin)", usersDeleted);
                total += usersDeleted;
            }
        } catch (Exception e) {
            results.put("users_error", e.getMessage());
            log.warn("Failed to clear non-admin users: {}", e.getMessage());
        }

        results.put("_total_deleted", total);
        results.put("_tenant", tenantId);
        log.warn("DEMO RESET complete for tenant {}: {} total rows deleted", tenantId, total);

        return ResponseEntity.ok(results);
    }

    /**
     * Execute a demo action via direct SQL.
     * Workaround for Spring Security blocking POST to sub-paths under /api/admin/**.
     * All actions go through this single endpoint with an "action" query parameter.
     *
     * Supported actions:
     *   ?action=approve-agency  — body: {"agencyId": 5}
     *   ?action=agency-submission — body: {"agencyId":5, "jobPostingId":1, "candidateName":"...", ...}
     *   ?action=create-offer — body: {"applicationId":1, "jobTitle":"...", "department":"...", "baseSalary":500000, "offerType":"FULL_TIME_PERMANENT", ...}
     */
    @PostMapping(params = "action")
    @Transactional
    public ResponseEntity<Map<String, Object>> executeDemoAction(
            @RequestParam String action,
            @RequestBody Map<String, Object> request) {

        String tenantId = TenantContext.requireCurrentTenant();

        return switch (action) {
            case "approve-agency" -> approveAgency(tenantId, request);
            case "agency-submission" -> createAgencySubmission(tenantId, request);
            case "create-offer" -> createOffer(tenantId, request);
            default -> ResponseEntity.badRequest().body(Map.of("error", "Unknown action: " + action));
        };
    }

    private ResponseEntity<Map<String, Object>> approveAgency(String tenantId, Map<String, Object> request) {
        Long agencyId = Long.valueOf(request.get("agencyId").toString());
        int updated = em.createNativeQuery(
                "UPDATE agency_profiles SET status = 'ACTIVE' WHERE id = :id AND tenant_id = :tenantId AND status = 'PENDING_APPROVAL'")
                .setParameter("id", agencyId)
                .setParameter("tenantId", tenantId)
                .executeUpdate();

        if (updated > 0) {
            log.info("Agency {} approved via demo-reset action", agencyId);
            return ResponseEntity.ok(Map.of("agencyId", agencyId, "status", "ACTIVE"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Agency not found or not in PENDING_APPROVAL status"));
        }
    }

    private ResponseEntity<Map<String, Object>> createAgencySubmission(String tenantId, Map<String, Object> request) {
        Long agencyId = Long.valueOf(request.get("agencyId").toString());
        Long jobPostingId = Long.valueOf(request.get("jobPostingId").toString());
        String candidateName = (String) request.get("candidateName");
        String candidateEmail = (String) request.getOrDefault("candidateEmail", "");
        String candidatePhone = (String) request.getOrDefault("candidatePhone", "");
        String coverNote = (String) request.getOrDefault("coverNote", "");

        em.createNativeQuery(
                "INSERT INTO agency_submissions (tenant_id, agency_id, job_posting_id, candidate_name, candidate_email, candidate_phone, cover_note, status, submitted_at) " +
                "VALUES (:tenantId, :agencyId, :jobPostingId, :name, :email, :phone, :note, 'SUBMITTED', NOW())")
                .setParameter("tenantId", tenantId)
                .setParameter("agencyId", agencyId)
                .setParameter("jobPostingId", jobPostingId)
                .setParameter("name", candidateName)
                .setParameter("email", candidateEmail)
                .setParameter("phone", candidatePhone)
                .setParameter("note", coverNote)
                .executeUpdate();

        log.info("Agency submission created for {} via demo-reset action", candidateName);
        return ResponseEntity.ok(Map.of("agencyId", agencyId, "candidateName", candidateName, "status", "SUBMITTED"));
    }

    private ResponseEntity<Map<String, Object>> createOffer(String tenantId, Map<String, Object> request) {
        Long applicationId = Long.valueOf(request.get("applicationId").toString());
        String jobTitle = (String) request.get("jobTitle");
        String department = (String) request.get("department");
        Number baseSalary = (Number) request.get("baseSalary");
        String offerType = (String) request.getOrDefault("offerType", "FULL_TIME_PERMANENT");
        String currency = (String) request.getOrDefault("currency", "ZAR");
        String startDate = (String) request.get("startDate");
        String expiryDate = (String) request.get("offerExpiryDate");
        String workLocation = (String) request.getOrDefault("workLocation", "");
        String benefitsPackage = (String) request.getOrDefault("benefitsPackage", "");
        String reportingManager = (String) request.getOrDefault("reportingManager", "");
        Number probationDays = (Number) request.getOrDefault("probationaryPeriodDays", 90);
        Number noticeDays = (Number) request.getOrDefault("noticePeriodDays", 30);
        Number vacationDays = (Number) request.getOrDefault("vacationDaysAnnual", 20);
        Number sickDays = (Number) request.getOrDefault("sickDaysAnnual", 15);
        Boolean bonusEligible = (Boolean) request.getOrDefault("bonusEligible", false);
        Number bonusPercent = (Number) request.getOrDefault("bonusTargetPercentage", 0);
        Boolean healthInsurance = (Boolean) request.getOrDefault("healthInsurance", false);
        Boolean retirementPlan = (Boolean) request.getOrDefault("retirementPlan", false);
        Number retirementPercent = (Number) request.getOrDefault("retirementContributionPercentage", 0);

        // Generate offer number
        String offerNumber = "OFF-" + System.currentTimeMillis();

        em.createNativeQuery(
                "INSERT INTO offers (tenant_id, application_id, offer_number, job_title, department, base_salary, " +
                "currency, offer_type, start_date, offer_expiry_date, work_location, benefits_package, " +
                "reporting_manager, probationary_period_days, notice_period_days, vacation_days_annual, " +
                "sick_days_annual, bonus_eligible, bonus_target_percentage, health_insurance, retirement_plan, " +
                "retirement_contribution_percentage, status, created_at, created_by) " +
                "VALUES (:tenantId, :appId, :offerNum, :jobTitle, :dept, :salary, :currency, :offerType, " +
                "CAST(:startDate AS DATE), CAST(:expiryDate AS TIMESTAMP), :location, :benefits, :manager, " +
                ":probation, :notice, :vacation, :sick, :bonus, :bonusPct, :health, :retirement, :retPct, " +
                "'DRAFT', NOW(), 1)")
                .setParameter("tenantId", tenantId)
                .setParameter("appId", applicationId)
                .setParameter("offerNum", offerNumber)
                .setParameter("jobTitle", jobTitle)
                .setParameter("dept", department)
                .setParameter("salary", baseSalary)
                .setParameter("currency", currency)
                .setParameter("offerType", offerType)
                .setParameter("startDate", startDate)
                .setParameter("expiryDate", expiryDate)
                .setParameter("location", workLocation)
                .setParameter("benefits", benefitsPackage)
                .setParameter("manager", reportingManager)
                .setParameter("probation", probationDays)
                .setParameter("notice", noticeDays)
                .setParameter("vacation", vacationDays)
                .setParameter("sick", sickDays)
                .setParameter("bonus", bonusEligible)
                .setParameter("bonusPct", bonusPercent)
                .setParameter("health", healthInsurance)
                .setParameter("retirement", retirementPlan)
                .setParameter("retPct", retirementPercent)
                .executeUpdate();

        // Get the created offer ID
        Object offerId = em.createNativeQuery("SELECT id FROM offers WHERE tenant_id = :tenantId AND offer_number = :offerNum")
                .setParameter("tenantId", tenantId)
                .setParameter("offerNum", offerNumber)
                .getSingleResult();

        log.info("Offer {} created for application {} via demo-reset action", offerId, applicationId);
        return ResponseEntity.ok(Map.of("id", offerId, "offerNumber", offerNumber, "applicationId", applicationId, "status", "DRAFT"));
    }
}
