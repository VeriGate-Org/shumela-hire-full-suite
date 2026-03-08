package com.arthmatic.shumelahire.service.integration.sage;

import com.arthmatic.shumelahire.dto.integration.SageConnectionTestResult;
import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "sage.300-people.enabled", matchIfMissing = true)
public class MockSage300PeopleConnector implements SageConnector {

    private static final Logger logger = LoggerFactory.getLogger(MockSage300PeopleConnector.class);

    @Override
    public SageConnectionTestResult testConnection(String baseUrl, String credentials) {
        logger.info("Mock Sage 300 People: Testing connection to {}", baseUrl);

        // Simulate a successful connection test
        try {
            Thread.sleep(500); // Simulate network latency
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return new SageConnectionTestResult(
                true,
                "Successfully connected to Sage 300 People (mock). API version: v2.1",
                LocalDateTime.now()
        );
    }

    @Override
    public List<Map<String, Object>> fetchEntities(SageSyncEntityType entityType, String baseUrl, String credentials) {
        logger.info("Mock Sage 300 People: Fetching {} entities from {}", entityType, baseUrl);

        List<Map<String, Object>> results = new ArrayList<>();

        switch (entityType) {
            case EMPLOYEE:
                results.add(createMockEmployee("EMP001", "John", "Doe", "Engineering"));
                results.add(createMockEmployee("EMP002", "Jane", "Smith", "Human Resources"));
                results.add(createMockEmployee("EMP003", "Bob", "Johnson", "Finance"));
                break;
            case DEPARTMENT:
                results.add(createMockDepartment("DEPT001", "Engineering", "ENG"));
                results.add(createMockDepartment("DEPT002", "Human Resources", "HR"));
                results.add(createMockDepartment("DEPT003", "Finance", "FIN"));
                break;
            case LEAVE:
                results.add(createMockLeaveRecord("LV001", "EMP001", "ANNUAL", 15));
                results.add(createMockLeaveRecord("LV002", "EMP002", "SICK", 10));
                break;
            case PAYROLL:
                results.add(createMockPayrollRecord("PAY001", "EMP001", 45000.00));
                results.add(createMockPayrollRecord("PAY002", "EMP002", 52000.00));
                break;
            case ATTENDANCE:
                results.add(createMockAttendanceRecord("ATT001", "EMP001", "2024-01-15", "08:00", "17:00"));
                results.add(createMockAttendanceRecord("ATT002", "EMP002", "2024-01-15", "08:30", "17:30"));
                break;
        }

        logger.info("Mock Sage 300 People: Fetched {} {} records", results.size(), entityType);
        return results;
    }

    @Override
    public int pushEntities(SageSyncEntityType entityType, List<Map<String, Object>> data, String baseUrl, String credentials) {
        logger.info("Mock Sage 300 People: Pushing {} {} entities to {}", data.size(), entityType, baseUrl);

        // Simulate processing each record
        int successCount = 0;
        for (Map<String, Object> record : data) {
            try {
                Thread.sleep(100); // Simulate per-record processing
                successCount++;
                logger.debug("Mock Sage 300 People: Successfully pushed record: {}", record.get("id"));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        logger.info("Mock Sage 300 People: Successfully pushed {}/{} {} records", successCount, data.size(), entityType);
        return successCount;
    }

    private Map<String, Object> createMockEmployee(String id, String firstName, String lastName, String department) {
        Map<String, Object> employee = new HashMap<>();
        employee.put("id", id);
        employee.put("firstName", firstName);
        employee.put("lastName", lastName);
        employee.put("department", department);
        employee.put("email", firstName.toLowerCase() + "." + lastName.toLowerCase() + "@example.com");
        employee.put("status", "ACTIVE");
        employee.put("source", "SAGE_300_PEOPLE");
        return employee;
    }

    private Map<String, Object> createMockDepartment(String id, String name, String code) {
        Map<String, Object> department = new HashMap<>();
        department.put("id", id);
        department.put("name", name);
        department.put("code", code);
        department.put("isActive", true);
        department.put("source", "SAGE_300_PEOPLE");
        return department;
    }

    private Map<String, Object> createMockLeaveRecord(String id, String employeeId, String leaveType, int balance) {
        Map<String, Object> leave = new HashMap<>();
        leave.put("id", id);
        leave.put("employeeId", employeeId);
        leave.put("leaveType", leaveType);
        leave.put("balance", balance);
        leave.put("source", "SAGE_300_PEOPLE");
        return leave;
    }

    private Map<String, Object> createMockPayrollRecord(String id, String employeeId, double grossSalary) {
        Map<String, Object> payroll = new HashMap<>();
        payroll.put("id", id);
        payroll.put("employeeId", employeeId);
        payroll.put("grossSalary", grossSalary);
        payroll.put("currency", "ZAR");
        payroll.put("source", "SAGE_300_PEOPLE");
        return payroll;
    }

    private Map<String, Object> createMockAttendanceRecord(String id, String employeeId, String date, String clockIn, String clockOut) {
        Map<String, Object> attendance = new HashMap<>();
        attendance.put("id", id);
        attendance.put("employeeId", employeeId);
        attendance.put("date", date);
        attendance.put("clockIn", clockIn);
        attendance.put("clockOut", clockOut);
        attendance.put("source", "SAGE_300_PEOPLE");
        return attendance;
    }
}
