package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.entity.leave.PublicHoliday;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PublicHolidayDataRepository {
    Optional<PublicHoliday> findById(String id);
    PublicHoliday save(PublicHoliday entity);
    List<PublicHoliday> findAll();
    void deleteById(String id);
    boolean existsById(String id);
    List<PublicHoliday> findByDateRange(LocalDate startDate, LocalDate endDate);
    List<PublicHoliday> findByCountryOrderByHolidayDateAsc(String country);
    boolean existsByHolidayDate(LocalDate holidayDate);
}
