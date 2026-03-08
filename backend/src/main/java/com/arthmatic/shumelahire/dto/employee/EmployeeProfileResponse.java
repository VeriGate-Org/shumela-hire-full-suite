package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeProfileResponse {

    private Long id;
    private String employeeNumber;
    private String title;
    private String firstName;
    private String lastName;
    private String preferredName;
    private String email;
    private String personalEmail;
    private String phone;
    private String mobilePhone;
    private LocalDate dateOfBirth;
    private String gender;
    private String maritalStatus;
    private String nationality;
    private String physicalAddress;
    private String postalAddress;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private String department;
    private String division;
    private String jobTitle;
    private String jobGrade;
    private String employmentType;
    private LocalDate hireDate;
    private String location;
    private String site;
    private String profilePhotoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmployeeProfileResponse() {}

    public static EmployeeProfileResponse fromEntity(Employee entity) {
        EmployeeProfileResponse r = new EmployeeProfileResponse();
        r.id = entity.getId();
        r.employeeNumber = entity.getEmployeeNumber();
        r.title = entity.getTitle();
        r.firstName = entity.getFirstName();
        r.lastName = entity.getLastName();
        r.preferredName = entity.getPreferredName();
        r.email = entity.getEmail();
        r.personalEmail = entity.getPersonalEmail();
        r.phone = entity.getPhone();
        r.mobilePhone = entity.getMobilePhone();
        r.dateOfBirth = entity.getDateOfBirth();
        r.gender = entity.getGender();
        r.maritalStatus = entity.getMaritalStatus();
        r.nationality = entity.getNationality();
        r.physicalAddress = entity.getPhysicalAddress();
        r.postalAddress = entity.getPostalAddress();
        r.city = entity.getCity();
        r.province = entity.getProvince();
        r.postalCode = entity.getPostalCode();
        r.country = entity.getCountry();
        r.department = entity.getDepartment();
        r.division = entity.getDivision();
        r.jobTitle = entity.getJobTitle();
        r.jobGrade = entity.getJobGrade();
        r.employmentType = entity.getEmploymentType();
        r.hireDate = entity.getHireDate();
        r.location = entity.getLocation();
        r.site = entity.getSite();
        r.profilePhotoUrl = entity.getProfilePhotoUrl();
        r.emergencyContactName = entity.getEmergencyContactName();
        r.emergencyContactPhone = entity.getEmergencyContactPhone();
        r.emergencyContactRelationship = entity.getEmergencyContactRelationship();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeNumber() { return employeeNumber; }
    public void setEmployeeNumber(String employeeNumber) { this.employeeNumber = employeeNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPreferredName() { return preferredName; }
    public void setPreferredName(String preferredName) { this.preferredName = preferredName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMobilePhone() { return mobilePhone; }
    public void setMobilePhone(String mobilePhone) { this.mobilePhone = mobilePhone; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getPhysicalAddress() { return physicalAddress; }
    public void setPhysicalAddress(String physicalAddress) { this.physicalAddress = physicalAddress; }

    public String getPostalAddress() { return postalAddress; }
    public void setPostalAddress(String postalAddress) { this.postalAddress = postalAddress; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobGrade() { return jobGrade; }
    public void setJobGrade(String jobGrade) { this.jobGrade = jobGrade; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
