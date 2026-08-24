package com.arthmatic.shumelahire.dto;

import java.util.List;

/**
 * The verification a requisition demands before a candidate may progress past Background Check.
 *
 * <p>Deliberately its own request rather than a slice of {@link JobPostingCreateRequest}: those
 * fields are settable only while a posting is a draft, because {@code JobPosting.canBeEdited()}
 * closes the whole record once it is approved — which is right for a title, a salary band or an
 * advertised description, and wrong for this. Verification requirements are a control on how the
 * vacancy is *run*, and the need to add one ("this role handles money — credit-check it") arrives
 * after approval far more often than before it.</p>
 */
public class VerificationRequirementsRequest {

    /** When true, the pipeline refuses to progress a candidate until every required check is CLEAR. */
    private Boolean enforceCheckCompletion;

    /** Check-type codes from the provider catalogue, e.g. CRIMINAL_CHECK, QUALIFICATION_VERIFICATION. */
    private List<String> requiredCheckTypes;

    public VerificationRequirementsRequest() {
    }

    public VerificationRequirementsRequest(Boolean enforceCheckCompletion, List<String> requiredCheckTypes) {
        this.enforceCheckCompletion = enforceCheckCompletion;
        this.requiredCheckTypes = requiredCheckTypes;
    }

    public Boolean getEnforceCheckCompletion() {
        return enforceCheckCompletion;
    }

    public void setEnforceCheckCompletion(Boolean enforceCheckCompletion) {
        this.enforceCheckCompletion = enforceCheckCompletion;
    }

    public List<String> getRequiredCheckTypes() {
        return requiredCheckTypes;
    }

    public void setRequiredCheckTypes(List<String> requiredCheckTypes) {
        this.requiredCheckTypes = requiredCheckTypes;
    }
}
