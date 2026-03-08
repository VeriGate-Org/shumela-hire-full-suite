package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.entity.attendance.ShiftSchedule;
import com.arthmatic.shumelahire.entity.attendance.ShiftScheduleStatus;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.attendance.ShiftRepository;
import com.arthmatic.shumelahire.repository.attendance.ShiftScheduleRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ShiftScheduleService {

  private static final Logger logger = LoggerFactory.getLogger(ShiftScheduleService.class);

  @Autowired private ShiftScheduleRepository shiftScheduleRepository;

  @Autowired private ShiftRepository shiftRepository;

  @Autowired private EmployeeRepository employeeRepository;

  @Autowired private AuditLogService auditLogService;

  public ShiftSchedule assign(Long employeeId, Long shiftId, LocalDate date, String userId) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));
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
      Long employeeId, LocalDate start, LocalDate end) {
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

  public void swapSchedules(Long scheduleId1, Long scheduleId2) {
    ShiftSchedule s1 =
        shiftScheduleRepository
            .findById(scheduleId1)
            .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId1));
    ShiftSchedule s2 =
        shiftScheduleRepository
            .findById(scheduleId2)
            .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId2));

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
}
