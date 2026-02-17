package com.arthmatic.shumelahire.entity.performance;

public enum EvidenceType {
    DOCUMENT("Document"),
    PRESENTATION("Presentation"),
    REPORT("Report"),
    CERTIFICATE("Certificate"),
    FEEDBACK("Feedback"),
    OTHER("Other");
    
    private final String displayName;
    
    EvidenceType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}