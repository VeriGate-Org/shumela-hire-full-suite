package com.arthmatic.shumelahire.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the two shortlisting mutations to the audit trail, and the actor to the token.
 *
 * <p>Neither {@code autoShortlist} nor {@code overrideShortlistDecision} wrote an audit entry — both
 * only logged to the application log, which is not retained, not searchable by an auditor and not
 * what Scene 2 shows a panel. Auto-shortlisting moves candidates through the pipeline and emails
 * them; an override is a person overruling the model about someone's application. Those are the two
 * events in this feature that most need to be answerable later.</p>
 *
 * <p>The second half matters as much as the first: {@code overrideDecision} previously read
 * {@code userId} from the <em>request body</em>. An audit record naming an actor the caller chose is
 * worse than no record, because it carries the authority of the trail while being unverifiable.</p>
 *
 * <p>Asserted against the source because the alternative is standing up DynamoDB, Cognito and a
 * notification stack to observe one call — and the property worth protecting is simply that the
 * calls are present and the actor is not client-supplied.</p>
 */
class ShortlistingAuditTest {

    private static final Path SERVICE =
            Path.of("src/main/java/com/arthmatic/shumelahire/service/ShortlistingService.java");
    private static final Path CONTROLLER =
            Path.of("src/main/java/com/arthmatic/shumelahire/controller/ShortlistingController.java");

    private String service() throws IOException { return Files.readString(SERVICE); }
    private String controller() throws IOException { return Files.readString(CONTROLLER); }

    @Test
    @DisplayName("Auto-shortlist writes an audit entry")
    void autoShortlistIsAudited() throws IOException {
        String s = service();
        assertTrue(s.contains("\"SHORTLIST_AUTO_RUN\""),
                "a run that advances candidates and emails them must leave a record");
        assertTrue(s.contains("auditLogService.logUserAction"), "must be a user action, not a system one");
    }

    @Test
    @DisplayName("The auto-shortlist entry records threshold and counts, not just that it happened")
    void autoShortlistEntryIsUseful() throws IOException {
        String s = service();
        int at = s.indexOf("SHORTLIST_AUTO_RUN");
        String entry = s.substring(at, Math.min(s.length(), at + 500));
        assertTrue(entry.contains("threshold"), "which threshold was used is the whole question");
        assertTrue(entry.contains("shortlisted"), "how many were shortlisted");
        assertTrue(entry.contains("advanced"), "how many were moved into screening");
    }

    @Test
    @DisplayName("Override writes an audit entry")
    void overrideIsAudited() throws IOException {
        assertTrue(service().contains("\"SHORTLIST_OVERRIDDEN\""),
                "a human overruling the model is the most consequential action here");
    }

    @Test
    @DisplayName("The override entry records direction, prior state and the stated reason")
    void overrideEntryIsUseful() throws IOException {
        String s = service();
        int at = s.indexOf("SHORTLIST_OVERRIDDEN");
        String entry = s.substring(at, Math.min(s.length(), at + 600));
        assertTrue(entry.contains("included in") && entry.contains("excluded from"), "the direction");
        assertTrue(entry.contains("wasShortlisted"), "what it was before");
        assertTrue(entry.contains("Reason"), "the stated justification");
        assertTrue(entry.contains("not stated"),
                "an override with no reason must say so rather than leave a blank");
    }

    @Test
    @DisplayName("The actor is resolved from the token, never from the request body")
    void actorComesFromTheToken() throws IOException {
        String c = controller();
        assertTrue(c.contains("resolveUserId(authentication)"),
                "both audited endpoints must resolve the actor from the principal");
        assertFalse(c.contains("request.get(\"userId\")"),
                "a client-supplied userId would let a caller attribute an override to a colleague");
    }

    @Test
    @DisplayName("Both audited endpoints take Authentication")
    void endpointsReceiveAuthentication() throws IOException {
        String c = controller();
        int auto = c.indexOf("autoShortlist(");
        int override = c.indexOf("overrideDecision(");
        assertTrue(c.substring(auto, auto + 400).contains("Authentication authentication"));
        assertTrue(c.substring(override, override + 400).contains("Authentication authentication"));
    }
}
