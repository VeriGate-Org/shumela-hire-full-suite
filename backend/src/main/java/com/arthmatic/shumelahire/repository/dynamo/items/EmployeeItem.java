package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Employee entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  EMPLOYEE#{id}
 *
 * GSI1 (status queries, sorted by last name):
 *   GSI1PK: EMP_STATUS#{tenantId}#{status}
 *   GSI1SK: EMPLOYEE#{lastName}#{firstName}
 *
 * GSI2 (FK lookup — employee by email):
 *   GSI2PK: EMP_EMAIL#{tenantId}#{email}
 *   GSI2SK: EMPLOYEE#{id}
 *
 * GSI3 (department queries):
 *   GSI3PK: EMP_DEPT#{tenantId}#{department}
 *   GSI3SK: EMPLOYEE#{lastName}#{firstName}
 *
 * GSI4 (unique constraint — employee number per tenant):
 *   GSI4PK: EMP_NUM#{tenantId}#{employeeNumber}
 *   GSI4SK: EMPLOYEE#{id}
 *
 * GSI5 (manager lookup — direct reports):
 *   GSI5PK: EMP_MGR#{tenantId}#{reportingManagerId}
 *   GSI5SK: EMPLOYEE#{lastName}#{firstName}
 *
 * GSI6 (date range — hire date):
 *   GSI6PK: EMP_HIRE#{tenantId}
 *   GSI6SK: #{hireDate}#{id}
 */
@DynamoDbBean
public class EmployeeItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi3pk;
    private String gsi3sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi5pk;
    private String gsi5sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String employeeNumber;
    private String title;
    private String firstName;
    private String lastName;
    private String preferredName;
    private String email;
    private String personalEmail;
    private String phone;
    private String mobilePhone;
    private String dateOfBirth;
    private String gender;
    private String race;
    private String disabilityStatus;
    private String citizenshipStatus;
    private String nationality;
    private String maritalStatus;
    private String idNumber;
    private String taxNumber;
    private String bankAccountNumber;
    private String bankName;
    private String bankBranchCode;
    private String physicalAddress;
    private String postalAddress;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private String status;
    private String department;
    private String division;
    private String jobTitle;
    private String jobGrade;
    private String employmentType;
    private String hireDate;
    private String probationEndDate;
    private String terminationDate;
    private String terminationReason;
    private String contractEndDate;
    private String reportingManagerId;
    private String costCentre;
    private String location;
    private String site;
    private String applicantId;
    private String profilePhotoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    private Boolean demographicsConsent;
    private String demographicsConsentDate;
    private String createdAt;
    private String updatedAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status queries, sorted by last name ────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: Email lookup ───────────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI3: Department queries ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

    // ── GSI4: Unique constraint on employee number ───────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI5: Manager lookup (direct reports) ────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5PK")
    public String getGsi5pk() { return gsi5pk; }
    public void setGsi5pk(String gsi5pk) { this.gsi5pk = gsi5pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5SK")
    public String getGsi5sk() { return gsi5sk; }
    public void setGsi5sk(String gsi5sk) { this.gsi5sk = gsi5sk; }

    // ── GSI6: Date range — hire date ─────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

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

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

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

    public String getIdNumber() { return idNumber; }
    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }

    public String getTaxNumber() { return taxNumber; }
    public void setTaxNumber(String taxNumber) { this.taxNumber = taxNumber; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public String getHireDate() { return hireDate; }
    public void setHireDate(String hireDate) { this.hireDate = hireDate; }

    public String getProbationEndDate() { return probationEndDate; }
    public void setProbationEndDate(String probationEndDate) { this.probationEndDate = probationEndDate; }

    public String getTerminationDate() { return terminationDate; }
    public void setTerminationDate(String terminationDate) { this.terminationDate = terminationDate; }

    public String getTerminationReason() { return terminationReason; }
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }

    public String getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(String contractEndDate) { this.contractEndDate = contractEndDate; }

    public String getReportingManagerId() { return reportingManagerId; }
    public void setReportingManagerId(String reportingManagerId) { this.reportingManagerId = reportingManagerId; }

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

    public Boolean getDemographicsConsent() { return demographicsConsent; }
    public void setDemographicsConsent(Boolean demographicsConsent) { this.demographicsConsent = demographicsConsent; }

    public String getDemographicsConsentDate() { return demographicsConsentDate; }
    public void setDemographicsConsentDate(String demographicsConsentDate) { this.demographicsConsentDate = demographicsConsentDate; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
