package com.arthmatic.shumelahire.service.attendance;

import com.arthmatic.shumelahire.entity.attendance.Shift;
import com.arthmatic.shumelahire.repository.ShiftDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class ShiftService {

    private static final Logger logger = LoggerFactory.getLogger(ShiftService.class);

    @Autowired
    private ShiftDataRepository shiftRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Shift create(String name, String code, LocalTime startTime, LocalTime endTime,
                        Integer breakMinutes, String colorCode, String userId) {
        if (shiftRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Shift code already exists: " + code);
        }

        Shift shift = new Shift();
        shift.setName(name);
        shift.setCode(code);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift.setBreakMinutes(breakMinutes != null ? breakMinutes : 0);
        if (colorCode != null) shift.setColorCode(colorCode);
        shift = shiftRepository.save(shift);

        auditLogService.saveLog(userId, "CREATE", "SHIFT", shift.getId().toString(), "Created shift: " + name);
        logger.info("Shift created: {} ({}-{})", name, startTime, endTime);
        return shift;
    }

    @Transactional(readOnly = true)
    public List<Shift> getAll() {
        return shiftRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Shift> getActive() {
        return shiftRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public Shift getById(Long id) {
        return shiftRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Shift not found: " + id));
    }
}
