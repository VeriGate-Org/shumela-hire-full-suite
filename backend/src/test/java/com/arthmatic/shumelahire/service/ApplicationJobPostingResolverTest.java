package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers resolving the posting behind an application.
 *
 * <p><strong>The state under test is the one production actually produces.</strong>
 * {@code DynamoApplicationRepository.toEntity()} sets {@code jobPostingId} and never sets
 * {@code jobPosting}, so on the serverless backend every application read has a null relation and a
 * populated id. Every existing test in this area builds the opposite — an application with the
 * relation set by hand — which is why the verification gate could ship, pass its tests, and do
 * nothing at all in production.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Application → JobPosting resolution")
class ApplicationJobPostingResolverTest {

    private static final String POSTING_ID = "049060c2-0fdb-49f2-8070-49870104b87e";

    @Mock
    private JobPostingDataRepository jobPostingRepository;

    @InjectMocks
    private ApplicationJobPostingResolver resolver;

    private JobPosting posting() {
        JobPosting p = new JobPosting();
        p.setId(POSTING_ID);
        p.setTitle("Project Manager");
        p.setEnforceCheckCompletion(true);
        p.setRequiredCheckTypes("[\"CRIMINAL_CHECK\",\"FRAUD_CHECK\",\"DIRECTORSHIP_CHECK\"]");
        return p;
    }

    @Test
    @DisplayName("an application as DynamoDB returns it — id set, relation null — still resolves")
    void resolvesFromIdWhenRelationIsNull() {
        Application app = new Application();
        app.setId("87173b20-59d8-450e-93cf-f35db4d70951");
        app.setJobPostingId(POSTING_ID);
        // deliberately NOT app.setJobPosting(...) — this is the production shape
        when(jobPostingRepository.findById(POSTING_ID)).thenReturn(Optional.of(posting()));

        Optional<JobPosting> resolved = resolver.resolve(app);

        assertTrue(resolved.isPresent(), "the gate is inert unless this resolves");
        assertEquals("Project Manager", resolved.get().getTitle());
        assertEquals(Boolean.TRUE, resolved.get().getEnforceCheckCompletion());
    }

    @Test
    @DisplayName("an already-hydrated relation is used without a read")
    void prefersTheHydratedRelation() {
        JobPosting hydrated = posting();
        Application app = new Application();
        app.setJobPosting(hydrated);
        app.setJobPostingId(POSTING_ID);

        Optional<JobPosting> resolved = resolver.resolve(app);

        assertSame(hydrated, resolved.get());
        verify(jobPostingRepository, never()).findById(anyString());
    }

    @Test
    @DisplayName("an application with no posting id resolves to empty rather than reading")
    void emptyWhenNoPostingId() {
        Application app = new Application();
        app.setId("app-1");

        assertTrue(resolver.resolve(app).isEmpty());
        verify(jobPostingRepository, never()).findById(anyString());
    }

    @Test
    @DisplayName("a posting id that refers to nothing resolves to empty, not an exception")
    void emptyWhenPostingMissing() {
        Application app = new Application();
        app.setJobPostingId("gone");
        when(jobPostingRepository.findById("gone")).thenReturn(Optional.empty());

        assertTrue(resolver.resolve(app).isEmpty());
    }

    @Test
    @DisplayName("a blank posting id is treated as absent, not looked up")
    void blankPostingIdIsNotLookedUp() {
        Application app = new Application();
        app.setJobPostingId("   ");

        assertTrue(resolver.resolve(app).isEmpty());
        verify(jobPostingRepository, never()).findById(anyString());
    }

    @Test
    @DisplayName("a null application resolves to empty")
    void nullApplication() {
        assertTrue(resolver.resolve(null).isEmpty());
    }
}
