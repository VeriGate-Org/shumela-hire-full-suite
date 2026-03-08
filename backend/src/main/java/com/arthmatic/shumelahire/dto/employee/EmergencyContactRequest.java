package com.arthmatic.shumelahire.dto.employee;

public class EmergencyContactRequest {

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    public EmergencyContactRequest() {}

    // Getters and Setters
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }
}
