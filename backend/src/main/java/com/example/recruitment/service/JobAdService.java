package com.example.recruitment.service;

import com.example.recruitment.dto.*;
import com.example.recruitment.entity.JobAd;
import com.example.recruitment.entity.JobAdHistory;
import com.example.recruitment.entity.JobAdStatus;
import com.example.recruitment.repository.JobAdHistoryRepository;
import com.example.recruitment.repository.JobAdRepository;
import com.arthmatic.shumelahire.config.CacheConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobAdService {
    
    private static final Logger logger = LoggerFactory.getLogger(JobAdService.class);
    
    @Autowired
    private JobAdRepository jobAdRepository;
    
    @Autowired
    private JobAdHistoryRepository jobAdHistoryRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private SlugGeneratorService slugGeneratorService;
    
    /**
     * Create a new job ad (draft or published)
     */
    public JobAdResponse createJobAd(JobAdCreateRequest request) {
        logger.info("Creating job ad with title: {}", request.getTitle());
        
        // Validate channels
        validateChannels(request.getChannelInternal(), request.getChannelExternal());
        
        // Create new job ad
        JobAd jobAd = new JobAd();
        jobAd.setRequisitionId(request.getRequisitionId());
        jobAd.setTitle(request.getTitle());
        jobAd.setHtmlBody(request.getHtmlBody());
        jobAd.setChannelInternal(request.getChannelInternal());
        jobAd.setChannelExternal(request.getChannelExternal());
        jobAd.setClosingDate(request.getClosingDate());
        jobAd.setCreatedBy(request.getCreatedBy());
        
        // Generate slug if not provided
        if (StringUtils.hasText(request.getSlug())) {
            validateAndSetSlug(jobAd, request.getSlug());
        } else if (Boolean.TRUE.equals(request.getChannelExternal())) {
            // Only generate slug for external ads
            String generatedSlug = slugGeneratorService.generateSlug(request.getTitle());
            validateAndSetSlug(jobAd, generatedSlug);
        }
        
        // Set initial status
        jobAd.setStatus(Boolean.TRUE.equals(request.getPublishImmediately()) ? 
                       JobAdStatus.PUBLISHED : JobAdStatus.DRAFT);
        
        // Save job ad
        JobAd savedJobAd = jobAdRepository.save(jobAd);
        
        // Create history entry
        String action = savedJobAd.isPublished() ? JobAdHistory.ACTION_PUBLISHED : JobAdHistory.ACTION_CREATED;
        createHistoryEntry(savedJobAd, action, request.getCreatedBy(), 
                          "Job ad " + (savedJobAd.isPublished() ? "published" : "created"));
        
        // Log to audit system
        auditLogService.logJobAdAction(savedJobAd.getId(), action, request.getCreatedBy(), 
                                      savedJobAd.getTitle());
        
        logger.info("Job ad created with ID: {}, Status: {}", savedJobAd.getId(), savedJobAd.getStatus());
        
        return JobAdResponse.fromEntity(savedJobAd);
    }
    
    /**
     * Update an existing job ad
     */
    @CacheEvict(value = "jobAds", allEntries = true)
    public JobAdResponse updateJobAd(Long id, JobAdUpdateRequest request, String actorUserId) {
        logger.info("Updating job ad with ID: {}", id);
        
        JobAd jobAd = findJobAdById(id);
        
        // Validate business rules
        if (jobAd.getStatus() == JobAdStatus.PUBLISHED) {
            throw new IllegalStateException("Cannot update published job ad. Unpublish first.");
        }
        
        if (jobAd.getStatus() == JobAdStatus.EXPIRED) {
            throw new IllegalStateException("Cannot update expired job ad.");
        }
        
        // Update fields
        jobAd.setTitle(request.getTitle());
        jobAd.setHtmlBody(request.getHtmlBody());
        
        if (request.getChannelInternal() != null) {
            jobAd.setChannelInternal(request.getChannelInternal());
        }
        if (request.getChannelExternal() != null) {
            jobAd.setChannelExternal(request.getChannelExternal());
        }
        if (request.getClosingDate() != null) {
            jobAd.setClosingDate(request.getClosingDate());
        }
        
        // Update slug if provided and external channel is enabled
        if (StringUtils.hasText(request.getSlug()) && Boolean.TRUE.equals(jobAd.getChannelExternal())) {
            validateAndSetSlug(jobAd, request.getSlug());
        }
        
        // Validate channels
        validateChannels(jobAd.getChannelInternal(), jobAd.getChannelExternal());
        
        // Save changes
        JobAd updatedJobAd = jobAdRepository.save(jobAd);
        
        // Create history entry
        createHistoryEntry(updatedJobAd, JobAdHistory.ACTION_UPDATED, actorUserId, "Job ad updated");
        
        // Log to audit system
        auditLogService.logJobAdAction(updatedJobAd.getId(), JobAdHistory.ACTION_UPDATED, 
                                      actorUserId, updatedJobAd.getTitle());
        
        logger.info("Job ad updated with ID: {}", updatedJobAd.getId());
        
        return JobAdResponse.fromEntity(updatedJobAd);
    }
    
    /**
     * Publish a job ad
     */
    public JobAdResponse publishJobAd(Long id, JobAdPublishRequest request) {
        logger.info("Publishing job ad with ID: {}", id);
        
        JobAd jobAd = findJobAdById(id);
        
        // Validate business rules
        if (jobAd.getStatus() == JobAdStatus.PUBLISHED) {
            throw new IllegalStateException("Job ad is already published");
        }
        
        if (jobAd.getStatus() == JobAdStatus.EXPIRED) {
            throw new IllegalStateException("Cannot publish expired job ad");
        }
        
        // Validate channels
        validateChannels(request.getChannelInternal(), request.getChannelExternal());
        
        // Update publishing details
        jobAd.setChannelInternal(request.getChannelInternal());
        jobAd.setChannelExternal(request.getChannelExternal());
        jobAd.setStatus(JobAdStatus.PUBLISHED);
        
        if (request.getClosingDate() != null) {
            if (request.getClosingDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Closing date cannot be in the past");
            }
            jobAd.setClosingDate(request.getClosingDate());
        }
        
        // Set or update slug if external channel is enabled
        if (Boolean.TRUE.equals(request.getChannelExternal())) {
            if (StringUtils.hasText(request.getSlug())) {
                validateAndSetSlug(jobAd, request.getSlug());
            } else if (!StringUtils.hasText(jobAd.getSlug())) {
                String generatedSlug = slugGeneratorService.generateSlug(jobAd.getTitle());
                validateAndSetSlug(jobAd, generatedSlug);
            }
        }
        
        // Save changes
        JobAd publishedJobAd = jobAdRepository.save(jobAd);
        
        // Create history entry
        String details = String.format("Published to channels: Internal=%s, External=%s", 
                                      request.getChannelInternal(), request.getChannelExternal());
        createHistoryEntry(publishedJobAd, JobAdHistory.ACTION_PUBLISHED, request.getActorUserId(), details);
        
        // Log to audit system
        auditLogService.logJobAdAction(publishedJobAd.getId(), JobAdHistory.ACTION_PUBLISHED, 
                                      request.getActorUserId(), publishedJobAd.getTitle());
        
        logger.info("Job ad published with ID: {}", publishedJobAd.getId());
        
        return JobAdResponse.fromEntity(publishedJobAd);
    }
    
    /**
     * Unpublish a job ad
     */
    public JobAdResponse unpublishJobAd(Long id, String actorUserId) {
        logger.info("Unpublishing job ad with ID: {}", id);
        
        JobAd jobAd = findJobAdById(id);
        
        // Validate business rules
        if (jobAd.getStatus() != JobAdStatus.PUBLISHED) {
            throw new IllegalStateException("Job ad is not published");
        }
        
        // Update status
        jobAd.setStatus(JobAdStatus.UNPUBLISHED);
        
        // Save changes
        JobAd unpublishedJobAd = jobAdRepository.save(jobAd);
        
        // Create history entry
        createHistoryEntry(unpublishedJobAd, JobAdHistory.ACTION_UNPUBLISHED, actorUserId, "Job ad unpublished");
        
        // Log to audit system
        auditLogService.logJobAdAction(unpublishedJobAd.getId(), JobAdHistory.ACTION_UNPUBLISHED, 
                                      actorUserId, unpublishedJobAd.getTitle());
        
        logger.info("Job ad unpublished with ID: {}", unpublishedJobAd.getId());
        
        return JobAdResponse.fromEntity(unpublishedJobAd);
    }
    
    /**
     * Get job ad by ID
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "jobAds", key = "#id")
    public JobAdResponse getJobAd(Long id) {
        JobAd jobAd = findJobAdById(id);
        return JobAdResponse.fromEntity(jobAd);
    }
    
    /**
     * Get job ad by slug (public access)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "jobAds", key = "'slug_' + #slug")
    public JobAdResponse getJobAdBySlug(String slug) {
        Optional<JobAd> jobAdOpt = jobAdRepository.findBySlug(slug);
        if (jobAdOpt.isEmpty()) {
            throw new IllegalArgumentException("Job ad not found with slug: " + slug);
        }
        
        JobAd jobAd = jobAdOpt.get();
        
        // Only return if published and external channel is enabled
        if (jobAd.getStatus() != JobAdStatus.PUBLISHED || !Boolean.TRUE.equals(jobAd.getChannelExternal())) {
            throw new IllegalArgumentException("Job ad not available");
        }
        
        // Check if expired
        if (jobAd.isExpired()) {
            throw new IllegalArgumentException("Job ad has expired");
        }
        
        return JobAdResponse.fromEntity(jobAd);
    }
    
    /**
     * Search job ads with filters
     */
    @Transactional(readOnly = true)
    public Page<JobAdResponse> searchJobAds(JobAdStatus status, String channel, String query, Pageable pageable) {
        Boolean channelInternal = null;
        Boolean channelExternal = null;
        
        if ("internal".equalsIgnoreCase(channel)) {
            channelInternal = true;
        } else if ("external".equalsIgnoreCase(channel)) {
            channelExternal = true;
        }
        
        Page<JobAd> jobAds = jobAdRepository.findWithFilters(status, channelInternal, channelExternal, query, pageable);
        return jobAds.map(JobAdResponse::fromEntity);
    }
    
    /**
     * Get job ad history
     */
    @Transactional(readOnly = true)
    public List<JobAdHistory> getJobAdHistory(Long jobAdId) {
        return jobAdHistoryRepository.findByJobAdIdOrderByTimestampDesc(jobAdId);
    }
    
    /**
     * Expire ads automatically (called by nightly job)
     */
    public int expireAds() {
        logger.info("Running nightly job to expire ads");
        
        LocalDate currentDate = LocalDate.now();
        List<JobAd> adsToExpire = jobAdRepository.findAdsToExpire(currentDate);
        
        for (JobAd jobAd : adsToExpire) {
            logger.info("Expiring job ad: {} (ID: {})", jobAd.getTitle(), jobAd.getId());
            
            jobAd.setStatus(JobAdStatus.EXPIRED);
            jobAdRepository.save(jobAd);
            
            // Create history entry
            createHistoryEntry(jobAd, JobAdHistory.ACTION_EXPIRED, "SYSTEM", 
                              "Automatically expired due to closing date");
            
            // Log to audit system
            auditLogService.logJobAdAction(jobAd.getId(), JobAdHistory.ACTION_EXPIRED, 
                                          "SYSTEM", jobAd.getTitle());
        }
        
        logger.info("Expired {} job ads", adsToExpire.size());
        return adsToExpire.size();
    }
    
    // Helper methods
    
    private JobAd findJobAdById(Long id) {
        return jobAdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job ad not found with ID: " + id));
    }
    
    private void validateChannels(Boolean channelInternal, Boolean channelExternal) {
        if (!Boolean.TRUE.equals(channelInternal) && !Boolean.TRUE.equals(channelExternal)) {
            throw new IllegalArgumentException("At least one channel (internal or external) must be selected");
        }
    }
    
    private void validateAndSetSlug(JobAd jobAd, String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new IllegalArgumentException("Slug cannot be empty");
        }
        
        // Check if slug already exists (excluding current job ad)
        if (jobAdRepository.existsBySlug(slug)) {
            if (jobAd.getId() == null || !slug.equals(jobAd.getSlug())) {
                throw new IllegalArgumentException("Slug already exists: " + slug);
            }
        }
        
        jobAd.setSlug(slug);
    }
    
    private void createHistoryEntry(JobAd jobAd, String action, String actorUserId, String details) {
        JobAdHistory history = new JobAdHistory(jobAd, action, actorUserId, details);
        jobAdHistoryRepository.save(history);
    }
}