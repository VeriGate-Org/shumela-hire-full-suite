package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.VerificationSummaryDTO;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.BackgroundCheck;

import java.util.List;
import java.util.Map;

/**
 * Interface for background check / verification services.
 * Implementations should be provider-specific (e.g. Dots Africa, MIE, etc.)
 */
public interface BackgroundCheckService {

    /**
     * Initiate a background check for a candidate.
     *
     * @param applicationId  the application ID to link the check to
     * @param candidateIdNumber  South African ID number of the candidate
     * @param candidateName  full name of the candidate
     * @param candidateEmail  email address for consent/notification
     * @param checkTypes  list of check type codes (e.g. "CRIMINAL_CHECK", "CREDIT_CHECK")
     * @param consentObtained  whether candidate consent was obtained
     * @param initiatedBy  the user ID initiating the check
     * @return the created BackgroundCheck entity
     */
    BackgroundCheck initiateCheck(String applicationId, String candidateIdNumber,
                                  String candidateName, String candidateEmail,
                                  List<String> checkTypes, boolean consentObtained,
                                  String initiatedBy);

    /**
     * Get the current status of a background check.
     *
     * @param referenceId  the internal reference ID
     * @return the BackgroundCheck entity with current status
     */
    BackgroundCheck getCheckStatus(String referenceId);

    /**
     * Get the results of a completed background check.
     *
     * @param referenceId  the internal reference ID
     * @return the BackgroundCheck entity with results
     */
    BackgroundCheck getCheckResults(String referenceId);

    /**
     * Download the verification report PDF.
     *
     * @param referenceId  the internal reference ID
     * @return the report PDF bytes
     */
    byte[] downloadReport(String referenceId);

    /**
     * Handle an incoming webhook event from the verification provider.
     *
     * @param event  the webhook payload
     */
    void handleWebhookEvent(Map<String, Object> event);

    /**
     * Cancel a pending background check.
     *
     * @param referenceId  the internal reference ID
     * @param reason  the cancellation reason
     * @return the updated BackgroundCheck entity
     */
    BackgroundCheck cancelCheck(String referenceId, String reason);

    /**
     * Get the list of available check types from the provider.
     *
     * @return list of check type maps with code, name, description, turnaround, price
     */
    List<Map<String, Object>> getAvailableCheckTypes();

    /**
     * Get verification summaries for multiple applications in batch.
     *
     * @param applicationIds list of application IDs
     * @return map of application ID to verification summary
     */
    Map<String, VerificationSummaryDTO> getVerificationSummaries(List<String> applicationIds);

    /**
     * Enforce that all required background checks are completed with CLEAR result
     * before allowing progression past the BACKGROUND_CHECK stage.
     *
     * @param application the application to check
     * @throws IllegalStateException if required checks are not completed/clear
     */
    void enforceBackgroundCheckCompletion(Application application);
}
