package com.arthmatic.shumelahire.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Data encryption service using AES-256-GCM for sensitive information
 */
@Service
public class DataEncryptionService {

    private static final Logger logger = LoggerFactory.getLogger(DataEncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String INSECURE_DEFAULT_KEY = "dGhpcyBpcyBhIGRlZmF1bHQgZW5jcnlwdGlvbiBrZXkgZm9yIGRldmVsb3BtZW50";

    @Value("${encryption.key}")
    private String encryptionKey;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    @PostConstruct
    public void validateKey() {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            throw new IllegalStateException("encryption.key must be set via ENCRYPTION_KEY environment variable");
        }
        if (INSECURE_DEFAULT_KEY.equals(encryptionKey)) {
            if (!"dev".equals(activeProfile) && !"test".equals(activeProfile)) {
                throw new IllegalStateException("encryption.key must not use the insecure default value — generate a new key");
            }
            logger.warn("Using insecure default encryption key — acceptable for dev/test only");
        }
        try {
            byte[] keyBytes = Base64.getDecoder().decode(encryptionKey);
            if (keyBytes.length < 16) {
                throw new IllegalStateException("encryption.key must be at least 128 bits (16 bytes)");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("encryption.key is not valid Base64 — set ENCRYPTION_KEY to a Base64-encoded AES key", e);
        }
    }

    /**
     * Encrypt sensitive data using AES-256-GCM.
     * Output format: Base64(IV || ciphertext+tag)
     */
    public String encrypt(String plainText) {
        try {
            SecretKey secretKey = getSecretKey();
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + cipherText.length);
            buffer.put(iv);
            buffer.put(cipherText);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            logger.error("Encryption failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Decrypt data encrypted with AES-256-GCM.
     * Expects Base64(IV || ciphertext+tag)
     */
    public String decrypt(String encryptedText) {
        try {
            SecretKey secretKey = getSecretKey();
            byte[] decoded = Base64.getDecoder().decode(encryptedText);

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] decryptedBytes = cipher.doFinal(cipherText);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Decryption failed: {}", e.getMessage());
            return null;
        }
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.getDecoder().decode(encryptionKey);
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    public String generateNewKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(256);
            SecretKey secretKey = keyGen.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            logger.error("Key generation failed: {}", e.getMessage());
            return null;
        }
    }

    public String hashData(String data) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashedBytes);
        } catch (Exception e) {
            logger.error("Hashing failed: {}", e.getMessage());
            return null;
        }
    }

    public String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[32];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    public String hashWithSalt(String data, String salt) {
        return hashData(data + salt);
    }

    public String encryptPII(String piiData) {
        if (piiData == null || piiData.trim().isEmpty()) {
            return piiData;
        }
        String encrypted = encrypt(piiData);
        logger.debug("PII data encrypted successfully");
        return encrypted;
    }

    public String decryptPII(String encryptedPII) {
        if (encryptedPII == null || encryptedPII.trim().isEmpty()) {
            return encryptedPII;
        }
        String decrypted = decrypt(encryptedPII);
        logger.debug("PII data decrypted successfully");
        return decrypted;
    }

    public String maskSensitiveData(String data) {
        if (data == null || data.length() <= 4) {
            return "****";
        }
        if (data.contains("@")) {
            String[] parts = data.split("@");
            if (parts.length == 2) {
                String username = parts[0];
                String domain = parts[1];
                String maskedUsername = username.length() > 2
                    ? username.substring(0, 2) + "***"
                    : "***";
                return maskedUsername + "@" + domain;
            }
        }
        if (data.length() > 4) {
            return data.substring(0, 2) + "***" + data.substring(data.length() - 2);
        }
        return "****";
    }

    public String sanitizeData(String data) {
        if (data == null) return null;
        return data
                .replaceAll("<script[^>]*>.*?</script>", "")
                .replaceAll("<[^>]+>", "")
                .replaceAll("[\\r\\n\\t]+", " ")
                .trim();
    }
}
