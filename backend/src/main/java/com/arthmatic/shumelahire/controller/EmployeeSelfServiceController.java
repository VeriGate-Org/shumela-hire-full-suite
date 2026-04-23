package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.employee.*;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeDocument;
import com.arthmatic.shumelahire.entity.EmployeeDocumentTypeConfig;
import com.arthmatic.shumelahire.entity.employee.EmployeeSkill;
import com.arthmatic.shumelahire.entity.employee.EmployeeEducation;
import com.arthmatic.shumelahire.repository.EmployeeDocumentDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDocumentTypeConfigDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeSkillDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeEducationDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee")
@FeatureGate("EMPLOYEE_SELF_SERVICE")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class EmployeeSelfServiceController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeSelfServiceController.class);

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private EmployeeDocumentDataRepository documentRepository;

    @Autowired
    private EmployeeDocumentTypeConfigDataRepository documentTypeConfigRepository;

    @Autowired
    private EmployeeSkillDataRepository skillRepository;

    @Autowired
    private EmployeeEducationDataRepository educationRepository;

    @Autowired
    private AuditLogService auditLogService;

    // ---- Profile ----

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestParam String employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
            return ResponseEntity.ok(EmployeeProfileResponse.fromEntity(employee));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestParam String employeeId,
                                           @RequestBody EmployeeProfileUpdateRequest request) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

            if (request.getPersonalEmail() != null) employee.setPersonalEmail(request.getPersonalEmail());
            if (request.getPhone() != null) employee.setPhone(request.getPhone());
            if (request.getMobilePhone() != null) employee.setMobilePhone(request.getMobilePhone());
            if (request.getPhysicalAddress() != null) employee.setPhysicalAddress(request.getPhysicalAddress());
            if (request.getPostalAddress() != null) employee.setPostalAddress(request.getPostalAddress());
            if (request.getCity() != null) employee.setCity(request.getCity());
            if (request.getProvince() != null) employee.setProvince(request.getProvince());
            if (request.getPostalCode() != null) employee.setPostalCode(request.getPostalCode());
            if (request.getCountry() != null) employee.setCountry(request.getCountry());
            if (request.getPreferredName() != null) employee.setPreferredName(request.getPreferredName());
            if (request.getMaritalStatus() != null) employee.setMaritalStatus(request.getMaritalStatus());

            Employee saved = employeeRepository.save(employee);
            auditLogService.saveLog(employeeId, "UPDATE", "EMPLOYEE_PROFILE",
                    employeeId, "Employee updated own profile");
            logger.info("Employee {} updated their profile", employee.getFullName());

            return ResponseEntity.ok(EmployeeProfileResponse.fromEntity(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Banking Details ----

    @GetMapping("/banking")
    public ResponseEntity<?> getBankingDetails(@RequestParam String employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
            return ResponseEntity.ok(Map.of(
                    "bankName", employee.getBankName() != null ? employee.getBankName() : "",
                    "bankBranchCode", employee.getBankBranchCode() != null ? employee.getBankBranchCode() : "",
                    "bankAccountNumber", employee.getBankAccountNumber() != null ? "****" + employee.getBankAccountNumber().substring(Math.max(0, employee.getBankAccountNumber().length() - 4)) : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/banking")
    public ResponseEntity<?> updateBankingDetails(@RequestParam String employeeId,
                                                  @RequestBody BankingDetailsRequest request) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

            if (request.getBankName() != null) employee.setBankName(request.getBankName());
            if (request.getBankBranchCode() != null) employee.setBankBranchCode(request.getBankBranchCode());
            if (request.getBankAccountNumber() != null) employee.setBankAccountNumber(request.getBankAccountNumber());

            employeeRepository.save(employee);
            auditLogService.saveLog(employeeId, "UPDATE", "EMPLOYEE_BANKING",
                    employeeId, "Employee updated banking details");

            return ResponseEntity.ok(Map.of("message", "Banking details updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Emergency Contact ----

    @GetMapping("/emergency-contact")
    public ResponseEntity<?> getEmergencyContact(@RequestParam String employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
            return ResponseEntity.ok(Map.of(
                    "emergencyContactName", employee.getEmergencyContactName() != null ? employee.getEmergencyContactName() : "",
                    "emergencyContactPhone", employee.getEmergencyContactPhone() != null ? employee.getEmergencyContactPhone() : "",
                    "emergencyContactRelationship", employee.getEmergencyContactRelationship() != null ? employee.getEmergencyContactRelationship() : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/emergency-contact")
    public ResponseEntity<?> updateEmergencyContact(@RequestParam String employeeId,
                                                    @RequestBody EmergencyContactRequest request) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

            if (request.getEmergencyContactName() != null) employee.setEmergencyContactName(request.getEmergencyContactName());
            if (request.getEmergencyContactPhone() != null) employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
            if (request.getEmergencyContactRelationship() != null) employee.setEmergencyContactRelationship(request.getEmergencyContactRelationship());

            employeeRepository.save(employee);
            auditLogService.saveLog(employeeId, "UPDATE", "EMPLOYEE_EMERGENCY_CONTACT",
                    employeeId, "Employee updated emergency contact details");

            return ResponseEntity.ok(Map.of("message", "Emergency contact updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Skills ----

    @GetMapping("/skills")
    public ResponseEntity<?> getSkills(@RequestParam String employeeId) {
        List<EmployeeSkill> skills = skillRepository.findByEmployeeId(employeeId);
        return ResponseEntity.ok(skills);
    }

    @PostMapping("/skills")
    public ResponseEntity<?> addSkill(@RequestParam String employeeId,
                                      @RequestBody EmployeeSkill skill) {
        try {
            skill.setEmployeeId(employeeId);
            EmployeeSkill saved = skillRepository.save(skill);
            auditLogService.saveLog(employeeId, "CREATE", "EMPLOYEE_SKILL",
                    saved.getId().toString(), "Added skill: " + saved.getSkillName());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/skills/{id}")
    public ResponseEntity<?> updateSkill(@PathVariable String id,
                                         @RequestParam String employeeId,
                                         @RequestBody EmployeeSkill request) {
        try {
            EmployeeSkill skill = skillRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Skill not found: " + id));
            if (request.getSkillName() != null) skill.setSkillName(request.getSkillName());
            if (request.getProficiencyLevel() != null) skill.setProficiencyLevel(request.getProficiencyLevel());
            if (request.getYearsExperience() != null) skill.setYearsExperience(request.getYearsExperience());
            if (request.getCertified() != null) skill.setCertified(request.getCertified());
            skill.setUpdatedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(skillRepository.save(skill));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<?> deleteSkill(@PathVariable String id) {
        skillRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Education ----

    @GetMapping("/education")
    public ResponseEntity<?> getEducation(@RequestParam String employeeId) {
        List<EmployeeEducation> education = educationRepository.findByEmployeeId(employeeId);
        return ResponseEntity.ok(education);
    }

    @PostMapping("/education")
    public ResponseEntity<?> addEducation(@RequestParam String employeeId,
                                          @RequestBody EmployeeEducation education) {
        try {
            education.setEmployeeId(employeeId);
            EmployeeEducation saved = educationRepository.save(education);
            auditLogService.saveLog(employeeId, "CREATE", "EMPLOYEE_EDUCATION",
                    saved.getId().toString(), "Added education: " + saved.getQualification());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/education/{id}")
    public ResponseEntity<?> updateEducation(@PathVariable String id,
                                             @RequestParam String employeeId,
                                             @RequestBody EmployeeEducation request) {
        try {
            EmployeeEducation education = educationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Education not found: " + id));
            if (request.getInstitution() != null) education.setInstitution(request.getInstitution());
            if (request.getQualification() != null) education.setQualification(request.getQualification());
            if (request.getFieldOfStudy() != null) education.setFieldOfStudy(request.getFieldOfStudy());
            if (request.getStartDate() != null) education.setStartDate(request.getStartDate());
            if (request.getEndDate() != null) education.setEndDate(request.getEndDate());
            if (request.getGrade() != null) education.setGrade(request.getGrade());
            education.setUpdatedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(educationRepository.save(education));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/education/{id}")
    public ResponseEntity<?> deleteEducation(@PathVariable String id) {
        educationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Documents ----

    @GetMapping("/documents")
    public ResponseEntity<List<EmployeeDocumentResponse>> getDocuments(@RequestParam String employeeId) {
        List<EmployeeDocument> docs = documentRepository.findActiveByEmployee(employeeId);
        List<EmployeeDocumentResponse> responses = docs.stream()
                .map(EmployeeDocumentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/documents")
    public ResponseEntity<?> uploadDocument(@RequestParam String employeeId,
                                            @RequestBody Map<String, Object> request) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

            EmployeeDocument doc = new EmployeeDocument();
            doc.setEmployee(employee);
            doc.setTitle((String) request.get("title"));
            doc.setDescription((String) request.get("description"));
            doc.setFilename((String) request.get("filename"));
            doc.setFileUrl((String) request.get("fileUrl"));
            doc.setContentType((String) request.get("contentType"));
            doc.setUploadedBy(employeeId);

            EmployeeDocument saved = documentRepository.save(doc);
            auditLogService.saveLog(employeeId, "UPLOAD", "EMPLOYEE_DOCUMENT",
                    saved.getId().toString(), "Employee uploaded document: " + saved.getTitle());

            return ResponseEntity.status(HttpStatus.CREATED).body(EmployeeDocumentResponse.fromEntity(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Document Type Configs ----

    @GetMapping("/document-types")
    public ResponseEntity<List<EmployeeDocumentTypeConfig>> getDocumentTypes() {
        return ResponseEntity.ok(documentTypeConfigRepository.findActive());
    }

    // ---- Document Verification ----

    @PutMapping("/documents/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> verifyDocument(@PathVariable String id,
                                             @RequestParam String verifiedBy) {
        try {
            EmployeeDocument doc = documentRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));
            doc.setIsVerified(true);
            doc.setVerifiedBy(verifiedBy);
            doc.setVerifiedAt(java.time.LocalDateTime.now());
            EmployeeDocument saved = documentRepository.save(doc);
            auditLogService.saveLog(verifiedBy, "VERIFY", "EMPLOYEE_DOCUMENT",
                    saved.getId().toString(), "Document verified: " + saved.getTitle());
            logger.info("Document {} verified by {}", id, verifiedBy);
            return ResponseEntity.ok(EmployeeDocumentResponse.fromEntity(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
