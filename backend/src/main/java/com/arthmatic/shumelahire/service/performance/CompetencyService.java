package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.dto.performance.*;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.entity.training.TrainingCourse;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.performance.*;
import com.arthmatic.shumelahire.repository.training.TrainingCourseRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
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
    private TrainingCourseRepository trainingCourseRepository;

    @Autowired
    private AuditLogService auditLogService;

    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    // Skill Gap Analysis

    @Transactional(readOnly = true)
    public List<SkillGapDto> getSkillGaps(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        List<EmployeeCompetency> assessments = employeeCompetencyRepository.findByEmployeeId(employeeId);
        List<TrainingCourse> activeCourses = trainingCourseRepository.findByIsActiveTrue();

        return assessments.stream()
                .filter(ec -> ec.getTargetLevel() > ec.getCurrentLevel())
                .map(ec -> {
                    SkillGapDto dto = new SkillGapDto();
                    dto.setCompetencyId(ec.getCompetency().getId());
                    dto.setCompetencyName(ec.getCompetency().getName());
                    dto.setFrameworkName(ec.getCompetency().getFramework() != null
                            ? ec.getCompetency().getFramework().getName() : null);
                    dto.setCategory(ec.getCompetency().getCategory());
                    dto.setCurrentLevel(ec.getCurrentLevel());
                    dto.setTargetLevel(ec.getTargetLevel());
                    dto.setGap(ec.getTargetLevel() - ec.getCurrentLevel());

                    List<SkillGapDto.RecommendedCourse> courses = findCoursesForCompetency(
                            ec.getCompetency().getId(), activeCourses);
                    dto.setRecommendedCourses(courses);

                    return dto;
                })
                .sorted(Comparator.comparingInt(SkillGapDto::getGap).reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillGapDto> getDepartmentGaps(Long departmentId) {
        // departmentId is used as a string lookup since Employee.department is a String
        // For convenience, we accept the department name as a query parameter in the controller
        List<Employee> employees = employeeRepository.findByDepartment(
                departmentId.toString(), PageRequest.of(0, 1000)).getContent();

        if (employees.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, SkillGapDto> aggregatedGaps = new LinkedHashMap<>();

        for (Employee emp : employees) {
            List<EmployeeCompetency> assessments = employeeCompetencyRepository.findByEmployeeId(emp.getId());
            for (EmployeeCompetency ec : assessments) {
                if (ec.getTargetLevel() > ec.getCurrentLevel()) {
                    aggregatedGaps.compute(ec.getCompetency().getId(), (key, existing) -> {
                        if (existing == null) {
                            SkillGapDto dto = new SkillGapDto();
                            dto.setCompetencyId(ec.getCompetency().getId());
                            dto.setCompetencyName(ec.getCompetency().getName());
                            dto.setFrameworkName(ec.getCompetency().getFramework() != null
                                    ? ec.getCompetency().getFramework().getName() : null);
                            dto.setCategory(ec.getCompetency().getCategory());
                            dto.setCurrentLevel(ec.getCurrentLevel());
                            dto.setTargetLevel(ec.getTargetLevel());
                            dto.setGap(ec.getTargetLevel() - ec.getCurrentLevel());
                            return dto;
                        }
                        // Aggregate: use worst gap across employees
                        int gap = ec.getTargetLevel() - ec.getCurrentLevel();
                        if (gap > existing.getGap()) {
                            existing.setCurrentLevel(ec.getCurrentLevel());
                            existing.setTargetLevel(ec.getTargetLevel());
                            existing.setGap(gap);
                        }
                        return existing;
                    });
                }
            }
        }

        return aggregatedGaps.values().stream()
                .sorted(Comparator.comparingInt(SkillGapDto::getGap).reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrainingRecommendationDto> getTrainingRecommendations(Long employeeId) {
        List<SkillGapDto> gaps = getSkillGaps(employeeId);
        if (gaps.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> gapCompetencyIds = gaps.stream()
                .map(SkillGapDto::getCompetencyId)
                .collect(Collectors.toSet());

        Map<String, String> competencyNames = gaps.stream()
                .collect(Collectors.toMap(
                        g -> g.getCompetencyId().toString(),
                        SkillGapDto::getCompetencyName,
                        (a, b) -> a));

        List<TrainingCourse> activeCourses = trainingCourseRepository.findByIsActiveTrue();
        List<TrainingRecommendationDto> recommendations = new ArrayList<>();

        for (TrainingCourse course : activeCourses) {
            List<Long> linkedIds = parseLinkedCompetencyIds(course.getLinkedCompetencyIds());
            List<String> matching = linkedIds.stream()
                    .filter(gapCompetencyIds::contains)
                    .map(id -> competencyNames.getOrDefault(id.toString(), "Competency " + id))
                    .collect(Collectors.toList());

            if (!matching.isEmpty()) {
                TrainingRecommendationDto rec = new TrainingRecommendationDto();
                rec.setCourseId(course.getId());
                rec.setCourseTitle(course.getTitle());
                rec.setCategory(course.getCategory());
                rec.setDeliveryMethod(course.getDeliveryMethod() != null
                        ? course.getDeliveryMethod().name() : null);
                rec.setDurationHours(course.getDurationHours());
                rec.setMatchingCompetencies(matching);
                recommendations.add(rec);
            }
        }

        recommendations.sort(Comparator.comparingInt((TrainingRecommendationDto r) ->
                r.getMatchingCompetencies().size()).reversed());
        return recommendations;
    }

    private List<SkillGapDto.RecommendedCourse> findCoursesForCompetency(
            Long competencyId, List<TrainingCourse> courses) {
        List<SkillGapDto.RecommendedCourse> result = new ArrayList<>();
        for (TrainingCourse course : courses) {
            List<Long> linkedIds = parseLinkedCompetencyIds(course.getLinkedCompetencyIds());
            if (linkedIds.contains(competencyId)) {
                result.add(new SkillGapDto.RecommendedCourse(course.getId(), course.getTitle()));
            }
        }
        return result;
    }

    private List<Long> parseLinkedCompetencyIds(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            logger.warn("Failed to parse linkedCompetencyIds: {}", json, e);
            return Collections.emptyList();
        }
    }
}
