package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import com.arthmatic.shumelahire.repository.LeaveBalanceDataRepository;
import com.arthmatic.shumelahire.repository.LeaveRequestDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeaveAnalyticsService {

    @Autowired
    private LeaveRequestDataRepository leaveRequestRepository;

    @Autowired
    private LeaveBalanceDataRepository leaveBalanceRepository;

    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Pending requests count
        long pendingCount = leaveRequestRepository
                .findByStatus(LeaveRequestStatus.PENDING).size();
        analytics.put("pendingRequests", pendingCount);

        // Current month leave distribution
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());
        List<LeaveRequest> currentMonthLeave = leaveRequestRepository.findAllOverlapping(monthStart, monthEnd);

        Map<String, Long> leaveByType = currentMonthLeave.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getLeaveType().getName(),
                        Collectors.counting()));
        analytics.put("currentMonthByType", leaveByType);

        Map<String, Long> leaveByDepartment = currentMonthLeave.stream()
                .filter(r -> r.getEmployee().getDepartment() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getEmployee().getDepartment(),
                        Collectors.counting()));
        analytics.put("currentMonthByDepartment", leaveByDepartment);

        // Total days taken this year
        BigDecimal totalDaysTaken = currentMonthLeave.stream()
                .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED)
                .map(LeaveRequest::getTotalDays)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        analytics.put("totalDaysTakenThisMonth", totalDaysTaken);

        analytics.put("employeesOnLeaveToday", leaveRequestRepository
                .findAllOverlapping(now, now).stream()
                .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED)
                .count());

        return analytics;
    }

    public Map<String, Object> getAnalyticsTrends() {
        Map<String, Object> trends = new LinkedHashMap<>();

        // Monthly trends for the last 12 months
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 11; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            List<LeaveRequest> monthLeave = leaveRequestRepository.findAllOverlapping(monthStart, monthEnd);
            long approvedCount = monthLeave.stream()
                    .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED)
                    .count();

            BigDecimal totalDays = monthLeave.stream()
                    .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED)
                    .map(LeaveRequest::getTotalDays)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("month", monthStart.format(fmt));
            monthData.put("totalDays", totalDays);
            monthData.put("requestCount", approvedCount);

            // Breakdown by type
            Map<String, Long> byType = new LinkedHashMap<>();
            monthLeave.stream()
                    .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED)
                    .forEach(r -> byType.merge(r.getLeaveType().getName(), 1L, Long::sum));
            monthData.put("byType", byType);

            monthlyTrends.add(monthData);
        }
        trends.put("monthlyTrends", monthlyTrends);

        // Summary rates
        long totalEmployees = leaveBalanceRepository.findAll().stream()
                .filter(b -> b.getEmployee() != null)
                .map(b -> b.getEmployee().getId())
                .distinct()
                .count();
        totalEmployees = Math.max(totalEmployees, 1);

        // Utilization rate: total days taken / total days entitled
        BigDecimal totalEntitled = leaveBalanceRepository.findAll().stream()
                .map(b -> new BigDecimal(String.valueOf(b.getEntitledDays())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTaken = leaveBalanceRepository.findAll().stream()
                .map(b -> new BigDecimal(String.valueOf(b.getTakenDays())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal utilizationRate = totalEntitled.compareTo(BigDecimal.ZERO) > 0
                ? totalTaken.multiply(BigDecimal.valueOf(100)).divide(totalEntitled, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        trends.put("utilizationRate", utilizationRate);

        // Absenteeism rate
        BigDecimal workDaysPerYear = BigDecimal.valueOf(260);
        BigDecimal absenteeismRate = totalTaken.divide(
                workDaysPerYear.multiply(BigDecimal.valueOf(totalEmployees)), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
        trends.put("absenteeismRate", absenteeismRate);

        // Average approval time (static estimate for demo)
        trends.put("averageApprovalTimeDays", 1.8);

        return trends;
    }
}
