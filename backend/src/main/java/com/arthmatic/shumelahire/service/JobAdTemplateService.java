package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.*;
import com.arthmatic.shumelahire.entity.JobAdTemplate;
import com.arthmatic.shumelahire.repository.JobAdTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobAdTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(JobAdTemplateService.class);

    @Autowired
    private JobAdTemplateRepository templateRepository;

    /**
     * Create a new job ad template.
     */
    public JobAdTemplateResponse createTemplate(JobAdTemplateCreateRequest request) {
        logger.info("Creating job ad template: {}", request.getName());

        JobAdTemplate template = new JobAdTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setTitle(request.getTitle());
        template.setIntro(request.getIntro());
        template.setResponsibilities(request.getResponsibilities());
        template.setRequirements(request.getRequirements());
        template.setBenefits(request.getBenefits());
        template.setLocation(request.getLocation());
        template.setEmploymentType(request.getEmploymentType());
        template.setSalaryRangeMin(request.getSalaryRangeMin());
        template.setSalaryRangeMax(request.getSalaryRangeMax());
        template.setClosingDate(request.getClosingDate());
        template.setContactEmail(request.getContactEmail());
        template.setIsArchived(Boolean.TRUE.equals(request.getIsArchived()));
        template.setCreatedBy(request.getCreatedBy());

        JobAdTemplate saved = templateRepository.save(template);
        logger.info("Job ad template created with ID: {}", saved.getId());
        return JobAdTemplateResponse.fromEntity(saved);
    }

    /**
     * Get a single template by ID.
     */
    @Transactional(readOnly = true)
    public JobAdTemplateResponse getTemplate(Long id) {
        JobAdTemplate template = findById(id);
        return JobAdTemplateResponse.fromEntity(template);
    }

    /**
     * List templates with optional filters.
     */
    @Transactional(readOnly = true)
    public List<JobAdTemplateResponse> getAllTemplates(
            String search, String employmentType, String location, String createdBy, boolean showArchived) {
        List<JobAdTemplate> templates = templateRepository.findWithFilters(
                StringUtils.hasText(search) ? search : null,
                StringUtils.hasText(employmentType) ? employmentType : null,
                StringUtils.hasText(location) ? location : null,
                StringUtils.hasText(createdBy) ? createdBy : null,
                showArchived);
        return templates.stream()
                .map(JobAdTemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Update an existing template (partial update — only non-null fields are applied).
     */
    public JobAdTemplateResponse updateTemplate(Long id, JobAdTemplateUpdateRequest request) {
        logger.info("Updating job ad template: {}", id);

        JobAdTemplate template = findById(id);

        if (request.getName() != null) template.setName(request.getName());
        if (request.getDescription() != null) template.setDescription(request.getDescription());
        if (request.getTitle() != null) template.setTitle(request.getTitle());
        if (request.getIntro() != null) template.setIntro(request.getIntro());
        if (request.getResponsibilities() != null) template.setResponsibilities(request.getResponsibilities());
        if (request.getRequirements() != null) template.setRequirements(request.getRequirements());
        if (request.getBenefits() != null) template.setBenefits(request.getBenefits());
        if (request.getLocation() != null) template.setLocation(request.getLocation());
        if (request.getEmploymentType() != null) template.setEmploymentType(request.getEmploymentType());
        if (request.getSalaryRangeMin() != null) template.setSalaryRangeMin(request.getSalaryRangeMin());
        if (request.getSalaryRangeMax() != null) template.setSalaryRangeMax(request.getSalaryRangeMax());
        if (request.getClosingDate() != null) template.setClosingDate(request.getClosingDate());
        if (request.getContactEmail() != null) template.setContactEmail(request.getContactEmail());
        if (request.getIsArchived() != null) template.setIsArchived(request.getIsArchived());

        JobAdTemplate saved = templateRepository.save(template);
        logger.info("Job ad template updated: {}", saved.getId());
        return JobAdTemplateResponse.fromEntity(saved);
    }

    /**
     * Delete a template permanently.
     */
    public void deleteTemplate(Long id) {
        logger.info("Deleting job ad template: {}", id);
        JobAdTemplate template = findById(id);
        templateRepository.delete(template);
    }

    /**
     * Duplicate an existing template with a new name.
     */
    public JobAdTemplateResponse duplicateTemplate(Long id, String newName, String actorUserId) {
        logger.info("Duplicating job ad template {} as '{}'", id, newName);

        JobAdTemplate original = findById(id);

        JobAdTemplate duplicate = new JobAdTemplate();
        duplicate.setName(newName);
        duplicate.setDescription(original.getDescription());
        duplicate.setTitle(original.getTitle());
        duplicate.setIntro(original.getIntro());
        duplicate.setResponsibilities(original.getResponsibilities());
        duplicate.setRequirements(original.getRequirements());
        duplicate.setBenefits(original.getBenefits());
        duplicate.setLocation(original.getLocation());
        duplicate.setEmploymentType(original.getEmploymentType());
        duplicate.setSalaryRangeMin(original.getSalaryRangeMin());
        duplicate.setSalaryRangeMax(original.getSalaryRangeMax());
        duplicate.setClosingDate(original.getClosingDate());
        duplicate.setContactEmail(original.getContactEmail());
        duplicate.setIsArchived(false);
        duplicate.setCreatedBy(actorUserId);

        JobAdTemplate saved = templateRepository.save(duplicate);
        logger.info("Job ad template duplicated as ID: {}", saved.getId());
        return JobAdTemplateResponse.fromEntity(saved);
    }

    /**
     * Get template statistics.
     */
    @Transactional(readOnly = true)
    public JobAdTemplateStatsResponse getTemplateStats() {
        JobAdTemplateStatsResponse stats = new JobAdTemplateStatsResponse();
        stats.setTotalTemplates(templateRepository.count());
        stats.setActiveTemplates(templateRepository.countByIsArchivedFalse());
        stats.setArchivedTemplates(templateRepository.countByIsArchivedTrue());

        templateRepository.findFirstByIsArchivedFalseOrderByUsageCountDesc()
                .ifPresent(t -> stats.setMostUsedTemplate(JobAdTemplateResponse.fromEntity(t)));

        List<JobAdTemplate> recent = templateRepository.findRecentlyCreated();
        stats.setRecentlyCreated(
                recent.stream()
                        .limit(5)
                        .map(JobAdTemplateResponse::fromEntity)
                        .collect(Collectors.toList()));

        return stats;
    }

    /**
     * Generate a job ad draft from a template, replacing placeholders.
     */
    public Map<String, Object> generateJobAdDraft(GenerateJobAdDraftRequest body) {
        GenerateJobAdDraftRequest.GenerateAdRequestData request = body.getRequest();
        GenerateJobAdDraftRequest.RequisitionDataDto requisition = body.getRequisitionData();

        Long templateId = Long.parseLong(request.getTemplateId());
        JobAdTemplate template = findById(templateId);

        // Increment usage count
        template.setUsageCount(template.getUsageCount() + 1);
        templateRepository.save(template);

        // Build placeholder data map
        Map<String, String> placeholders = new HashMap<>();
        if (requisition != null) {
            if (requisition.getJobTitle() != null) placeholders.put("jobTitle", requisition.getJobTitle());
            if (requisition.getDepartment() != null) placeholders.put("department", requisition.getDepartment());
            if (requisition.getLocation() != null) placeholders.put("location", requisition.getLocation());
            if (requisition.getEmploymentType() != null) placeholders.put("employmentType", requisition.getEmploymentType());
            if (requisition.getSalaryMin() != null && requisition.getSalaryMax() != null) {
                placeholders.put("salaryRange", String.format("R%,.0f - R%,.0f", requisition.getSalaryMin(), requisition.getSalaryMax()));
            }
        }
        if (request.getCustomData() != null) {
            placeholders.putAll(request.getCustomData());
        }

        // Replace placeholders in template fields
        String title = replacePlaceholders(template.getTitle(), placeholders);
        String intro = replacePlaceholders(template.getIntro(), placeholders);
        String responsibilities = replacePlaceholders(template.getResponsibilities(), placeholders);
        String requirements = replacePlaceholders(template.getRequirements(), placeholders);
        String benefits = replacePlaceholders(template.getBenefits(), placeholders);
        String location = replacePlaceholders(template.getLocation(), placeholders);
        String employmentType = replacePlaceholders(template.getEmploymentType(), placeholders);
        String contactEmail = replacePlaceholders(template.getContactEmail(), placeholders);

        // Build draft response
        Map<String, Object> draft = new LinkedHashMap<>();
        draft.put("id", UUID.randomUUID().toString());
        draft.put("templateId", String.valueOf(template.getId()));
        draft.put("requisitionId", requisition != null ? requisition.getId() : null);
        draft.put("title", title);
        draft.put("intro", intro);
        draft.put("responsibilities", responsibilities);
        draft.put("requirements", requirements);
        draft.put("benefits", benefits);
        draft.put("location", location);
        draft.put("employmentType", employmentType);
        draft.put("salaryRangeMin", template.getSalaryRangeMin());
        draft.put("salaryRangeMax", template.getSalaryRangeMax());
        draft.put("closingDate", template.getClosingDate());
        draft.put("contactEmail", contactEmail);
        draft.put("status", "draft");
        draft.put("createdBy", requisition != null ? requisition.getCreatedBy() : "system");
        draft.put("createdAt", LocalDateTime.now());
        draft.put("updatedAt", LocalDateTime.now());

        return draft;
    }

    private String replacePlaceholders(String content, Map<String, String> data) {
        if (content == null) return null;
        String result = content;
        for (Map.Entry<String, String> entry : data.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            result = result.replace(placeholder, entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }

    private JobAdTemplate findById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job ad template not found with ID: " + id));
    }
}
