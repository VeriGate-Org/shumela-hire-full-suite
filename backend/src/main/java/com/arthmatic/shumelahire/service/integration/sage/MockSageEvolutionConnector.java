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
@ConditionalOnProperty(name = "sage.evolution.enabled", matchIfMissing = true)
public class MockSageEvolutionConnector implements SageConnector {

    private static final Logger logger = LoggerFactory.getLogger(MockSageEvolutionConnector.class);

    @Override
    public SageConnectionTestResult testConnection(String baseUrl, String credentials) {
        logger.info("Mock Sage Evolution: Testing connection to {}", baseUrl);

        // Simulate a successful connection test
        try {
            Thread.sleep(500); // Simulate network latency
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return new SageConnectionTestResult(
                true,
                "Successfully connected to Sage Evolution (mock). Server version: 7.20",
                LocalDateTime.now()
        );
    }

    @Override
    public List<Map<String, Object>> fetchEntities(SageSyncEntityType entityType, String baseUrl, String credentials) {
        logger.info("Mock Sage Evolution: Fetching {} entities from {}", entityType, baseUrl);

        List<Map<String, Object>> results = new ArrayList<>();

        switch (entityType) {
            case EMPLOYEE:
                results.add(createMockEmployee("EVO-E001", "Alice", "Williams", "Operations"));
                results.add(createMockEmployee("EVO-E002", "Charlie", "Brown", "Sales"));
                results.add(createMockEmployee("EVO-E003", "Diana", "Prince", "Marketing"));
                break;
            case DEPARTMENT:
                results.add(createMockDepartment("EVO-D001", "Operations", "OPS"));
                results.add(createMockDepartment("EVO-D002", "Sales", "SLS"));
                results.add(createMockDepartment("EVO-D003", "Marketing", "MKT"));
                break;
            case LEAVE:
                results.add(createMockLeaveRecord("EVO-L001", "EVO-E001", "ANNUAL", 20));
                results.add(createMockLeaveRecord("EVO-L002", "EVO-E002", "SICK", 8));
                break;
            case PAYROLL:
                results.add(createMockPayrollRecord("EVO-P001", "EVO-E001", 38000.00));
                results.add(createMockPayrollRecord("EVO-P002", "EVO-E002", 42000.00));
                break;
            case ATTENDANCE:
                results.add(createMockAttendanceRecord("EVO-A001", "EVO-E001", "2024-01-15", "07:45", "16:45"));
                results.add(createMockAttendanceRecord("EVO-A002", "EVO-E002", "2024-01-15", "09:00", "18:00"));
                break;
        }

        logger.info("Mock Sage Evolution: Fetched {} {} records", results.size(), entityType);
        return results;
    }

    @Override
    public int pushEntities(SageSyncEntityType entityType, List<Map<String, Object>> data, String baseUrl, String credentials) {
        logger.info("Mock Sage Evolution: Pushing {} {} entities to {}", data.size(), entityType, baseUrl);

        // Simulate processing each record
        int successCount = 0;
        for (Map<String, Object> record : data) {
            try {
                Thread.sleep(100); // Simulate per-record processing
                successCount++;
                logger.debug("Mock Sage Evolution: Successfully pushed record: {}", record.get("id"));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        logger.info("Mock Sage Evolution: Successfully pushed {}/{} {} records", successCount, data.size(), entityType);
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
        employee.put("source", "SAGE_EVOLUTION");
        return employee;
    }

    private Map<String, Object> createMockDepartment(String id, String name, String code) {
        Map<String, Object> department = new HashMap<>();
        department.put("id", id);
        department.put("name", name);
        department.put("code", code);
        department.put("isActive", true);
        department.put("source", "SAGE_EVOLUTION");
        return department;
    }

    private Map<String, Object> createMockLeaveRecord(String id, String employeeId, String leaveType, int balance) {
        Map<String, Object> leave = new HashMap<>();
        leave.put("id", id);
        leave.put("employeeId", employeeId);
        leave.put("leaveType", leaveType);
        leave.put("balance", balance);
        leave.put("source", "SAGE_EVOLUTION");
        return leave;
    }

    private Map<String, Object> createMockPayrollRecord(String id, String employeeId, double grossSalary) {
        Map<String, Object> payroll = new HashMap<>();
        payroll.put("id", id);
        payroll.put("employeeId", employeeId);
        payroll.put("grossSalary", grossSalary);
        payroll.put("currency", "ZAR");
        payroll.put("source", "SAGE_EVOLUTION");
        return payroll;
    }

    private Map<String, Object> createMockAttendanceRecord(String id, String employeeId, String date, String clockIn, String clockOut) {
        Map<String, Object> attendance = new HashMap<>();
        attendance.put("id", id);
        attendance.put("employeeId", employeeId);
        attendance.put("date", date);
        attendance.put("clockIn", clockIn);
        attendance.put("clockOut", clockOut);
        attendance.put("source", "SAGE_EVOLUTION");
        return attendance;
    }
}
