package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.dto.performance.*;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.performance.*;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompetencyService {

    private static final Logger logger = LoggerFactory.getLogger(CompetencyService.class);

    @Autowired
    private CompetencyFrameworkRepository frameworkRepository;

    @Autowired
    private CompetencyRepository competencyRepository;

    @Autowired
    private EmployeeCompetencyRepository employeeCompetencyRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    // Framework CRUD
    public CompetencyFrameworkResponse createFramework(String name, String description) {
        CompetencyFramework framework = new CompetencyFramework();
        framework.setName(name);
        framework.setDescription(description);
        framework.setIsActive(true);
        framework = frameworkRepository.save(framework);

        auditLogService.saveLog("SYSTEM", "CREATE", "COMPETENCY_FRAMEWORK",
                framework.getId().toString(), "Created competency framework: " + name);
        return CompetencyFrameworkResponse.fromEntity(framework);
    }

    @Transactional(readOnly = true)
    public List<CompetencyFrameworkResponse> getActiveFrameworks() {
        return frameworkRepository.findByIsActiveTrue().stream()
                .map(CompetencyFrameworkResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CompetencyFrameworkResponse> getAllFrameworks() {
        return frameworkRepository.findAll().stream()
                .map(CompetencyFrameworkResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompetencyFrameworkResponse getFramework(Long id) {
        CompetencyFramework framework = frameworkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Framework not found: " + id));
        return CompetencyFrameworkResponse.fromEntity(framework);
    }

    public void deactivateFramework(Long id) {
        CompetencyFramework framework = frameworkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Framework not found: " + id));
        framework.setIsActive(false);
        frameworkRepository.save(framework);

        auditLogService.saveLog("SYSTEM", "DEACTIVATE", "COMPETENCY_FRAMEWORK",
                id.toString(), "Deactivated framework: " + framework.getName());
    }

    // Competency CRUD
    public CompetencyResponse addCompetency(Long frameworkId, String name, String description,
                                            String category, String proficiencyLevels) {
        CompetencyFramework framework = frameworkRepository.findById(frameworkId)
                .orElseThrow(() -> new IllegalArgumentException("Framework not found: " + frameworkId));

        Competency competency = new Competency();
        competency.setFramework(framework);
        competency.setName(name);
        competency.setDescription(description);
        competency.setCategory(category);
        competency.setProficiencyLevels(proficiencyLevels);
        competency = competencyRepository.save(competency);

        auditLogService.saveLog("SYSTEM", "CREATE", "COMPETENCY",
                competency.getId().toString(), "Added competency: " + name + " to framework " + frameworkId);
        return CompetencyResponse.fromEntity(competency);
    }

    @Transactional(readOnly = true)
    public List<CompetencyResponse> getCompetenciesByFramework(Long frameworkId) {
        return competencyRepository.findByFrameworkId(frameworkId).stream()
                .map(CompetencyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Employee Competency Assessment
    public EmployeeCompetencyResponse assessCompetency(Long employeeId, Long competencyId,
                                                       Integer currentLevel, Integer targetLevel,
                                                       Long assessorId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        Competency competency = competencyRepository.findById(competencyId)
                .orElseThrow(() -> new IllegalArgumentException("Competency not found: " + competencyId));

        Employee assessor = assessorId != null ? employeeRepository.findById(assessorId).orElse(null) : null;

        EmployeeCompetency ec = employeeCompetencyRepository
                .findByEmployeeIdAndCompetencyId(employeeId, competencyId)
                .orElse(new EmployeeCompetency());

        ec.setEmployee(employee);
        ec.setCompetency(competency);
        ec.setCurrentLevel(currentLevel);
        ec.setTargetLevel(targetLevel);
        ec.setAssessor(assessor);
        ec.setAssessedAt(LocalDateTime.now());

        ec = employeeCompetencyRepository.save(ec);

        auditLogService.saveLog(assessorId != null ? assessorId.toString() : "SYSTEM",
                "ASSESS", "EMPLOYEE_COMPETENCY",
                ec.getId().toString(), "Assessed competency for employee " + employeeId);
        return EmployeeCompetencyResponse.fromEntity(ec);
    }

    @Transactional(readOnly = true)
    public List<EmployeeCompetencyResponse> getEmployeeCompetencies(Long employeeId) {
        return employeeCompetencyRepository.findByEmployeeId(employeeId).stream()
                .map(EmployeeCompetencyResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
