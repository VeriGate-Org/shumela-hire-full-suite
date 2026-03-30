package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeaveBalanceResponse;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.leave.LeaveBalance;
import com.arthmatic.shumelahire.entity.leave.LeaveType;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.LeaveBalanceDataRepository;
import com.arthmatic.shumelahire.repository.LeaveTypeDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveBalanceService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveBalanceService.class);

    @Autowired
    private LeaveBalanceDataRepository leaveBalanceRepository;

    @Autowired
    private LeaveTypeDataRepository leaveTypeRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<LeaveBalanceResponse> getBalancesForEmployee(Long employeeId, Integer cycleYear) {
        int year = cycleYear != null ? cycleYear : LocalDate.now().getYear();
        return leaveBalanceRepository.findBalancesForEmployee(String.valueOf(employeeId)).stream()
                .filter(b -> b.getCycleYear() != null && b.getCycleYear().equals(year))
                .map(LeaveBalanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeaveBalance getOrCreateBalance(Long employeeId, Long leaveTypeId, Integer cycleYear) {
        return leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndCycleYear(String.valueOf(employeeId), String.valueOf(leaveTypeId), cycleYear)
                .orElseGet(() -> initializeBalance(employeeId, leaveTypeId, cycleYear));
    }

    public LeaveBalance initializeBalance(Long employeeId, Long leaveTypeId, Integer cycleYear) {
        Employee employee = employeeRepository.findById(String.valueOf(employeeId))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
        LeaveType leaveType = leaveTypeRepository.findById(String.valueOf(leaveTypeId))
                .orElseThrow(() -> new IllegalArgumentException("Leave type not found: " + leaveTypeId));

        LeaveBalance balance = new LeaveBalance();
        balance.setEmployee(employee);
        balance.setLeaveType(leaveType);
        balance.setCycleYear(cycleYear);
        balance.setEntitledDays(leaveType.getDefaultDaysPerYear());
        balance.setTakenDays(BigDecimal.ZERO);
        balance.setPendingDays(BigDecimal.ZERO);
        balance.setCarriedForwardDays(BigDecimal.ZERO);
        balance.setAdjustmentDays(BigDecimal.ZERO);

        balance = leaveBalanceRepository.save(balance);
        logger.info("Initialized leave balance for employee {} - {} for year {}",
                employeeId, leaveType.getName(), cycleYear);
        return balance;
    }

    public void addPendingDays(Long employeeId, Long leaveTypeId, Integer cycleYear, BigDecimal days) {
        LeaveBalance balance = getOrCreateBalance(employeeId, leaveTypeId, cycleYear);
        balance.setPendingDays(balance.getPendingDays().add(days));
        leaveBalanceRepository.save(balance);
    }

    public void removePendingDays(Long employeeId, Long leaveTypeId, Integer cycleYear, BigDecimal days) {
        LeaveBalance balance = getOrCreateBalance(employeeId, leaveTypeId, cycleYear);
        balance.setPendingDays(balance.getPendingDays().subtract(days));
        leaveBalanceRepository.save(balance);
    }

    public void confirmTakenDays(Long employeeId, Long leaveTypeId, Integer cycleYear, BigDecimal days) {
        LeaveBalance balance = getOrCreateBalance(employeeId, leaveTypeId, cycleYear);
        balance.setPendingDays(balance.getPendingDays().subtract(days));
        balance.setTakenDays(balance.getTakenDays().add(days));
        leaveBalanceRepository.save(balance);
    }

    public boolean hasSufficientBalance(Long employeeId, Long leaveTypeId, Integer cycleYear, BigDecimal requestedDays) {
        LeaveBalance balance = getOrCreateBalance(employeeId, leaveTypeId, cycleYear);
        return balance.getAvailableDays().compareTo(requestedDays) >= 0;
    }

    @Scheduled(cron = "${leave.carry-forward.cron:0 0 1 1 1 ?}")
    public void processCarryForward() {
        int previousYear = LocalDate.now().getYear() - 1;
        int currentYear = LocalDate.now().getYear();

        logger.info("Processing leave carry-forward from {} to {}", previousYear, currentYear);

        List<LeaveBalance> previousBalances = leaveBalanceRepository.findByCycleYear(previousYear);
        int processed = 0;

        for (LeaveBalance prevBalance : previousBalances) {
            BigDecimal remaining = prevBalance.getAvailableDays();
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal maxCarry = prevBalance.getLeaveType().getMaxCarryForwardDays();
            if (maxCarry == null || maxCarry.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal carryAmount = remaining.min(maxCarry);

            LeaveBalance newBalance = getOrCreateBalance(
                    prevBalance.getEmployee().getId(),
                    prevBalance.getLeaveType().getId(),
                    currentYear);
            newBalance.setCarriedForwardDays(newBalance.getCarriedForwardDays().add(carryAmount));
            leaveBalanceRepository.save(newBalance);
            processed++;
        }

        logger.info("Carry-forward complete: {} balances processed", processed);
        auditLogService.logSystemAction("CARRY_FORWARD", "LEAVE_BALANCE",
                String.format("Processed %d carry-forward balances from %d to %d", processed, previousYear, currentYear));
    }
}
