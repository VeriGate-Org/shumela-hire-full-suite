package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ReportTemplateResponse;
import com.arthmatic.shumelahire.entity.ReportTemplate;
import com.arthmatic.shumelahire.repository.ReportTemplateDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ReportTemplateService {

    private static final Logger log = LoggerFactory.getLogger(ReportTemplateService.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    private final ReportTemplateDataRepository repository;

    public ReportTemplateService(ReportTemplateDataRepository repository) {
        this.repository = repository;
    }

    public List<ReportTemplateResponse> getReportsForUser(String userEmail) {
        return repository.findBySharedTrueOrCreatedByOrderByUpdatedAtDesc(userEmail)
                .stream()
                .map(ReportTemplateResponse::new)
                .toList();
    }

    public ReportTemplateResponse getReport(String id) {
        return repository.findById(id)
                .map(ReportTemplateResponse::new)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));
    }

    @Transactional
    public ReportTemplateResponse createReport(Map<String, Object> config, String createdBy) {
        ReportTemplate template = new ReportTemplate();
        mapConfigToEntity(template, config);
        template.setCreatedBy(createdBy);
        ReportTemplate saved = repository.save(template);
        log.info("Created report template: {} (id: {})", saved.getName(), saved.getId());
        return new ReportTemplateResponse(saved);
    }

    @Transactional
    public ReportTemplateResponse updateReport(String id, Map<String, Object> config) {
        ReportTemplate template = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));
        mapConfigToEntity(template, config);
        ReportTemplate saved = repository.save(template);
        return new ReportTemplateResponse(saved);
    }

    @Transactional
    public void deleteReport(String id) {
        ReportTemplate template = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));
        if (template.isSystem()) {
            throw new IllegalStateException("Cannot delete system report templates");
        }
        repository.delete(template);
        log.info("Deleted report template: {} (id: {})", template.getName(), id);
    }

    @Transactional
    public ReportTemplateResponse incrementRunCount(String id) {
        ReportTemplate template = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));
        template.setRunCount(template.getRunCount() + 1);
        template.setLastRun(LocalDateTime.now());
        return new ReportTemplateResponse(repository.save(template));
    }

    @Transactional
    public ReportTemplateResponse duplicateReport(String id, String createdBy) {
        ReportTemplate original = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));

        ReportTemplate copy = new ReportTemplate();
        copy.setName(original.getName() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setCreatedBy(createdBy);
        copy.setFieldsJson(original.getFieldsJson());
        copy.setFiltersJson(original.getFiltersJson());
        copy.setVisualizationJson(original.getVisualizationJson());
        copy.setScheduleJson(original.getScheduleJson());
        copy.setDateRangeJson(original.getDateRangeJson());
        copy.setTagsJson(original.getTagsJson());
        copy.setSystem(false);

        ReportTemplate saved = repository.save(copy);
        return new ReportTemplateResponse(saved);
    }

    @Transactional
    public ReportTemplateResponse shareReport(String id) {
        ReportTemplate template = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report template not found: " + id));
        template.setShared(true);
        return new ReportTemplateResponse(repository.save(template));
    }

    private void mapConfigToEntity(ReportTemplate template, Map<String, Object> config) {
        template.setName((String) config.getOrDefault("name", "Untitled Report"));
        template.setDescription((String) config.get("description"));

        template.setFieldsJson(toJson(config.get("fields")));
        template.setFiltersJson(toJson(config.get("filters")));
        template.setVisualizationJson(toJson(config.get("visualization")));
        template.setScheduleJson(toJson(config.get("schedule")));
        template.setDateRangeJson(toJson(config.get("dateRange")));
        template.setTagsJson(toJson(config.get("tags")));

        if (config.containsKey("isShared")) {
            template.setShared(Boolean.TRUE.equals(config.get("isShared")));
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
