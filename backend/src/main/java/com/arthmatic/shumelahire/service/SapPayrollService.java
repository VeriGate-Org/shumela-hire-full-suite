package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.SapPayrollTransmission;

import java.util.List;
import java.util.Map;

/**
 * Interface for SAP Payroll integration — transmits new hire data
 * from accepted offers to SAP SuccessFactors / SAP HCM for employee
 * master record creation and payroll onboarding.
 */
public interface SapPayrollService {

    /**
     * Build and transmit new hire data for an accepted offer to SAP.
     * Maps Offer + Application + Applicant data to SAP employee payload.
     *
     * @param offerId     the accepted offer ID
     * @param initiatedBy the user ID who triggered the transmission
     * @return the created SapPayrollTransmission record
     */
    SapPayrollTransmission sendNewHireData(String offerId, String initiatedBy);

    /**
     * Poll SAP for the current status of a transmission.
     * Updates the local record if SAP returns a confirmation or error.
     *
     * @param transmissionId the unique transmission reference
     * @return the updated transmission record
     */
    SapPayrollTransmission getTransmissionStatus(String transmissionId);

    /**
     * Validate employee data against SAP schema before transmission.
     * Returns a map of field names to validation error messages.
     *
     * @param offerId the offer ID to validate
     * @return map of validation errors (empty if valid)
     */
    Map<String, String> validateEmployeeData(String offerId);

    /**
     * Retry a previously failed transmission.
     *
     * @param transmissionId the transmission reference to retry
     * @param userId         the user ID retrying
     * @return the updated transmission record
     */
    SapPayrollTransmission retryFailedTransmission(String transmissionId, String userId);

    /**
     * Get all transmissions in pending/retry state.
     *
     * @return list of pending transmissions
     */
    List<SapPayrollTransmission> getPendingTransmissions();

    /**
     * Cancel a pending or failed transmission.
     *
     * @param transmissionId the transmission reference to cancel
     * @param reason         cancellation reason
     * @param userId         user who cancelled
     * @return the updated transmission record
     */
    SapPayrollTransmission cancelTransmission(String transmissionId, String reason, String userId);
}
