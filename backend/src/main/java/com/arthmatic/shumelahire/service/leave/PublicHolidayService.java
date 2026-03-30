package com.arthmatic.shumelahire.service.leave;

import com.arthmatic.shumelahire.dto.leave.PublicHolidayRequest;
import com.arthmatic.shumelahire.dto.leave.PublicHolidayResponse;
import com.arthmatic.shumelahire.entity.leave.PublicHoliday;
import com.arthmatic.shumelahire.repository.PublicHolidayDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PublicHolidayService {

    private static final Logger logger = LoggerFactory.getLogger(PublicHolidayService.class);

    @Autowired
    private PublicHolidayDataRepository publicHolidayRepository;

    @Autowired
    private AuditLogService auditLogService;

    public PublicHolidayResponse create(PublicHolidayRequest request, String userId) {
        PublicHoliday holiday = new PublicHoliday();
        holiday.setName(request.getName());
        holiday.setHolidayDate(request.getHolidayDate());
        holiday.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false);
        holiday.setCountry(request.getCountry() != null ? request.getCountry() : "ZA");

        holiday = publicHolidayRepository.save(holiday);

        auditLogService.saveLog(userId, "CREATE", "PUBLIC_HOLIDAY",
                holiday.getId().toString(), "Created public holiday: " + holiday.getName());

        logger.info("Public holiday created: {} on {}", holiday.getName(), holiday.getHolidayDate());
        return PublicHolidayResponse.fromEntity(holiday);
    }

    @Transactional(readOnly = true)
    public List<PublicHolidayResponse> getAll() {
        return publicHolidayRepository.findAll().stream()
                .map(PublicHolidayResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PublicHolidayResponse> getByDateRange(LocalDate startDate, LocalDate endDate) {
        return publicHolidayRepository.findByDateRange(startDate, endDate).stream()
                .map(PublicHolidayResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isPublicHoliday(LocalDate date) {
        return publicHolidayRepository.existsByHolidayDate(date);
    }

    public void delete(Long id, String userId) {
        PublicHoliday holiday = publicHolidayRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Public holiday not found: " + id));

        publicHolidayRepository.deleteById(String.valueOf(holiday.getId()));

        auditLogService.saveLog(userId, "DELETE", "PUBLIC_HOLIDAY",
                id.toString(), "Deleted public holiday: " + holiday.getName());
    }
}
