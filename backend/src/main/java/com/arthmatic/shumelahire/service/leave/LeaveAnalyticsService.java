package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.entity.leave.LeaveRequestStatus;
import com.arthmatic.shumelahire.repository.LeaveBalanceDataRepository;
import com.arthmatic.shumelahire.repository.LeaveRequestDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
}
