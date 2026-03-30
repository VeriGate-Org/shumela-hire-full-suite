package com.arthmatic.shumelahire.entity.engagement;

import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDateTime;

public class Recognition extends TenantAwareEntity {

    private Long id;

    private Employee fromEmployee;

    private Employee toEmployee;

    private RecognitionCategory category;

    private String message;

    private Integer points = 0;

    private Boolean isPublic = true;

    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getFromEmployee() { return fromEmployee; }
    public void setFromEmployee(Employee fromEmployee) { this.fromEmployee = fromEmployee; }
    public Employee getToEmployee() { return toEmployee; }
    public void setToEmployee(Employee toEmployee) { this.toEmployee = toEmployee; }
    public RecognitionCategory getCategory() { return category; }
    public void setCategory(RecognitionCategory category) { this.category = category; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
