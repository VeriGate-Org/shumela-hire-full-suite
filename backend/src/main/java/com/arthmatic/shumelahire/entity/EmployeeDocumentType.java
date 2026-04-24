package com.arthmatic.shumelahire.entity;

public enum EmployeeDocumentType {
    ID_DOCUMENT("ID Document"),
    PASSPORT("Passport"),
    WORK_PERMIT("Work Permit"),
    TAX_CERTIFICATE("Tax Certificate"),
    QUALIFICATION("Qualification"),
    CONTRACT("Contract"),
    OFFER_LETTER("Offer Letter"),
    DISCIPLINARY("Disciplinary"),
    MEDICAL("Medical"),
    TRAINING_CERTIFICATE("Training Certificate"),
    PERFORMANCE_REVIEW("Performance Review"),
    PROOF_OF_ADDRESS("Proof of Address"),
    BANKING_DETAILS("Banking Details"),
    NDA("NDA"),
    RESIGNATION_LETTER("Resignation Letter"),
    EXIT_INTERVIEW("Exit Interview"),
    CLEARANCE("Clearance"),
    BENEFITS_ENROLLMENT("Benefits Enrollment"),
    OTHER("Other");

    private final String displayName;

    EmployeeDocumentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
