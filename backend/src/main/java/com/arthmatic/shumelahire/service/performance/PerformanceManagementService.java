package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.PerformanceCycleDataRepository;
import com.arthmatic.shumelahire.repository.PerformanceContractDataRepository;
import com.arthmatic.shumelahire.repository.PerformanceTemplateDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PerformanceManagementService {

    @Autowired
    private PerformanceCycleDataRepository cycleRepository;

    @Autowired
    private PerformanceContractDataRepository contractRepository;

    @Autowired
    private PerformanceTemplateDataRepository templateRepository;
    
    // ========== PERFORMANCE CYCLES ==========
    
    public PerformanceCycle createCycle(CreateCycleRequest request, String tenantId, String createdBy) {
        validateCycleDates(request.getStartDate(), request.getEndDate(), 
                          request.getMidYearDeadline(), request.getFinalReviewDeadline());
        
        PerformanceCycle cycle = new PerformanceCycle();
        cycle.setName(request.getName());
        cycle.setDescription(request.getDescription());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(request.getEndDate());
        cycle.setMidYearDeadline(request.getMidYearDeadline());
        cycle.setFinalReviewDeadline(request.getFinalReviewDeadline());
        cycle.setTenantId(tenantId);
        cycle.setCreatedBy(createdBy);
        
        return cycleRepository.save(cycle);
    }
    
    public List<PerformanceCycle> getCycles(String tenantId) {
        return cycleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }
    
    public Optional<PerformanceCycle> getCycle(Long id, String tenantId) {
        return cycleRepository.findByIdAndTenantId(String.valueOf(id), tenantId);
    }
    
    public void activateCycle(Long id, String tenantId) {
        PerformanceCycle cycle = cycleRepository.findByIdAndTenantId(String.valueOf(id), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Performance cycle not found"));
        
        if (!cycle.canBeActivated()) {
            throw new IllegalStateException("Cycle cannot be activated");
        }
        
        cycle.setStatus(CycleStatus.ACTIVE);
        cycleRepository.save(cycle);
    }
    
    // ========== PERFORMANCE CONTRACTS ==========
    
    public PerformanceContract createContract(CreateContractRequest request, String tenantId) {
        PerformanceCycle cycle = cycleRepository.findByIdAndTenantId(String.valueOf(request.getCycleId()), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Performance cycle not found"));
        
        if (!cycle.isActive()) {
            throw new IllegalStateException("Cannot create contracts for inactive cycles");
        }
        
        PerformanceContract contract = new PerformanceContract();
        contract.setCycle(cycle);
        contract.setEmployeeId(request.getEmployeeId());
        contract.setEmployeeName(request.getEmployeeName());
        contract.setManagerId(request.getManagerId());
        contract.setManagerName(request.getManagerName());
        contract.setDepartment(request.getDepartment());
        contract.setJobTitle(request.getJobTitle());
        contract.setTenantId(tenantId);
        
        return contractRepository.save(contract);
    }
    
    public List<PerformanceContract> getContracts(String tenantId) {
        return contractRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }
    
    public Optional<PerformanceContract> getContract(Long id, String tenantId) {
        return contractRepository.findByIdAndTenantId(String.valueOf(id), tenantId);
    }
    
    public void submitContract(Long id, String tenantId) {
        PerformanceContract contract = contractRepository.findByIdAndTenantId(String.valueOf(id), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Performance contract not found"));
        
        contract.submit();
        contractRepository.save(contract);
    }
    
    public void approveContract(Long id, String approverId, String comments, String tenantId) {
        PerformanceContract contract = contractRepository.findByIdAndTenantId(String.valueOf(id), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Performance contract not found"));
        
        contract.approve(approverId, comments);
        contractRepository.save(contract);
    }
    
    // ========== PERFORMANCE TEMPLATES ==========
    
    public PerformanceTemplate createTemplate(CreateTemplateRequest request, String tenantId, String createdBy) {
        PerformanceTemplate template = new PerformanceTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setDepartment(request.getDepartment());
        template.setJobLevel(request.getJobLevel());
        template.setTenantId(tenantId);
        template.setCreatedBy(createdBy);
        
        return templateRepository.save(template);
    }
    
    public List<PerformanceTemplate> getTemplates(String tenantId) {
        return templateRepository.findByTenantIdAndIsActiveOrderByNameAsc(tenantId);
    }
    
    public Optional<PerformanceTemplate> getTemplate(Long id, String tenantId) {
        return templateRepository.findByIdAndTenantId(String.valueOf(id), tenantId);
    }
    
    // ========== PRIVATE HELPER METHODS ==========
    
    private void validateCycleDates(LocalDate startDate, LocalDate endDate, 
                                  LocalDate midYearDeadline, LocalDate finalReviewDeadline) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
        if (midYearDeadline.isBefore(startDate) || midYearDeadline.isAfter(endDate)) {
            throw new IllegalArgumentException("Mid-year deadline must be within cycle period");
        }
        if (finalReviewDeadline.isBefore(midYearDeadline) || finalReviewDeadline.isAfter(endDate)) {
            throw new IllegalArgumentException("Final review deadline must be after mid-year and within cycle period");
        }
    }
    
    // ========== REQUEST CLASSES ==========
    
    public static class CreateCycleRequest {
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDate midYearDeadline;
        private LocalDate finalReviewDeadline;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public LocalDate getMidYearDeadline() { return midYearDeadline; }
        public void setMidYearDeadline(LocalDate midYearDeadline) { this.midYearDeadline = midYearDeadline; }
        public LocalDate getFinalReviewDeadline() { return finalReviewDeadline; }
        public void setFinalReviewDeadline(LocalDate finalReviewDeadline) { this.finalReviewDeadline = finalReviewDeadline; }
    }
    
    public static class CreateContractRequest {
        private Long cycleId;
        private String employeeId;
        private String employeeName;
        private String managerId;
        private String managerName;
        private String department;
        private String jobTitle;
        
        // Getters and setters
        public Long getCycleId() { return cycleId; }
        public void setCycleId(Long cycleId) { this.cycleId = cycleId; }
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getManagerId() { return managerId; }
        public void setManagerId(String managerId) { this.managerId = managerId; }
        public String getManagerName() { return managerName; }
        public void setManagerName(String managerName) { this.managerName = managerName; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    }
    
    public static class CreateTemplateRequest {
        private String name;
        private String description;
        private String department;
        private String jobLevel;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getJobLevel() { return jobLevel; }
        public void setJobLevel(String jobLevel) { this.jobLevel = jobLevel; }
    }
}