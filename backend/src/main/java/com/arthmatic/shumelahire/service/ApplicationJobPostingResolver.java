package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resolves the {@link JobPosting} behind an {@link Application}.
 *
 * <p><strong>Why this exists.</strong> {@code Application} carries both a {@code jobPosting}
 * relation and a {@code jobPostingId} string, but
 * {@code DynamoApplicationRepository.toEntity()} only ever sets the id — it never hydrates the
 * relation. On the DynamoDB backend, which is what runs in the serverless (production)
 * environment, {@code application.getJobPosting()} is therefore <em>always null</em>.</p>
 *
 * <p>Everything that read the relation directly was silently degraded by that:</p>
 * <ul>
 *   <li>{@code PipelineService.enforceBackgroundCheckCompletion} returns early on a null posting,
 *       so <strong>the verification gate never fired in production for any candidate on any
 *       posting</strong> — it could be configured, and it did nothing.</li>
 *   <li>{@code BackgroundCheckController.getRequiredCheckTypes} dereferenced it without a guard
 *       and returned <strong>HTTP 500</strong>, so the Verification panel showed an error rather
 *       than the outstanding checks.</li>
 * </ul>
 *
 * <p>The unit tests did not catch it because they construct an {@code Application} and call
 * {@code setJobPosting(...)} directly, which no code path does at runtime.</p>
 *
 * <p><strong>Why not hydrate in {@code toEntity()} instead.</strong> Two reasons. A stub posting
 * carrying only an id would be worse than null — it reads as hydrated while every field is empty,
 * so the gate would still no-op but silently and less visibly. And a real load per row would put a
 * read behind every application in every list query, on a pipeline board that already takes ~12
 * seconds to render. Resolving lazily at the few points that need the posting costs one read where
 * it is actually required.</p>
 */
@Service
public class ApplicationJobPostingResolver {

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    /**
     * The posting for this application, hydrating from {@code jobPostingId} when the relation is
     * not populated. Empty when the application has no posting id, or the id refers to nothing.
     */
    public Optional<JobPosting> resolve(Application application) {
        if (application == null) {
            return Optional.empty();
        }
        JobPosting posting = application.getJobPosting();
        if (posting != null) {
            return Optional.of(posting);
        }
        String postingId = application.getJobPostingId();
        if (postingId == null || postingId.isBlank()) {
            return Optional.empty();
        }
        return jobPostingRepository.findById(postingId);
    }
}
