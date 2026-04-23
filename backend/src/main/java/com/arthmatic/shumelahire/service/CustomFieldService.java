package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.CustomFieldRequest;
import com.arthmatic.shumelahire.dto.employee.CustomFieldResponse;
import com.arthmatic.shumelahire.dto.employee.CustomFieldValueRequest;
import com.arthmatic.shumelahire.entity.CustomField;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.entity.CustomFieldValue;
import com.arthmatic.shumelahire.repository.CustomFieldDataRepository;
import com.arthmatic.shumelahire.repository.CustomFieldValueDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomFieldService {

    private static final Logger logger = LoggerFactory.getLogger(CustomFieldService.class);

    @Autowired
    private CustomFieldDataRepository customFieldRepository;

    @Autowired
    private CustomFieldValueDataRepository customFieldValueRepository;

    public CustomFieldResponse createField(CustomFieldRequest request) {
        logger.info("Creating custom field: {} for {}", request.getFieldName(), request.getEntityType());

        if (customFieldRepository.existsByFieldNameAndEntityType(request.getFieldName(), request.getEntityType())) {
            throw new IllegalArgumentException("Custom field already exists: " + request.getFieldName());
        }

        CustomField field = new CustomField();
        mapRequestToEntity(request, field);

        CustomField saved = customFieldRepository.save(field);
        logger.info("Custom field created: {}", saved.getId());
        return CustomFieldResponse.fromEntity(saved);
    }

    public CustomFieldResponse updateField(String id, CustomFieldRequest request) {
        logger.info("Updating custom field: {}", id);

        CustomField field = customFieldRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Custom field not found: " + id));

        mapRequestToEntity(request, field);

        CustomField saved = customFieldRepository.save(field);
        return CustomFieldResponse.fromEntity(saved);
    }

    public void deleteField(String id) {
        logger.info("Deleting custom field: {}", id);

        CustomField field = customFieldRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Custom field not found: " + id));

        field.setIsActive(false);
        customFieldRepository.save(field);
    }

    @Transactional(readOnly = true)
    public List<CustomFieldResponse> getFieldsByEntityType(CustomFieldEntityType entityType) {
        List<CustomField> fields = customFieldRepository.findByEntityTypeAndActive(entityType);
        return fields.stream()
                .map(CustomFieldResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomFieldResponse> getAllFieldsByEntityType(CustomFieldEntityType entityType) {
        List<CustomField> fields = customFieldRepository.findByEntityType(entityType);
        return fields.stream()
                .map(CustomFieldResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public void setFieldValues(String entityId, CustomFieldEntityType entityType,
                                List<CustomFieldValueRequest> values) {
        logger.info("Setting {} custom field values for {} {}", values.size(), entityType, entityId);

        for (CustomFieldValueRequest valueReq : values) {
            CustomField field = customFieldRepository.findById(valueReq.getCustomFieldId())
                    .orElseThrow(() -> new IllegalArgumentException("Custom field not found: " + valueReq.getCustomFieldId()));

            Optional<CustomFieldValue> existing = customFieldValueRepository
                    .findByCustomFieldIdAndEntityIdAndEntityType(field.getId(), entityId, entityType);

            CustomFieldValue fieldValue;
            if (existing.isPresent()) {
                fieldValue = existing.get();
            } else {
                fieldValue = new CustomFieldValue();
                fieldValue.setCustomField(field);
                fieldValue.setEntityId(entityId);
                fieldValue.setEntityType(entityType);
            }
            fieldValue.setFieldValue(valueReq.getFieldValue());
            customFieldValueRepository.save(fieldValue);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, String> getFieldValues(String entityId, CustomFieldEntityType entityType) {
        List<CustomFieldValue> values = customFieldValueRepository.findByEntityIdAndEntityType(entityId, entityType);
        Map<String, String> result = new HashMap<>();
        for (CustomFieldValue value : values) {
            result.put(value.getCustomField().getFieldName(), value.getFieldValue());
        }
        return result;
    }

    private void mapRequestToEntity(CustomFieldRequest request, CustomField field) {
        field.setFieldName(request.getFieldName());
        field.setFieldLabel(request.getFieldLabel());
        field.setEntityType(request.getEntityType());
        field.setDataType(request.getDataType());
        if (request.getIsRequired() != null) field.setIsRequired(request.getIsRequired());
        if (request.getIsActive() != null) field.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null) field.setDisplayOrder(request.getDisplayOrder());
        field.setOptions(request.getOptions());
        field.setDefaultValue(request.getDefaultValue());
        field.setValidationRegex(request.getValidationRegex());
        field.setHelpText(request.getHelpText());
    }
}
