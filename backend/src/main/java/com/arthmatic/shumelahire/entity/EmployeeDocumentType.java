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
    OTHER("Other");

    private final String displayName;

    EmployeeDocumentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
