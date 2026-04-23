package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.DocumentTemplateRequest;
import com.arthmatic.shumelahire.dto.DocumentTemplateResponse;
import com.arthmatic.shumelahire.entity.DocumentTemplate;
import com.arthmatic.shumelahire.repository.DocumentTemplateDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DocumentTemplateService {

    @Autowired
    private DocumentTemplateDataRepository repository;

    @Transactional
    public DocumentTemplateResponse create(DocumentTemplateRequest.Create request) {
        DocumentTemplate template = new DocumentTemplate();
        template.setType(request.getType());
        template.setName(request.getName());
        template.setSubject(request.getSubject());
        template.setContent(request.getContent());
        template.setPlaceholders(request.getPlaceholders());
        template.setCreatedBy(request.getCreatedBy());
        template.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));

        if (template.getIsDefault()) {
            unsetDefaultForType(template.getType());
        }

        template = repository.save(template);
        return DocumentTemplateResponse.fromEntity(template);
    }

    public DocumentTemplateResponse get(String id) {
        return repository.findById(id)
                .map(DocumentTemplateResponse::fromEntity)
                .orElse(null);
    }

    public List<DocumentTemplateResponse> getAll(String search, String type, boolean showArchived) {
        return repository.findWithFilters(search, type, showArchived)
                .stream()
                .map(DocumentTemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentTemplateResponse update(String id, DocumentTemplateRequest.Update request) {
        Optional<DocumentTemplate> optTemplate = repository.findById(id);
        if (optTemplate.isEmpty()) return null;

        DocumentTemplate template = optTemplate.get();
        if (request.getType() != null) template.setType(request.getType());
        if (request.getName() != null) template.setName(request.getName());
        if (request.getSubject() != null) template.setSubject(request.getSubject());
        if (request.getContent() != null) template.setContent(request.getContent());
        if (request.getPlaceholders() != null) template.setPlaceholders(request.getPlaceholders());
        if (request.getIsArchived() != null) template.setIsArchived(request.getIsArchived());

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            unsetDefaultForType(template.getType());
            template.setIsDefault(true);
        } else if (request.getIsDefault() != null) {
            template.setIsDefault(false);
        }

        template = repository.save(template);
        return DocumentTemplateResponse.fromEntity(template);
    }

    @Transactional
    public boolean delete(String id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }

    @Transactional
    public DocumentTemplateResponse duplicate(String id) {
        Optional<DocumentTemplate> optTemplate = repository.findById(id);
        if (optTemplate.isEmpty()) return null;

        DocumentTemplate original = optTemplate.get();
        DocumentTemplate copy = new DocumentTemplate();
        copy.setType(original.getType());
        copy.setName(original.getName() + " (Copy)");
        copy.setSubject(original.getSubject());
        copy.setContent(original.getContent());
        copy.setPlaceholders(original.getPlaceholders());
        copy.setIsDefault(false);
        copy.setCreatedBy(original.getCreatedBy());

        copy = repository.save(copy);
        return DocumentTemplateResponse.fromEntity(copy);
    }

    @Transactional
    public DocumentTemplateResponse archive(String id) {
        Optional<DocumentTemplate> optTemplate = repository.findById(id);
        if (optTemplate.isEmpty()) return null;

        DocumentTemplate template = optTemplate.get();
        template.setIsArchived(true);
        template = repository.save(template);
        return DocumentTemplateResponse.fromEntity(template);
    }

    @Transactional
    public DocumentTemplateResponse setDefault(String id) {
        Optional<DocumentTemplate> optTemplate = repository.findById(id);
        if (optTemplate.isEmpty()) return null;

        DocumentTemplate template = optTemplate.get();
        unsetDefaultForType(template.getType());
        template.setIsDefault(true);
        template = repository.save(template);
        return DocumentTemplateResponse.fromEntity(template);
    }

    public String replacePlaceholders(String content, Map<String, String> data) {
        if (content == null || data == null) return content;
        String result = content;
        Pattern pattern = Pattern.compile("\\{\\{(\\w+)}}");
        Matcher matcher = pattern.matcher(result);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            String replacement = data.getOrDefault(key, matcher.group(0));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    public String previewTemplate(String id, Map<String, String> sampleData) {
        Optional<DocumentTemplate> optTemplate = repository.findById(id);
        if (optTemplate.isEmpty()) return null;
        return replacePlaceholders(optTemplate.get().getContent(), sampleData);
    }

    private void unsetDefaultForType(String type) {
        repository.findDefaultByType(type).ifPresent(existing -> {
            existing.setIsDefault(false);
            repository.save(existing);
        });
    }
}
