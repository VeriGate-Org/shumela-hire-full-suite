package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The transitions the API tells a client are legal.
 *
 * <p>Sent so a screen can offer only controls that will work. The application detail page held no
 * transition table and offered a single action — Reject — while the status endpoint has always
 * been generic; the alternative fix, teaching the page the rules, means two copies of one rule and
 * the copy the user is looking at is the one that drifts.
 */
class ApplicationResponseTransitionsTest {

    private static Application withStatus(ApplicationStatus status) {
        Application application = new Application();
        application.setId("app-1");
        application.setStatus(status);
        return application;
    }

    @Test
    @DisplayName("A submitted application may be screened, rejected or withdrawn")
    void submittedCanAdvance() {
        var response = new ApplicationResponse(withStatus(ApplicationStatus.SUBMITTED));
        assertEquals(
                java.util.List.of("SCREENING", "REJECTED", "WITHDRAWN"),
                response.getAllowedTransitions());
    }

    @Test
    @DisplayName("Every terminal status offers nothing — rejection in particular cannot be undone")
    void terminalStatusesOfferNothing() {
        // The confirmation dialog on the detail page has been telling users that rejecting "can be
        // reversed by changing the status again". canTransitionTo disagrees, and it is the one
        // enforced.
        for (ApplicationStatus status : new ApplicationStatus[] {
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN,
                ApplicationStatus.OFFER_DECLINED,
                ApplicationStatus.HIRED }) {
            var response = new ApplicationResponse(withStatus(status));
            assertTrue(response.getAllowedTransitions().isEmpty(),
                    status + " should be terminal");
        }
    }

    @Test
    @DisplayName("The listed transitions are exactly the ones the entity would accept")
    void transitionsMatchTheEntityRule() {
        for (ApplicationStatus status : ApplicationStatus.values()) {
            var response = new ApplicationResponse(withStatus(status));
            for (ApplicationStatus target : ApplicationStatus.values()) {
                assertEquals(status.canTransitionTo(target),
                        response.getAllowedTransitions().contains(target.name()),
                        status + " -> " + target);
            }
        }
    }

    @Test
    @DisplayName("A brand-new application defaults to submitted, and lists the submitted transitions")
    void defaultStatusIsUsable() {
        // Application.status is field-initialised to SUBMITTED, so there is no null-status case to
        // defend against here — getStatusDisplayName would already have dereferenced it.
        Application application = new Application();
        application.setId("app-1");

        var response = new ApplicationResponse(application);
        assertEquals(ApplicationStatus.SUBMITTED, response.getStatus());
        assertTrue(response.getAllowedTransitions().contains("SCREENING"));
    }
}
