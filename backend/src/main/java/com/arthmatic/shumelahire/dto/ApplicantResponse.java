package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Applicant;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ApplicantResponse {
    
    private String id;
    private String name;
    private String surname;
    private String email;
    private String phone;
    private String idPassportNumber;
    private String address;
    private String education;
    private String experience;
    private String skills;
    private String gender;
    private String race;
    private String disabilityStatus;
    private String citizenshipStatus;
    private Boolean demographicsConsent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentResponse> documents;
    
    // Constructors
    public ApplicantResponse() {}
    
    public ApplicantResponse(Applicant applicant) {
        this.id = applicant.getId();
        this.name = applicant.getName();
        this.surname = applicant.getSurname();
        this.email = applicant.getEmail();
        this.phone = applicant.getPhone();
        this.idPassportNumber = maskIdNumber(applicant.getIdPassportNumber());
        this.address = applicant.getAddress();
        this.education = applicant.getEducation();
        this.experience = applicant.getExperience();
        this.skills = applicant.getSkills();
        this.gender = applicant.getGender();
        this.race = applicant.getRace();
        this.disabilityStatus = applicant.getDisabilityStatus();
        this.citizenshipStatus = applicant.getCitizenshipStatus();
        this.demographicsConsent = applicant.getDemographicsConsent();
        this.createdAt = applicant.getCreatedAt();
        this.updatedAt = applicant.getUpdatedAt();
        
        if (applicant.getDocuments() != null) {
            this.documents = applicant.getDocuments().stream()
                    .map(DocumentResponse::new)
                    .collect(Collectors.toList());
        }
    }
    
    // Static factory method
    public static ApplicantResponse fromEntity(Applicant applicant) {
        return new ApplicantResponse(applicant);
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSurname() {
        return surname;
    }
    
    public void setSurname(String surname) {
        this.surname = surname;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getIdPassportNumber() {
        return idPassportNumber;
    }
    
    public void setIdPassportNumber(String idPassportNumber) {
        this.idPassportNumber = idPassportNumber;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getEducation() {
        return education;
    }
    
    public void setEducation(String education) {
        this.education = education;
    }
    
    public String getExperience() {
        return experience;
    }
    
    public void setExperience(String experience) {
        this.experience = experience;
    }
    
    public String getSkills() {
        return skills;
    }
    
    public void setSkills(String skills) {
        this.skills = skills;
    }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getRace() { return race; }
    public void setRace(String race) { this.race = race; }

    public String getDisabilityStatus() { return disabilityStatus; }
    public void setDisabilityStatus(String disabilityStatus) { this.disabilityStatus = disabilityStatus; }

    public String getCitizenshipStatus() { return citizenshipStatus; }
    public void setCitizenshipStatus(String citizenshipStatus) { this.citizenshipStatus = citizenshipStatus; }

    public Boolean getDemographicsConsent() { return demographicsConsent; }
    public void setDemographicsConsent(Boolean demographicsConsent) { this.demographicsConsent = demographicsConsent; }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<DocumentResponse> getDocuments() {
        return documents;
    }
    
    public void setDocuments(List<DocumentResponse> documents) {
        this.documents = documents;
    }
    
    // Helper methods
    public String getFullName() {
        return name + " " + surname;
    }

    private static String maskIdNumber(String idNumber) {
        if (idNumber == null || idNumber.length() <= 4) {
            return idNumber;
        }
        return "*".repeat(idNumber.length() - 4) + idNumber.substring(idNumber.length() - 4);
    }
}