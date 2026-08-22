package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the delegated-authority rule for job posting approval.
 *
 * <p>A Talent Acquisition Manager owns the vacancies they run, so their own submissions are approved
 * on submission. A TA Specialist — provisioned as {@code RECRUITER} — sits below that line and still
 * needs a manager or above. The threshold is expressed through the priority ordering already
 * declared on {@link User.Role}, so these assertions guard that ordering as much as the rule.</p>
 */
class JobPostingDelegatedApprovalTest {

    private static final User.Role THRESHOLD = User.Role.HIRING_MANAGER;

    @Test
    @DisplayName("A hiring manager approves their own posting")
    void hiringManagerSelfApproves() {
        assertTrue(User.Role.HIRING_MANAGER.hasPermission(THRESHOLD));
    }

    @Test
    @DisplayName("Roles above a hiring manager also self-approve")
    void seniorRolesSelfApprove() {
        assertTrue(User.Role.HR_MANAGER.hasPermission(THRESHOLD));
        assertTrue(User.Role.EXECUTIVE.hasPermission(THRESHOLD));
        assertTrue(User.Role.ADMIN.hasPermission(THRESHOLD));
        assertTrue(User.Role.PLATFORM_OWNER.hasPermission(THRESHOLD));
        assertTrue(User.Role.LINE_MANAGER.hasPermission(THRESHOLD));
    }

    @Test
    @DisplayName("A TA Specialist (RECRUITER) still requires approval by a manager or above")
    void recruiterRequiresApproval() {
        assertFalse(User.Role.RECRUITER.hasPermission(THRESHOLD));
    }

    @Test
    @DisplayName("Roles below a recruiter also require approval")
    void juniorRolesRequireApproval() {
        assertFalse(User.Role.INTERVIEWER.hasPermission(THRESHOLD));
        assertFalse(User.Role.EMPLOYEE.hasPermission(THRESHOLD));
        assertFalse(User.Role.APPLICANT.hasPermission(THRESHOLD));
    }

    @Test
    @DisplayName("The seniority ordering the rule depends on holds")
    void priorityOrderingIsIntact() {
        assertTrue(User.Role.HIRING_MANAGER.getPriority() > User.Role.RECRUITER.getPriority(),
                "a hiring manager must outrank a recruiter, or the rule inverts");
        assertTrue(User.Role.HR_MANAGER.getPriority() > User.Role.HIRING_MANAGER.getPriority());
        assertTrue(User.Role.ADMIN.getPriority() > User.Role.HR_MANAGER.getPriority());
    }
}
