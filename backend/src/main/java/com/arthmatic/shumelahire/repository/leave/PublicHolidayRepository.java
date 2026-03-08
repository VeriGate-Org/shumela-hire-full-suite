package com.arthmatic.shumelahire.repository.leave;

import com.arthmatic.shumelahire.entity.leave.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, Long> {

    @Query("SELECT ph FROM PublicHoliday ph WHERE ph.holidayDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ph.holidayDate")
    List<PublicHoliday> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<PublicHoliday> findByCountryOrderByHolidayDateAsc(String country);

    boolean existsByHolidayDate(LocalDate holidayDate);
}
