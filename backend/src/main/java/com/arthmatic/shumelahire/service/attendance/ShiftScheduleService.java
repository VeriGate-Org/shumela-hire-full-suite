package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;
import com.arthmatic.shumelahire.entity.attendance.ShiftScheduleStatus;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.ShiftDataRepository;
import com.arthmatic.shumelahire.repository.ShiftScheduleDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ShiftScheduleService {

  private static final Logger logger = LoggerFactory.getLogger(ShiftScheduleService.class);

  @Autowired private ShiftScheduleDataRepository shiftScheduleRepository;

  @Autowired private ShiftDataRepository shiftRepository;

  @Autowired private EmployeeDataRepository employeeRepository;

  @Autowired private UserDataRepository userRepository;

  @Autowired private AuditLogService auditLogService;

  public ShiftSchedule assign(String employeeId, String shiftId, LocalDate date, String userId) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
    validateManagerAccess(employee);
    Shift shift =
        shiftRepository
            .findById(shiftId)
            .orElseThrow(() -> new IllegalArgumentException("Shift not found: " + shiftId));

    ShiftSchedule schedule = new ShiftSchedule();
    schedule.setEmployee(employee);
    schedule.setShift(shift);
    schedule.setScheduleDate(date);
    schedule.setStatus(ShiftScheduleStatus.SCHEDULED);
    schedule = shiftScheduleRepository.save(schedule);

    auditLogService.saveLog(
        userId,
        "ASSIGN",
        "SHIFT_SCHEDULE",
        schedule.getId().toString(),
        "Assigned " + employee.getFullName() + " to " + shift.getName() + " on " + date);
    return schedule;
  }

  @Transactional(readOnly = true)
  public List<ShiftSchedule> getByEmployeeAndDateRange(
      String employeeId, LocalDate start, LocalDate end) {
    return shiftScheduleRepository.findByEmployeeIdAndScheduleDateBetween(employeeId, start, end);
  }

  @Transactional(readOnly = true)
  public List<ShiftSchedule> getByDateRange(LocalDate start, LocalDate end) {
    return shiftScheduleRepository.findByDateRange(start, end);
  }

  @Transactional(readOnly = true)
  public List<ShiftSchedule> getByDepartment(String department, LocalDate start, LocalDate end) {
    return shiftScheduleRepository.findByDepartmentAndDateRange(department, start, end);
  }

  public void swapSchedules(String scheduleId1, String scheduleId2) {
    ShiftSchedule s1 =
        shiftScheduleRepository
            .findById(scheduleId1)
            .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId1));
    ShiftSchedule s2 =
        shiftScheduleRepository
            .findById(scheduleId2)
            .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId2));

    validateManagerAccess(s1.getEmployee());
    validateManagerAccess(s2.getEmployee());

    // Swap employees
    Employee temp = s1.getEmployee();
    s1.setEmployee(s2.getEmployee());
    s2.setEmployee(temp);

    shiftScheduleRepository.save(s1);
    shiftScheduleRepository.save(s2);

    auditLogService.saveLog(
        "SYSTEM",
        "SWAP",
        "SHIFT_SCHEDULE",
        s1.getId() + "<->" + s2.getId(),
        "Swapped shift schedules");
    logger.info("Swapped shift schedules {} and {}", scheduleId1, scheduleId2);
  }

  /**
   * For LINE_MANAGER (and only LINE_MANAGER), the target employee must be a direct
   * report. ADMIN/HR_MANAGER bypass this check.
   */
  private void validateManagerAccess(Employee target) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return;

    boolean isLineManager =
        auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_LINE_MANAGER"));
    boolean isAdminOrHr =
        auth.getAuthorities().stream()
            .anyMatch(
                a ->
                    a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_HR_MANAGER"));

    if (!isLineManager || isAdminOrHr) return;

    if (target == null) {
      throw new AccessDeniedException("Cannot validate access: missing employee");
    }

    String callerEmployeeId =
        userRepository
            .findByUsername(auth.getName())
            .map(u -> u.getEmail())
            .flatMap(employeeRepository::findByEmail)
            .map(Employee::getId)
            .orElse(null);

    if (callerEmployeeId == null
        || target.getReportingManager() == null
        || !callerEmployeeId.equals(target.getReportingManager().getId())) {
      throw new AccessDeniedException(
          "You can only schedule shifts for your direct reports");
    }
  }
}
