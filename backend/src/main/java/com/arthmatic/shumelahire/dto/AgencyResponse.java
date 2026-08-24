package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.entity.AgencySubmission;
import com.arthmatic.shumelahire.entity.AgencySubmissionStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A recruitment agency on the panel, with the two things the panel is judged on.
 *
 * <p><b>Contract state is computed against today.</b> {@code contractEndDate} is stored, editable,
 * and compared to the current date nowhere in the codebase — front end or back. It is assigned in
 * exactly one place, {@code AgencyPortalService.updateAgency}, and read back out again. So an agency
 * whose contract ended seventy days ago sits on the panel submitting candidates, and nothing says
 * so. <b>A placement made under a lapsed contract has no agreed fee</b>, which makes this a
 * commercial exposure rather than a tidiness problem.
 *
 * <p><b>Placement rate is on the row.</b> The figure is real — {@code AgencyPortalService} counts
 * accepted over total against the repository — but it lived in
 * {@code getAgencyDashboard(agencyId)}, one call per agency, so a nine-row panel was nine calls and
 * the list showed none of it. An agency at 9% across twenty-two submissions on the highest fee on
 * the panel is the clearest possible signal and it took two clicks to find.
 *
 * <p>Deliberately not here: <b>what a placement cost in rands</b>. That needs
 * {@code feePercentage} against the placed candidate's offer salary. Both exist, in different
 * aggregates, with no join between them. The percentage is honest; a rand total would be invented.
 */
public class AgencyResponse {

    /**
     * How close to expiry a contract must be before the panel is warned.
     *
     * <p>Sixty days. Long enough to run a renewal through procurement, which is the decision the
     * warning exists to trigger.
     */
    public static final int EXPIRY_WARNING_DAYS = 60;

    /**
     * What state this agency's relationship is in.
     *
     * <p>Note there is no {@code EXPIRED} in {@link AgencyStatus} — its values are
     * {@code PENDING_APPROVAL}, {@code APPROVED}, {@code SUSPENDED} and {@code TERMINATED}. A lapsed
     * contract is therefore an {@code APPROVED} agency with a past {@code contractEndDate}, and
     * lapse has to be derived. Whether an agency should be suspended automatically at expiry is a
     * policy decision, not a display one.
     */
    public enum ContractState {
        /** Approved, and the contract end date has passed. Still able to submit. */
        LAPSED,
        /** Approved, ending within {@link #EXPIRY_WARNING_DAYS}. A renewal decision is due. */
        EXPIRING_SOON,
        /** Approved, with an end date still ahead. */
        IN_CONTRACT,
        /**
         * Approved with no end date at all.
         *
         * <p>{@code contractEndDate} is optional, so an agency can sit on the panel indefinitely and
         * never appear in any expiry check. A real state, and reported as itself rather than folded
         * into {@code IN_CONTRACT} — whether it should be allowed is worth deciding.
         */
        NO_END_DATE,
        /** Blocked from submitting. */
        SUSPENDED,
        /** Never approved. */
        PENDING_APPROVAL,
        /** Relationship ended deliberately. */
        TERMINATED
    }

    private String id;
    private String agencyName;
    private String registrationNumber;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private String specializations;
    private AgencyStatus status;
    private BigDecimal feePercentage;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private Integer beeLevel;

    private ContractState contractState;

    /** Days until the contract ends, or null when it has passed or there is no end date. */
    private Long daysUntilExpiry;

    /** Days since the contract ended, or null when it has not. */
    private Long daysSinceLapse;

    /** Submissions received, ever. */
    private long totalSubmissions;

    /** Submissions accepted. */
    private long acceptedSubmissions;

    /**
     * Accepted over total, as a percentage, or <b>null when nothing has ever been submitted</b>.
     *
     * <p>The dashboard returned {@code 0} in that case. An agency that has submitted nothing has no
     * placement rate; reporting 0% ranks a brand-new agency alongside one that has sent twenty-two
     * candidates and placed two, which is the opposite of the truth.
     */
    private Double placementRate;

