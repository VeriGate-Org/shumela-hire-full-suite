package com.arthmatic.shumelahire.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ApplicantCreateRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Surname is required")
    private String surname;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;
    
    private String phone;
    
    private String idPassportNumber;
    
    private String address;
    
    private String education; // JSON string
    
    private String experience; // JSON string
    
    private String skills; // JSON string

    private String gender;
    private String race;
    private String disabilityStatus;
    private String citizenshipStatus;
    private Boolean demographicsConsent;

    // Constructors
    public ApplicantCreateRequest() {}
    
    // Getters and Setters
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
}