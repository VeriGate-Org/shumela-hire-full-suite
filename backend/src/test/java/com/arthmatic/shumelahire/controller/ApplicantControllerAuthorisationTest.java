package com.arthmatic.shumelahire.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The authorisation actually written on the applicant endpoints.
 *
 * <p>{@link com.arthmatic.shumelahire.security.ApplicantAccess} is unit-tested next door, but a
 * correct rule that nobody applies protects nothing — the {@code @PreAuthorize} expression is the
 * control, and it is one careless edit from being loosened back. This reads the annotations off the
 * class rather than trusting them, in the same spirit as the AI feature registry test.
 *
 * <p>What it is pinning: every endpoint that takes an applicant id used to admit {@code APPLICANT}
 * and {@code EMPLOYEE} by bare role and then check nothing about the id, so any signed-in candidate
 * could read, overwrite, or delete documents from another candidate's file by changing the URL.
 */
class ApplicantControllerAuthorisationTest {

    /** Methods whose mapping carries an applicant id, and so need an ownership check. */
    private static final List<String> ID_SCOPED = List.of(
            "getApplicant",
            "updateApplicant",
            "uploadDocument",
            "getApplicantDocuments",
            "deleteDocument",
            "getApplicationSummary");

    /**
     * The same fault, on endpoints that hang off other controllers.
     *
     * <p>These three are how self-service reads a candidate's applications, offers and interviews.
     * Each admitted {@code APPLICANT} and {@code EMPLOYEE} by role and checked nothing about the id
     * — so any signed-in candidate could read anyone's application history, and anyone's offer
     * terms, by changing the URL. The interviews mapping even carried a comment saying candidates
     * may read "their own", which nothing implemented.
     */
    private static final List<Class<?>> SIBLING_CONTROLLERS = List.of(
            ApplicationController.class, OfferController.class, InterviewController.class);

    private static final List<String> SIBLING_METHODS = List.of(
            "getApplicationsByApplicant", "getOffersByApplicant", "getInterviewsByApplication");

    @Test
    @DisplayName("The sibling self-service reads check ownership too")
    void siblingSelfServiceReadsCheckOwnership() {
        for (String methodName : SIBLING_METHODS) {
            String expression = SIBLING_CONTROLLERS.stream()
                    .flatMap(type -> Arrays.stream(type.getDeclaredMethods()))
                    .filter(m -> m.getName().equals(methodName))
                    .findFirst()
                    .map(m -> m.getAnnotation(PreAuthorize.class))
                    .map(PreAuthorize::value)
                    .orElseThrow(() -> new AssertionError(
                            methodName + " is gone or lost its @PreAuthorize"));

            assertFalse(expression.contains("'APPLICANT'"),
                    methodName + " grants APPLICANT by role: " + expression);
            assertFalse(expression.contains("'EMPLOYEE'"),
                    methodName + " grants EMPLOYEE by role: " + expression);
            assertTrue(expression.contains("applicantAccess"),
                    methodName + " has no ownership clause: " + expression);
        }
    }

    private static String expressionOn(String methodName) {
        Method method = Arrays.stream(ApplicantController.class.getDeclaredMethods())
                .filter(m -> m.getName().equals(methodName))
                .findFirst()
                .orElseThrow(() -> new AssertionError(
                        "No method " + methodName + " on ApplicantController. If it was renamed, "
                                + "rename it here too — do not delete the case."));
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        if (annotation == null) {
            throw new AssertionError(methodName + " has no @PreAuthorize at all");
        }
        return annotation.value();
    }

    @Test
    @DisplayName("No id-scoped endpoint admits a candidate on role alone")
    void idScopedEndpointsCheckOwnership() {
        for (String methodName : ID_SCOPED) {
            String expression = expressionOn(methodName);

            // Granting APPLICANT or EMPLOYEE by role is exactly the fault: it opens the endpoint
            // without saying whose record the id refers to.
            assertFalse(expression.contains("'APPLICANT'"),
                    methodName + " grants APPLICANT by role: " + expression);
            assertFalse(expression.contains("'EMPLOYEE'"),
                    methodName + " grants EMPLOYEE by role: " + expression);
        }
    }

    @Test
    @DisplayName("Endpoints a candidate must still reach do it through the ownership check")
    void selfServiceGoesThroughApplicantAccess() {
        // These five are the candidate's own record and documents. They have to remain reachable,
        // and the only way that is allowed now is by the id being theirs.
        List.of("getApplicant", "updateApplicant", "uploadDocument",
                "getApplicantDocuments", "deleteDocument")
                .forEach(methodName -> assertTrue(
                        expressionOn(methodName).contains("applicantAccess"),
                        methodName + " no longer consults ApplicantAccess: " + expressionOn(methodName)));
    }

    @Test
    @DisplayName("The applicant list is staff-only — it is the whole table")
    void listIsStaffOnly() {
        String expression = expressionOn("searchApplicants");

        assertFalse(expression.contains("'APPLICANT'"), expression);
        assertFalse(expression.contains("'EMPLOYEE'"), expression);
        assertTrue(expression.contains("'RECRUITER'"), expression);
    }

    @Test
    @DisplayName("The self-lookup takes no id, so it needs no ownership check")
    void meEndpointIsAuthenticatedOnly() {
        // It resolves the record from the token. There is no parameter to point at anybody else,
        // which is the reason it can be open to any signed-in user.
        String expression = expressionOn("getMyApplicantRecord");

        assertTrue(expression.contains("isAuthenticated"), expression);
    }

    @Test
    @DisplayName("The controller is still mounted where the frontend calls it")
    void mappingIsUnchanged() {
        // /me is a literal path competing with /{id}; if the class mapping moved, both this and the
        // ownership rules would be pinned against the wrong URLs.
        RequestMapping mapping = ApplicantController.class.getAnnotation(RequestMapping.class);
        assertTrue(Arrays.asList(mapping.value()).contains("/api/applicants"));
    }
}