    /**
     * Submissions that arrived after the contract ended.
     *
     * <p>The exposure, stated in the unit that matters: not "this contract lapsed" but "eleven
     * candidates have been put forward since it did". Null when the contract has not lapsed.
     */
    private Long submissionsSinceLapse;

    /** Submissions still at {@code SUBMITTED} or {@code UNDER_REVIEW}. Work owed by us, not them. */
    private long awaitingReview;

    /**
     * Median days from submission to review, or null when nothing has been submitted.
     *
     * <p><b>Submissions not yet reviewed are included, at how long they have been waiting so far.</b>
     * Excluding them would mean an agency whose candidates are never looked at reports the fastest
     * review time on the panel — the median would describe only the ones somebody got round to. For
     * those rows the contribution is a lower bound, which is why {@link #awaitingReview} sits beside
     * it rather than being folded in.
     *
     * <p>This is a number about us, not about the panel, and it is the first thing an agency raises.
     */
    private Long medianReviewDays;

    /** How long the oldest unreviewed submission has been waiting, or null if none are open. */
    private Long oldestAwaitingDays;

    public static AgencyResponse from(AgencyProfile agency, List<AgencySubmission> submissions,
                                      LocalDate today) {
        AgencyResponse response = new AgencyResponse();
        response.id = agency.getId();
        response.agencyName = agency.getAgencyName();
        response.registrationNumber = agency.getRegistrationNumber();
        response.contactPerson = agency.getContactPerson();
        response.contactEmail = agency.getContactEmail();
        response.contactPhone = agency.getContactPhone();
        response.specializations = agency.getSpecializations();
        response.status = agency.getStatus();
        response.feePercentage = agency.getFeePercentage();
        response.contractStartDate = agency.getContractStartDate();
        response.contractEndDate = agency.getContractEndDate();
        response.beeLevel = agency.getBeeLevel();

        response.contractState = contractStateOf(agency, today);

        LocalDate endDate = agency.getContractEndDate();
        if (endDate != null) {
            long days = today.toEpochDay() - endDate.toEpochDay();
            if (days > 0) {
                response.daysSinceLapse = days;
            } else {
                response.daysUntilExpiry = -days;
            }
        }

        if (submissions == null || submissions.isEmpty()) {
            return response;
        }

        List<Long> reviewDays = new ArrayList<>();
        LocalDateTime now = today.atStartOfDay();
        long sinceLapse = 0;

        for (AgencySubmission submission : submissions) {
            response.totalSubmissions++;

            AgencySubmissionStatus status = submission.getStatus();
            if (status == AgencySubmissionStatus.ACCEPTED) {
                response.acceptedSubmissions++;
            }
            if (status == AgencySubmissionStatus.SUBMITTED
                    || status == AgencySubmissionStatus.UNDER_REVIEW) {
                response.awaitingReview++;
            }

            LocalDateTime submittedAt = submission.getSubmittedAt();
            if (submittedAt == null) {
                // No timestamp, so it can say nothing about how long a review took. Still counted
                // as a submission, because it happened.
                continue;
            }

            if (endDate != null && submittedAt.toLocalDate().isAfter(endDate)) {
                sinceLapse++;
            }

            LocalDateTime reviewedAt = submission.getReviewedAt();
            if (reviewedAt != null) {
                reviewDays.add(Math.max(0, Duration.between(submittedAt, reviewedAt).toDays()));
            } else if (status == AgencySubmissionStatus.SUBMITTED
                    || status == AgencySubmissionStatus.UNDER_REVIEW) {
                // Still open. Counted at how long it has waited so far — see the field comment.
                long waiting = Math.max(0, Duration.between(submittedAt, now).toDays());
                reviewDays.add(waiting);
                if (response.oldestAwaitingDays == null || waiting > response.oldestAwaitingDays) {
                    response.oldestAwaitingDays = waiting;
                }
            }
        }

        if (response.daysSinceLapse != null) {
            response.submissionsSinceLapse = sinceLapse;
        }

        if (response.totalSubmissions > 0) {
            response.placementRate =
                    (double) response.acceptedSubmissions / response.totalSubmissions * 100;
        }

        if (!reviewDays.isEmpty()) {
            List<Long> sorted = reviewDays.stream().sorted().toList();
            // Lower of the two central values on an even count — the convention used by every other
            // median in this codebase.
            response.medianReviewDays = sorted.get((sorted.size() - 1) / 2);
        }

        return response;
    }

