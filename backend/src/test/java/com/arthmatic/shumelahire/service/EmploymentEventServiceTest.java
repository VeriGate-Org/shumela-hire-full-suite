package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.employee.EmploymentEventRequest;
import com.arthmatic.shumelahire.dto.employee.EmploymentEventResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;
import com.arthmatic.shumelahire.repository.EmploymentEventDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmploymentEventServiceTest {

    @Mock
    private EmploymentEventDataRepository eventRepository;

    @Mock
    private EmployeeService employeeService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EmploymentEventService eventService;

    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        testEmployee = new Employee();
        testEmployee.setId(1L);
        testEmployee.setEmployeeNumber("UTW-2026-0001");
        testEmployee.setFirstName("John");
        testEmployee.setLastName("Doe");
        testEmployee.setEmail("john@company.com");
        testEmployee.setDepartment("Engineering");
        testEmployee.setJobTitle("Developer");
        testEmployee.setJobGrade("C3");
        testEmployee.setLocation("Johannesburg");
        testEmployee.setStatus(EmployeeStatus.ACTIVE);
        testEmployee.setHireDate(LocalDate.of(2024, 1, 15));
        testEmployee.setCreatedAt(LocalDateTime.now());
        testEmployee.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void createEvent_Promotion_UpdatesEmployeeAndCreatesEvent() {
        EmploymentEventRequest request = new EmploymentEventRequest();
        request.setEmployeeId(1L);
        request.setEventType(EmploymentEventType.PROMOTION);
        request.setEventDate(LocalDate.now());
        request.setEffectiveDate(LocalDate.now());
        request.setNewJobTitle("Senior Developer");
        request.setNewJobGrade("C4");

        EmploymentEvent savedEvent = new EmploymentEvent();
        savedEvent.setId(1L);
        savedEvent.setEmployee(testEmployee);
        savedEvent.setEventType(EmploymentEventType.PROMOTION);
        savedEvent.setEventDate(LocalDate.now());
        savedEvent.setEffectiveDate(LocalDate.now());
        savedEvent.setPreviousJobTitle("Developer");
        savedEvent.setNewJobTitle("Senior Developer");
        savedEvent.setCreatedAt(LocalDateTime.now());

        when(employeeService.findEmployeeById(1L)).thenReturn(testEmployee);
        when(eventRepository.save(any(EmploymentEvent.class))).thenReturn(savedEvent);

        EmploymentEventResponse result = eventService.createEvent(request);

        assertThat(result).isNotNull();
        assertThat(result.getEventType()).isEqualTo(EmploymentEventType.PROMOTION);
        assertThat(result.getPreviousJobTitle()).isEqualTo("Developer");
        assertThat(result.getNewJobTitle()).isEqualTo("Senior Developer");
        // Verify employee was updated
        assertThat(testEmployee.getJobTitle()).isEqualTo("Senior Developer");
        assertThat(testEmployee.getJobGrade()).isEqualTo("C4");
    }

    @Test
    void createEvent_Resignation_UpdatesEmployeeStatus() {
        EmploymentEventRequest request = new EmploymentEventRequest();
        request.setEmployeeId(1L);
        request.setEventType(EmploymentEventType.RESIGNATION);
        request.setEventDate(LocalDate.now());
        request.setEffectiveDate(LocalDate.now().plusMonths(1));
        request.setDescription("Personal reasons");

        EmploymentEvent savedEvent = new EmploymentEvent();
        savedEvent.setId(1L);
        savedEvent.setEmployee(testEmployee);
        savedEvent.setEventType(EmploymentEventType.RESIGNATION);
        savedEvent.setEventDate(LocalDate.now());
        savedEvent.setEffectiveDate(LocalDate.now().plusMonths(1));
        savedEvent.setCreatedAt(LocalDateTime.now());

        when(employeeService.findEmployeeById(1L)).thenReturn(testEmployee);
        when(eventRepository.save(any(EmploymentEvent.class))).thenReturn(savedEvent);

        eventService.createEvent(request);

        assertThat(testEmployee.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        assertThat(testEmployee.getTerminationDate()).isEqualTo(LocalDate.now().plusMonths(1));
    }

    @Test
    void createEvent_Suspension_UpdatesStatus() {
        EmploymentEventRequest request = new EmploymentEventRequest();
        request.setEmployeeId(1L);
        request.setEventType(EmploymentEventType.SUSPENSION);
        request.setEventDate(LocalDate.now());
        request.setEffectiveDate(LocalDate.now());

        EmploymentEvent savedEvent = new EmploymentEvent();
        savedEvent.setId(1L);
        savedEvent.setEmployee(testEmployee);
        savedEvent.setEventType(EmploymentEventType.SUSPENSION);
        savedEvent.setEventDate(LocalDate.now());
        savedEvent.setEffectiveDate(LocalDate.now());
        savedEvent.setCreatedAt(LocalDateTime.now());

        when(employeeService.findEmployeeById(1L)).thenReturn(testEmployee);
        when(eventRepository.save(any(EmploymentEvent.class))).thenReturn(savedEvent);

        eventService.createEvent(request);

        assertThat(testEmployee.getStatus()).isEqualTo(EmployeeStatus.SUSPENDED);
    }

    @Test
    void getEmployeeHistory_ReturnsEventsOrderedByDate() {
        EmploymentEvent event1 = new EmploymentEvent();
        event1.setId(1L);
        event1.setEmployee(testEmployee);
        event1.setEventType(EmploymentEventType.HIRE);
        event1.setEventDate(LocalDate.of(2024, 1, 15));
        event1.setEffectiveDate(LocalDate.of(2024, 1, 15));
        event1.setCreatedAt(LocalDateTime.now());

        EmploymentEvent event2 = new EmploymentEvent();
        event2.setId(2L);
        event2.setEmployee(testEmployee);
        event2.setEventType(EmploymentEventType.PROMOTION);
        event2.setEventDate(LocalDate.of(2025, 6, 1));
        event2.setEffectiveDate(LocalDate.of(2025, 6, 1));
        event2.setCreatedAt(LocalDateTime.now());

        when(eventRepository.findByEmployeeOrderByEventDateDesc("1")).thenReturn(List.of(event2, event1));

        List<EmploymentEventResponse> history = eventService.getEmployeeHistory(1L);

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getEventType()).isEqualTo(EmploymentEventType.PROMOTION);
        assertThat(history.get(1).getEventType()).isEqualTo(EmploymentEventType.HIRE);
    }
}
