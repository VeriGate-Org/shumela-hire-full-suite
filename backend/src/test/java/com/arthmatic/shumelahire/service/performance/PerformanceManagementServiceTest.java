package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.performance.PerformanceCycleRepository;
import com.arthmatic.shumelahire.repository.performance.PerformanceContractRepository;
import com.arthmatic.shumelahire.repository.performance.PerformanceTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PerformanceManagementServiceTest {

    @Mock
    private PerformanceCycleRepository cycleRepository;
    
    @Mock
    private PerformanceContractRepository contractRepository;
    
    @Mock
    private PerformanceTemplateRepository templateRepository;
    
    @InjectMocks
    private PerformanceManagementService performanceService;
    
    private PerformanceCycle testCycle;
    private PerformanceContract testContract;
    private String tenantId = "test-tenant";
    private String userId = "test-user";
    
    @BeforeEach
    void setUp() {
        LocalDate now = LocalDate.now();
        testCycle = new PerformanceCycle();
        testCycle.setId(1L);
        testCycle.setName("Performance Cycle");
        testCycle.setStartDate(now.minusMonths(6));
        testCycle.setEndDate(now.plusMonths(6));
        testCycle.setMidYearDeadline(now.plusMonths(1));
        testCycle.setFinalReviewDeadline(now.plusMonths(5));
        testCycle.setStatus(CycleStatus.ACTIVE);
        testCycle.setTenantId(tenantId);

        testContract = new PerformanceContract();
        testContract.setId(1L);
        testContract.setCycle(testCycle);
        testContract.setEmployeeId("EMP001");
        testContract.setEmployeeName("John Doe");
        testContract.setManagerId("MGR001");
        testContract.setManagerName("Jane Smith");
        testContract.setTenantId(tenantId);
        testContract.setStatus(ContractStatus.DRAFT);
        PerformanceGoal goal = new PerformanceGoal();
        goal.setTitle("Deliver project on time");
        goal.setContract(testContract);
        testContract.setGoals(new ArrayList<>(List.of(goal)));
    }

    @Test
    void createCycle_ShouldCreateValidCycle() {
        // Given
        LocalDate now = LocalDate.now();
        PerformanceManagementService.CreateCycleRequest request = new PerformanceManagementService.CreateCycleRequest();
        request.setName("Performance Cycle");
        request.setDescription("Annual performance cycle");
        request.setStartDate(now.minusMonths(6));
        request.setEndDate(now.plusMonths(6));
        request.setMidYearDeadline(now.plusMonths(1));
        request.setFinalReviewDeadline(now.plusMonths(5));

        when(cycleRepository.save(any(PerformanceCycle.class))).thenReturn(testCycle);

        // When
        PerformanceCycle result = performanceService.createCycle(request, tenantId, userId);

        // Then
        assertNotNull(result);
        assertEquals("Performance Cycle", result.getName());
        assertEquals(tenantId, result.getTenantId());
        verify(cycleRepository).save(any(PerformanceCycle.class));
    }
    
    @Test
    void createCycle_ShouldThrowException_WhenDatesInvalid() {
        // Given — start after end
        LocalDate now = LocalDate.now();
        PerformanceManagementService.CreateCycleRequest request = new PerformanceManagementService.CreateCycleRequest();
        request.setName("Invalid Cycle");
        request.setStartDate(now.plusMonths(6));
        request.setEndDate(now.minusMonths(6));
        request.setMidYearDeadline(now);
        request.setFinalReviewDeadline(now.plusMonths(3));

        // When & Then
        assertThrows(IllegalArgumentException.class,
            () -> performanceService.createCycle(request, tenantId, userId));
        verify(cycleRepository, never()).save(any());
    }

    @Test
    void activateCycle_ShouldActivateValidCycle() {
        // Given
        testCycle.setStatus(CycleStatus.PLANNING);
        when(cycleRepository.findByIdAndTenantId(1L, tenantId)).thenReturn(Optional.of(testCycle));
        when(cycleRepository.save(any(PerformanceCycle.class))).thenReturn(testCycle);
        
        // When
        performanceService.activateCycle(1L, tenantId);
        
        // Then
        verify(cycleRepository).save(testCycle);
        assertEquals(CycleStatus.ACTIVE, testCycle.getStatus());
    }
    
    @Test
    void createContract_ShouldCreateValidContract() {
        // Given
        PerformanceManagementService.CreateContractRequest request = new PerformanceManagementService.CreateContractRequest();
        request.setCycleId(1L);
        request.setEmployeeId("EMP001");
        request.setEmployeeName("John Doe");
        request.setManagerId("MGR001");
        request.setManagerName("Jane Smith");
        request.setDepartment("IT");
        request.setJobTitle("Software Engineer");
        
        when(cycleRepository.findByIdAndTenantId(1L, tenantId)).thenReturn(Optional.of(testCycle));
        when(contractRepository.save(any(PerformanceContract.class))).thenReturn(testContract);
        
        // When
        PerformanceContract result = performanceService.createContract(request, tenantId);
        
        // Then
        assertNotNull(result);
        assertEquals("EMP001", result.getEmployeeId());
        assertEquals("John Doe", result.getEmployeeName());
        assertEquals(ContractStatus.DRAFT, result.getStatus());
        verify(contractRepository).save(any(PerformanceContract.class));
    }

    @Test
    void submitContract_ShouldSubmitValidContract() {
        // Given
        testContract.setStatus(ContractStatus.DRAFT);
        when(contractRepository.findByIdAndTenantId(1L, tenantId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(PerformanceContract.class))).thenReturn(testContract);
        
        // When
        performanceService.submitContract(1L, tenantId);
        
        // Then
        verify(contractRepository).save(testContract);
        assertEquals(ContractStatus.SUBMITTED, testContract.getStatus());
        assertNotNull(testContract.getSubmittedAt());
    }

    @Test
    void approveContract_ShouldApproveSubmittedContract() {
        // Given
        testContract.setStatus(ContractStatus.SUBMITTED);
        when(contractRepository.findByIdAndTenantId(1L, tenantId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(PerformanceContract.class))).thenReturn(testContract);
        
        // When
        performanceService.approveContract(1L, userId, "Approved with minor comments", tenantId);
        
        // Then
        verify(contractRepository).save(testContract);
        assertEquals(ContractStatus.APPROVED, testContract.getStatus());
        assertEquals(userId, testContract.getApprovedBy());
        assertEquals("Approved with minor comments", testContract.getApprovalComments());
        assertNotNull(testContract.getApprovedAt());
    }
}