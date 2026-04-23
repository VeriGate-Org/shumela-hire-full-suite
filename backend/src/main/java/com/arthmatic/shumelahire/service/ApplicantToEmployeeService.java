package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.ApplicantToEmployeeRequest;
import com.arthmatic.shumelahire.dto.employee.EmployeeResponse;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.EmploymentEventDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class ApplicantToEmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicantToEmployeeService.class);

    @Autowired
    private ApplicantDataRepository applicantRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private EmploymentEventDataRepository eventRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private AuditLogService auditLogService;

    public EmployeeResponse convertApplicantToEmployee(ApplicantToEmployeeRequest request) {
        logger.info("Converting applicant {} to employee", request.getApplicantId());

        // Verify applicant exists
        Applicant applicant = applicantRepository.findById(request.getApplicantId())
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + request.getApplicantId()));

        // Check if already converted
        if (employeeRepository.findByApplicantId(request.getApplicantId()).isPresent()) {
            throw new IllegalArgumentException("Applicant already converted to employee");
        }

        // Create employee from applicant data
        Employee employee = new Employee();
        employee.setEmployeeNumber(employeeService.generateEmployeeNumber());
        employee.setFirstName(applicant.getName());
        employee.setLastName(applicant.getSurname());
        employee.setEmail(applicant.getEmail());
        employee.setPhone(applicant.getPhone());
        employee.setIdNumber(applicant.getIdPassportNumber());
        employee.setPhysicalAddress(applicant.getAddress());
        employee.setGender(applicant.getGender());
        employee.setRace(applicant.getRace());
        employee.setDisabilityStatus(applicant.getDisabilityStatus());
        employee.setCitizenshipStatus(applicant.getCitizenshipStatus());
        employee.setDemographicsConsent(applicant.getDemographicsConsent());
        employee.setDemographicsConsentDate(applicant.getDemographicsConsentDate());
        employee.setApplicant(applicant);

        // Set employment details from request
        employee.setHireDate(request.getHireDate());
        employee.setDepartment(request.getDepartment());
        employee.setJobTitle(request.getJobTitle());
        employee.setJobGrade(request.getJobGrade());
        employee.setEmploymentType(request.getEmploymentType());
        employee.setLocation(request.getLocation());
        employee.setSite(request.getSite());
        employee.setCostCentre(request.getCostCentre());
        employee.setProbationEndDate(request.getProbationEndDate());
        employee.setContractEndDate(request.getContractEndDate());
        employee.setStatus(EmployeeStatus.ACTIVE);

        if (request.getReportingManagerId() != null) {
            Employee manager = employeeService.findEmployeeById(request.getReportingManagerId());
            employee.setReportingManager(manager);
        }

        Employee saved = employeeRepository.save(employee);

        // Create HIRE employment event
        EmploymentEvent hireEvent = new EmploymentEvent();
        hireEvent.setEmployee(saved);
        hireEvent.setEventType(EmploymentEventType.HIRE);
        hireEvent.setEventDate(LocalDate.now());
        hireEvent.setEffectiveDate(request.getHireDate());
        hireEvent.setDescription("Hired from applicant conversion");
        hireEvent.setNewDepartment(request.getDepartment());
        hireEvent.setNewJobTitle(request.getJobTitle());
        hireEvent.setNewJobGrade(request.getJobGrade());
        hireEvent.setNewLocation(request.getLocation());
        eventRepository.save(hireEvent);

        auditLogService.logApplicantAction(saved.getId(), "APPLICANT_CONVERTED", "EMPLOYEE",
                "Applicant " + applicant.getFullName() + " converted to employee " + saved.getEmployeeNumber());

        logger.info("Applicant {} converted to employee {} ({})",
                applicant.getId(), saved.getId(), saved.getEmployeeNumber());

        return EmployeeResponse.fromEntity(saved);
    }
}
