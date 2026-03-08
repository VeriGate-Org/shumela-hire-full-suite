package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.LeaveCalendarEntry;
import com.arthmatic.shumelahire.entity.leave.LeaveRequest;
import com.arthmatic.shumelahire.repository.leave.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeaveCalendarService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    public List<LeaveCalendarEntry> getCalendarEntries(LocalDate startDate, LocalDate endDate, String department) {
        List<LeaveRequest> requests;
        if (department != null && !department.isBlank()) {
            requests = leaveRequestRepository.findByDepartmentAndDateRange(department, startDate, endDate);
        } else {
            requests = leaveRequestRepository.findOverlapping(startDate, endDate);
        }

        return requests.stream()
                .map(r -> new LeaveCalendarEntry(
                        r.getId(),
                        r.getEmployee().getFullName(),
                        r.getEmployee().getDepartment(),
                        r.getLeaveType().getName(),
                        r.getLeaveType().getColorCode(),
                        r.getStartDate(),
                        r.getEndDate(),
                        r.getStatus().name()))
                .collect(Collectors.toList());
    }
}
