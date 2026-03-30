package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Offer;
import com.arthmatic.shumelahire.entity.OfferStatus;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@ConditionalOnProperty(name = "esignature.provider", havingValue = "docusign", matchIfMissing = true)
public class DocuSignService implements ESignatureService {

    private static final Logger logger = LoggerFactory.getLogger(DocuSignService.class);

    @Value("${docusign.base-url}")
    private String baseUrl;

    @Value("${docusign.account-id}")
    private String accountId;

    @Value("${docusign.integration-key}")
    private String integrationKey;

    @Value("${docusign.secret-key}")
    private String secretKey;

    @Value("${docusign.user-id}")
    private String userId;

    @Value("${docusign.webhook-hmac-key:}")
    private String webhookHmacKey;

    @Value("${docusign.private-key:}")
    private String privateKeyPem;

    @Value("${docusign.auth-server:https://account-d.docusign.com}")
    private String authServer;

    @Autowired
    private OfferDataRepository offerRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private String cachedAccessToken;
    private Instant tokenExpiresAt;

    @Override
    public String sendForSignature(Offer offer, String signerEmail, String signerName) {
        logger.info("Sending offer {} for e-signature to {}", offer.getOfferNumber(), signerEmail);

        Map<String, Object> envelope = buildEnvelope(offer, signerEmail, signerName);

        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(envelope, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v2.1/accounts/" + accountId + "/envelopes",
                HttpMethod.POST,
                request,
                Map.class
            );

            String envelopeId = (String) response.getBody().get("envelopeId");

            offer.setESignatureEnvelopeId(envelopeId);
            offer.setESignatureStatus("sent");
            offer.setESignatureSentAt(LocalDateTime.now());
            offer.setESignatureProvider("docusign");
            offer.setESignatureSignerEmail(signerEmail);
            offer.setStatus(OfferStatus.AWAITING_SIGNATURE);
            offerRepository.save(offer);

            logger.info("Envelope created: {} for offer {}", envelopeId, offer.getOfferNumber());
            return envelopeId;
        } catch (Exception e) {
            logger.error("Failed to send envelope for offer {}: {}", offer.getOfferNumber(), e.getMessage());
            throw new RuntimeException("Failed to send document for signature", e);
        }
    }

    @Override
    public String getEnvelopeStatus(String envelopeId) {
        HttpHeaders headers = createAuthHeaders();
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v2.1/accounts/" + accountId + "/envelopes/" + envelopeId,
                HttpMethod.GET,
                request,
                Map.class
            );
            return (String) response.getBody().get("status");
        } catch (Exception e) {
            logger.error("Failed to get envelope status for {}: {}", envelopeId, e.getMessage());
            throw new RuntimeException("Failed to get envelope status", e);
        }
    }

    @Override
    public byte[] getSignedDocument(String envelopeId) {
        HttpHeaders headers = createAuthHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_PDF));
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                baseUrl + "/v2.1/accounts/" + accountId + "/envelopes/" + envelopeId + "/documents/combined",
                HttpMethod.GET,
                request,
                byte[].class
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Failed to get signed document for {}: {}", envelopeId, e.getMessage());
            throw new RuntimeException("Failed to retrieve signed document", e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public void handleWebhookEvent(Map<String, Object> event) {
        String eventType = (String) event.get("event");
        Map<String, Object> data = (Map<String, Object>) event.get("data");

        if (data == null) return;

        String envelopeId = (String) data.get("envelopeId");
        if (envelopeId == null) return;

        logger.info("DocuSign webhook: event={}, envelopeId={}", eventType, envelopeId);

        offerRepository.findAll().stream()
            .filter(o -> envelopeId.equals(o.getESignatureEnvelopeId()))
            .findFirst()
            .ifPresent(offer -> {
                if ("envelope-completed".equals(eventType)) {
                    offer.setESignatureStatus("completed");
                    offer.setESignatureCompletedAt(LocalDateTime.now());
                    offer.setStatus(OfferStatus.SIGNED);
                    offerRepository.save(offer);
                    logger.info("Offer {} signed via DocuSign", offer.getOfferNumber());
                } else if ("envelope-declined".equals(eventType)) {
                    offer.setESignatureStatus("declined");
                    offer.setStatus(OfferStatus.DECLINED);
                    offer.setDeclinedAt(LocalDateTime.now());
                    offerRepository.save(offer);
                    logger.info("Offer {} signature declined", offer.getOfferNumber());
                } else if ("envelope-voided".equals(eventType)) {
                    offer.setESignatureStatus("voided");
                    offer.setStatus(OfferStatus.WITHDRAWN);
                    offer.setWithdrawnAt(LocalDateTime.now());
                    offerRepository.save(offer);
                    logger.info("Offer {} envelope voided", offer.getOfferNumber());
                }
            });
    }

    @Override
    public void voidEnvelope(String envelopeId, String reason) {
        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "status", "voided",
            "voidedReason", reason
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(
                baseUrl + "/v2.1/accounts/" + accountId + "/envelopes/" + envelopeId,
                HttpMethod.PUT,
                request,
                Map.class
            );
            logger.info("Envelope {} voided: {}", envelopeId, reason);
        } catch (Exception e) {
            logger.error("Failed to void envelope {}: {}", envelopeId, e.getMessage());
            throw new RuntimeException("Failed to void envelope", e);
        }
    }

    private Map<String, Object> buildEnvelope(Offer offer, String signerEmail, String signerName) {
        String documentContent = buildOfferDocument(offer);

        Map<String, Object> document = new HashMap<>();
        document.put("documentBase64", Base64.getEncoder().encodeToString(documentContent.getBytes()));
        document.put("name", "Offer Letter - " + offer.getOfferNumber());
        document.put("fileExtension", "html");
        document.put("documentId", "1");

        Map<String, Object> signer = new HashMap<>();
        signer.put("email", signerEmail);
        signer.put("name", signerName);
        signer.put("recipientId", "1");
        signer.put("routingOrder", "1");

        Map<String, Object> signHere = new HashMap<>();
        signHere.put("anchorString", "Signature:");
        signHere.put("anchorUnits", "pixels");
        signHere.put("anchorXOffset", "100");
        signHere.put("anchorYOffset", "0");

        Map<String, Object> dateSigned = new HashMap<>();
        dateSigned.put("anchorString", "Date:");
        dateSigned.put("anchorUnits", "pixels");
        dateSigned.put("anchorXOffset", "100");
        dateSigned.put("anchorYOffset", "0");

        signer.put("tabs", Map.of(
            "signHereTabs", List.of(signHere),
            "dateSignedTabs", List.of(dateSigned)
        ));

        Map<String, Object> envelope = new HashMap<>();
        envelope.put("emailSubject", "Offer Letter for " + offer.getJobTitle() + " - " + offer.getOfferNumber());
        envelope.put("documents", List.of(document));
        envelope.put("recipients", Map.of("signers", List.of(signer)));
        envelope.put("status", "sent");

        return envelope;
    }

    private String buildOfferDocument(Offer offer) {
        return "<html><body>" +
            "<h1>Offer of Employment</h1>" +
            "<p>Offer Number: " + offer.getOfferNumber() + "</p>" +
            "<p>Position: " + offer.getJobTitle() + "</p>" +
            "<p>Department: " + offer.getDepartment() + "</p>" +
            "<p>Base Salary: " + offer.getCurrency() + " " + offer.getBaseSalary() + "</p>" +
            "<p>Start Date: " + offer.getStartDate() + "</p>" +
            "<br/><p>Signature: _______________</p>" +
            "<p>Date: _______________</p>" +
            "</body></html>";
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + getAccessToken());
        return headers;
    }

    @SuppressWarnings("unchecked")
    private synchronized String getAccessToken() {
        if (cachedAccessToken != null && tokenExpiresAt != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedAccessToken;
        }

        if (privateKeyPem == null || privateKeyPem.isBlank()) {
            logger.warn("DocuSign private key not configured, using integration key as fallback");
            return integrationKey;
        }

        try {
            PrivateKey rsaKey = loadRsaPrivateKey(privateKeyPem);

            Instant now = Instant.now();
            String jwt = Jwts.builder()
                .setIssuer(integrationKey)
                .setSubject(userId)
                .setAudience(authServer.replaceFirst("^https?://", ""))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(3600)))
                .claim("scope", "signature impersonation")
                .signWith(rsaKey, SignatureAlgorithm.RS256)
                .compact();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
            body.add("assertion", jwt);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                authServer + "/oauth/token",
                HttpMethod.POST,
                request,
                Map.class
            );

            Map<String, Object> tokenResponse = response.getBody();
            cachedAccessToken = (String) tokenResponse.get("access_token");
            int expiresIn = tokenResponse.get("expires_in") instanceof Number
                ? ((Number) tokenResponse.get("expires_in")).intValue()
                : 3600;
            tokenExpiresAt = Instant.now().plusSeconds(expiresIn - 100);

            logger.info("DocuSign JWT Grant token obtained, expires in {}s", expiresIn);
            return cachedAccessToken;
        } catch (Exception e) {
            logger.error("Failed to obtain DocuSign access token via JWT Grant: {}", e.getMessage());
            throw new RuntimeException("Failed to obtain DocuSign access token", e);
        }
    }

    private PrivateKey loadRsaPrivateKey(String pem) throws Exception {
        String cleaned = pem
            .replace("-----BEGIN RSA PRIVATE KEY-----", "")
            .replace("-----END RSA PRIVATE KEY-----", "")
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(cleaned);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(spec);
    }
}
