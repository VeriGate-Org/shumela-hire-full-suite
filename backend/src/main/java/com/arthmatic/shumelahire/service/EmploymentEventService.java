package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.dto.employee.EmploymentEventRequest;
import com.arthmatic.shumelahire.dto.employee.EmploymentEventResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.EmploymentEvent;
import com.arthmatic.shumelahire.entity.EmploymentEventType;
import com.arthmatic.shumelahire.repository.EmploymentEventDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmploymentEventService {

    private static final Logger logger = LoggerFactory.getLogger(EmploymentEventService.class);

    @Autowired
    private EmploymentEventDataRepository eventRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private AuditLogService auditLogService;

    public EmploymentEventResponse createEvent(EmploymentEventRequest request) {
        logger.info("Creating employment event: {} for employee: {}", request.getEventType(), request.getEmployeeId());

        Employee employee = employeeService.findEmployeeById(request.getEmployeeId());

        EmploymentEvent event = new EmploymentEvent();
        event.setEmployee(employee);
        event.setEventType(request.getEventType());
        event.setEventDate(request.getEventDate());
        event.setEffectiveDate(request.getEffectiveDate());
        event.setDescription(request.getDescription());
        event.setNotes(request.getNotes());

        // Capture current state as "previous" values
        event.setPreviousDepartment(employee.getDepartment());
        event.setPreviousJobTitle(employee.getJobTitle());
        event.setPreviousJobGrade(employee.getJobGrade());
        event.setPreviousLocation(employee.getLocation());
        if (employee.getReportingManager() != null) {
            event.setPreviousReportingManagerId(employee.getReportingManager().getId());
        }

        // Set new values from request
        event.setNewDepartment(request.getNewDepartment());
        event.setNewJobTitle(request.getNewJobTitle());
        event.setNewJobGrade(request.getNewJobGrade());
        event.setNewLocation(request.getNewLocation());
        event.setNewReportingManagerId(request.getNewReportingManagerId());

        // Apply changes to employee based on event type
        applyEventToEmployee(employee, request);

        EmploymentEvent saved = eventRepository.save(event);

        auditLogService.logApplicantAction(employee.getId(), "EMPLOYMENT_EVENT_CREATED", "EMPLOYMENT_EVENT",
                request.getEventType().getDisplayName());

        logger.info("Employment event created: {} for {}", saved.getEventType(), employee.getEmployeeNumber());
        return EmploymentEventResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EmploymentEventResponse> getEmployeeHistory(Long employeeId) {
        List<EmploymentEvent> events = eventRepository.findByEmployeeOrderByEventDateDesc(String.valueOf(employeeId));
        return events.stream()
                .map(EmploymentEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CursorPage<EmploymentEventResponse> getEmployeeHistoryPaged(Long employeeId, String cursor, int pageSize) {
        CursorPage<EmploymentEvent> events = eventRepository.findByEmployee(String.valueOf(employeeId), cursor, pageSize);
        List<EmploymentEventResponse> content = events.content().stream()
                .map(EmploymentEventResponse::fromEntity)
                .collect(Collectors.toList());
        return new CursorPage<>(content, events.nextCursor(), events.hasMore(),
                events.size(), events.totalElements());
    }

    @Transactional(readOnly = true)
    public List<EmploymentEventResponse> getEmployeeEventsByType(Long employeeId, EmploymentEventType eventType) {
        List<EmploymentEvent> events = eventRepository.findByEmployeeAndEventType(String.valueOf(employeeId), eventType);
        return events.stream()
                .map(EmploymentEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private void applyEventToEmployee(Employee employee, EmploymentEventRequest request) {
        switch (request.getEventType()) {
            case PROMOTION:
            case TRANSFER:
            case DEMOTION:
                if (request.getNewDepartment() != null) employee.setDepartment(request.getNewDepartment());
                if (request.getNewJobTitle() != null) employee.setJobTitle(request.getNewJobTitle());
                if (request.getNewJobGrade() != null) employee.setJobGrade(request.getNewJobGrade());
                if (request.getNewLocation() != null) employee.setLocation(request.getNewLocation());
                if (request.getNewReportingManagerId() != null) {
                    Employee manager = employeeService.findEmployeeById(request.getNewReportingManagerId());
                    employee.setReportingManager(manager);
                }
                break;
            case SUSPENSION:
                employee.setStatus(com.arthmatic.shumelahire.entity.EmployeeStatus.SUSPENDED);
                break;
            case REINSTATEMENT:
                employee.setStatus(com.arthmatic.shumelahire.entity.EmployeeStatus.ACTIVE);
                break;
            case RESIGNATION:
                employee.setStatus(com.arthmatic.shumelahire.entity.EmployeeStatus.RESIGNED);
                employee.setTerminationDate(request.getEffectiveDate());
                employee.setTerminationReason(request.getDescription());
                break;
            case DISMISSAL:
                employee.setStatus(com.arthmatic.shumelahire.entity.EmployeeStatus.TERMINATED);
                employee.setTerminationDate(request.getEffectiveDate());
                employee.setTerminationReason(request.getDescription());
                break;
            case RETIREMENT:
                employee.setStatus(com.arthmatic.shumelahire.entity.EmployeeStatus.RETIRED);
                employee.setTerminationDate(request.getEffectiveDate());
                break;
            default:
                break;
        }
    }
}
