package com.arthmatic.shumelahire.dto.leave;

import com.arthmatic.shumelahire.entity.leave.PublicHoliday;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PublicHolidayResponse {

    private String id;
    private String name;
    private LocalDate holidayDate;
    private Boolean isRecurring;
    private String country;
    private LocalDateTime createdAt;

    public PublicHolidayResponse() {}

    public static PublicHolidayResponse fromEntity(PublicHoliday entity) {
        PublicHolidayResponse r = new PublicHolidayResponse();
        r.id = entity.getId();
        r.name = entity.getName();
        r.holidayDate = entity.getHolidayDate();
        r.isRecurring = entity.getIsRecurring();
        r.country = entity.getCountry();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getHolidayDate() { return holidayDate; }
    public void setHolidayDate(LocalDate holidayDate) { this.holidayDate = holidayDate; }

    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
