package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmployeeResponse {

    private String id;
    private String employeeNumber;
    private String title;
    private String firstName;
    private String lastName;
    private String preferredName;
    private String fullName;
    private String displayName;
    private String email;
    private String personalEmail;
    private String phone;
    private String mobilePhone;
    private LocalDate dateOfBirth;
    private String gender;
    private String race;
    private String disabilityStatus;
    private String citizenshipStatus;
    private String nationality;
    private String maritalStatus;
    private String bankName;
    private String bankBranchCode;
    private String physicalAddress;
    private String postalAddress;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private EmployeeStatus status;
    private String department;
    private String division;
    private String jobTitle;
    private String jobGrade;
    private String employmentType;
    private LocalDate hireDate;
    private LocalDate probationEndDate;
    private LocalDate terminationDate;
    private String terminationReason;
    private LocalDate contractEndDate;
    private String reportingManagerId;
    private String reportingManagerName;
    private String costCentre;
    private String location;
    private String site;
    private String applicantId;
    private String profilePhotoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmployeeResponse() {}

    public static EmployeeResponse fromEntity(Employee employee) {
        EmployeeResponse response = new EmployeeResponse();
        response.setId(employee.getId());
        response.setEmployeeNumber(employee.getEmployeeNumber());
        response.setTitle(employee.getTitle());
        response.setFirstName(employee.getFirstName());
        response.setLastName(employee.getLastName());
        response.setPreferredName(employee.getPreferredName());
        response.setFullName(employee.getFullName());
        response.setDisplayName(employee.getDisplayName());
        response.setEmail(employee.getEmail());
        response.setPersonalEmail(employee.getPersonalEmail());
        response.setPhone(employee.getPhone());
        response.setMobilePhone(employee.getMobilePhone());
        response.setDateOfBirth(employee.getDateOfBirth());
        response.setGender(employee.getGender());
        response.setRace(employee.getRace());
        response.setDisabilityStatus(employee.getDisabilityStatus());
        response.setCitizenshipStatus(employee.getCitizenshipStatus());
        response.setNationality(employee.getNationality());
        response.setMaritalStatus(employee.getMaritalStatus());
        response.setBankName(employee.getBankName());
        response.setBankBranchCode(employee.getBankBranchCode());
        response.setPhysicalAddress(employee.getPhysicalAddress());
        response.setPostalAddress(employee.getPostalAddress());
        response.setCity(employee.getCity());
        response.setProvince(employee.getProvince());
        response.setPostalCode(employee.getPostalCode());
        response.setCountry(employee.getCountry());
        response.setStatus(employee.getStatus());
        response.setDepartment(employee.getDepartment());
        response.setDivision(employee.getDivision());
        response.setJobTitle(employee.getJobTitle());
        response.setJobGrade(employee.getJobGrade());
        response.setEmploymentType(employee.getEmploymentType());
        response.setHireDate(employee.getHireDate());
        response.setProbationEndDate(employee.getProbationEndDate());
        response.setTerminationDate(employee.getTerminationDate());
        response.setTerminationReason(employee.getTerminationReason());
        response.setContractEndDate(employee.getContractEndDate());
        response.setCostCentre(employee.getCostCentre());
        response.setLocation(employee.getLocation());
        response.setSite(employee.getSite());
        response.setProfilePhotoUrl(employee.getProfilePhotoUrl());
        response.setEmergencyContactName(employee.getEmergencyContactName());
        response.setEmergencyContactPhone(employee.getEmergencyContactPhone());
        response.setEmergencyContactRelationship(employee.getEmergencyContactRelationship());
        response.setCreatedAt(employee.getCreatedAt());
        response.setUpdatedAt(employee.getUpdatedAt());

        if (employee.getReportingManager() != null) {
            response.setReportingManagerId(employee.getReportingManager().getId());
            response.setReportingManagerName(employee.getReportingManager().getFullName());
        }
        if (employee.getApplicant() != null) {
            response.setApplicantId(employee.getApplicant().getId());
        }

        return response;
    }

    // Directory response - limited fields
    public static EmployeeResponse directoryView(Employee employee) {
        EmployeeResponse response = new EmployeeResponse();
        response.setId(employee.getId());
        response.setEmployeeNumber(employee.getEmployeeNumber());
        response.setFirstName(employee.getFirstName());
        response.setLastName(employee.getLastName());
        response.setFullName(employee.getFullName());
        response.setDisplayName(employee.getDisplayName());
        response.setEmail(employee.getEmail());
        response.setPhone(employee.getPhone());
        response.setDepartment(employee.getDepartment());
        response.setJobTitle(employee.getJobTitle());
        response.setLocation(employee.getLocation());
        response.setProfilePhotoUrl(employee.getProfilePhotoUrl());
        response.setStatus(employee.getStatus());
        return response;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

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

    public String getRace() { return race; }
    public void setRace(String race) { this.race = race; }

    public String getDisabilityStatus() { return disabilityStatus; }
    public void setDisabilityStatus(String disabilityStatus) { this.disabilityStatus = disabilityStatus; }

    public String getCitizenshipStatus() { return citizenshipStatus; }
    public void setCitizenshipStatus(String citizenshipStatus) { this.citizenshipStatus = citizenshipStatus; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getBankBranchCode() { return bankBranchCode; }
    public void setBankBranchCode(String bankBranchCode) { this.bankBranchCode = bankBranchCode; }

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

    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }

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

    public LocalDate getProbationEndDate() { return probationEndDate; }
    public void setProbationEndDate(LocalDate probationEndDate) { this.probationEndDate = probationEndDate; }

    public LocalDate getTerminationDate() { return terminationDate; }
    public void setTerminationDate(LocalDate terminationDate) { this.terminationDate = terminationDate; }

    public String getTerminationReason() { return terminationReason; }
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }

    public LocalDate getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(LocalDate contractEndDate) { this.contractEndDate = contractEndDate; }

    public String getReportingManagerId() { return reportingManagerId; }
    public void setReportingManagerId(String reportingManagerId) { this.reportingManagerId = reportingManagerId; }

    public String getReportingManagerName() { return reportingManagerName; }
    public void setReportingManagerName(String reportingManagerName) { this.reportingManagerName = reportingManagerName; }

    public String getCostCentre() { return costCentre; }
    public void setCostCentre(String costCentre) { this.costCentre = costCentre; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