    /**
     * What state this agency is in, today.
     *
     * <p>Only an {@code APPROVED} agency can be in or out of contract. A suspended agency is blocked
     * whatever its dates say, and a pending one was never on the panel — reporting either as
     * "lapsed" would bury the reason they cannot submit.
     */
    public static ContractState contractStateOf(AgencyProfile agency, LocalDate today) {
        AgencyStatus status = agency.getStatus();

        if (status == AgencyStatus.SUSPENDED) return ContractState.SUSPENDED;
        if (status == AgencyStatus.TERMINATED) return ContractState.TERMINATED;
        if (status != AgencyStatus.APPROVED) return ContractState.PENDING_APPROVAL;

        LocalDate endDate = agency.getContractEndDate();
        if (endDate == null) return ContractState.NO_END_DATE;
        if (endDate.isBefore(today)) return ContractState.LAPSED;
        if (endDate.toEpochDay() - today.toEpochDay() <= EXPIRY_WARNING_DAYS) {
            return ContractState.EXPIRING_SOON;
        }
        return ContractState.IN_CONTRACT;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }

    public AgencyStatus getStatus() { return status; }
    public void setStatus(AgencyStatus status) { this.status = status; }

    public BigDecimal getFeePercentage() { return feePercentage; }
    public void setFeePercentage(BigDecimal feePercentage) { this.feePercentage = feePercentage; }

    public LocalDate getContractStartDate() { return contractStartDate; }
    public void setContractStartDate(LocalDate contractStartDate) { this.contractStartDate = contractStartDate; }

    public LocalDate getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(LocalDate contractEndDate) { this.contractEndDate = contractEndDate; }

    public Integer getBeeLevel() { return beeLevel; }
    public void setBeeLevel(Integer beeLevel) { this.beeLevel = beeLevel; }

    public ContractState getContractState() { return contractState; }
    public void setContractState(ContractState contractState) { this.contractState = contractState; }

    public Long getDaysUntilExpiry() { return daysUntilExpiry; }
    public void setDaysUntilExpiry(Long daysUntilExpiry) { this.daysUntilExpiry = daysUntilExpiry; }

    public Long getDaysSinceLapse() { return daysSinceLapse; }
    public void setDaysSinceLapse(Long daysSinceLapse) { this.daysSinceLapse = daysSinceLapse; }

    public long getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(long totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public long getAcceptedSubmissions() { return acceptedSubmissions; }
    public void setAcceptedSubmissions(long acceptedSubmissions) { this.acceptedSubmissions = acceptedSubmissions; }

    public Double getPlacementRate() { return placementRate; }
    public void setPlacementRate(Double placementRate) { this.placementRate = placementRate; }

    public Long getSubmissionsSinceLapse() { return submissionsSinceLapse; }
    public void setSubmissionsSinceLapse(Long submissionsSinceLapse) { this.submissionsSinceLapse = submissionsSinceLapse; }

    public long getAwaitingReview() { return awaitingReview; }
    public void setAwaitingReview(long awaitingReview) { this.awaitingReview = awaitingReview; }

    public Long getMedianReviewDays() { return medianReviewDays; }
    public void setMedianReviewDays(Long medianReviewDays) { this.medianReviewDays = medianReviewDays; }

    public Long getOldestAwaitingDays() { return oldestAwaitingDays; }
    public void setOldestAwaitingDays(Long oldestAwaitingDays) { this.oldestAwaitingDays = oldestAwaitingDays; }
}
