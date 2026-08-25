package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.PipelineAnalyticsResponse;
import com.arthmatic.shumelahire.dto.RecruiterDashboardResponse;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * The recruitment overview, composed from the summaries each page already uses.
 *
 * <p><b>Composed, not recomputed.</b> Every count here comes from the same {@code summary()} method
 * the corresponding page calls, so the dashboard cannot quote a different number from the screen it
 * links to. A dashboard that disagrees with the pages beneath it is worse than one that shows
 * nothing.
 *
 * <p><b>Pipeline analytics are allowed to fail without taking the page with them.</b> They read a
 * date-ranged index and are the one part of this response that can be slow or unavailable; the rest
 * are counts. A failure there sets {@code pipelineAvailable = false} so the client can say the
 * funnel is unavailable while still showing the figures it does have — rather than the page
 * rendering zeros for everything, which is what it did before.
 */
@Service
public class RecruiterDashboardService {

    private static final Logger logger = LoggerFactory.getLogger(RecruiterDashboardService.class);

    /** The window the pipeline funnel describes. A quarter is what the page's heading claims. */
    private static final int PIPELINE_WINDOW_DAYS = 90;

    private final JobPostingService jobPostingService;
    private final ApplicationService applicationService;
    private final InterviewService interviewService;
    private final OfferService offerService;
    private final PipelineService pipelineService;
    private final OfferDataRepository offerRepository;
    private final ApplicationDataRepository applicationRepository;

    public RecruiterDashboardService(JobPostingService jobPostingService,
                                     ApplicationService applicationService,
                                     InterviewService interviewService,
                                     OfferService offerService,
                                     PipelineService pipelineService,
                                     OfferDataRepository offerRepository,
                                     ApplicationDataRepository applicationRepository) {
        this.jobPostingService = jobPostingService;
        this.applicationService = applicationService;
        this.interviewService = interviewService;
        this.offerService = offerService;
        this.pipelineService = pipelineService;
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
    }

    public RecruiterDashboardResponse overview() {
        LocalDateTime now = LocalDateTime.now();

        PipelineAnalyticsResponse pipeline;
        try {
            pipeline = pipelineService.getPipelineAnalytics(now.minusDays(PIPELINE_WINDOW_DAYS), now);
        } catch (RuntimeException e) {
            // Logged rather than swallowed. The page reports the funnel as unavailable; everything
            // else on the response is still true.
            logger.warn("Pipeline analytics unavailable for the dashboard: {}", e.getMessage());
            pipeline = null;
        }

        return RecruiterDashboardResponse.from(
                jobPostingService.summary(),
                applicationService.summary(),
                interviewService.summary(),
                offerService.summary(),
                offerRepository.findAll(),
                pipeline,
                applicationRepository.countBySubmittedAtBetween(now.minusDays(7), now));
    }
}
