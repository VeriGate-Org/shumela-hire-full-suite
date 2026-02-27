package com.arthmatic.shumelahire.entity.converter;

import com.arthmatic.shumelahire.service.DataEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Converter
@Component
public class EncryptedFieldConverter implements AttributeConverter<String, String> {

    private static DataEncryptionService encryptionService;

    @Autowired
    public void setEncryptionService(DataEncryptionService service) {
        EncryptedFieldConverter.encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }
        return encryptionService.encryptPII(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return dbData;
        }
        return encryptionService.decryptPII(dbData);
    }
}
