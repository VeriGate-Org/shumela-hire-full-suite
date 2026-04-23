package com.arthmatic.shumelahire.dto.engagement;

import com.arthmatic.shumelahire.entity.engagement.Recognition;

import java.time.LocalDateTime;

public class RecognitionResponse {

    private String id;
    private String fromEmployeeId;
    private String fromEmployeeName;
    private String toEmployeeId;
    private String toEmployeeName;
    private String category;
    private String message;
    private Integer points;
    private Boolean isPublic;
    private LocalDateTime createdAt;

    public RecognitionResponse() {}

    public static RecognitionResponse fromEntity(Recognition entity) {
        RecognitionResponse r = new RecognitionResponse();
        r.id = entity.getId();
        r.fromEmployeeId = entity.getFromEmployee() != null ? entity.getFromEmployee().getId() : null;
        r.fromEmployeeName = entity.getFromEmployee() != null ?
                entity.getFromEmployee().getFirstName() + " " + entity.getFromEmployee().getLastName() : null;
        r.toEmployeeId = entity.getToEmployee() != null ? entity.getToEmployee().getId() : null;
        r.toEmployeeName = entity.getToEmployee() != null ?
                entity.getToEmployee().getFirstName() + " " + entity.getToEmployee().getLastName() : null;
        r.category = entity.getCategory() != null ? entity.getCategory().name() : null;
        r.message = entity.getMessage();
        r.points = entity.getPoints();
        r.isPublic = entity.getIsPublic();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFromEmployeeId() { return fromEmployeeId; }
    public void setFromEmployeeId(String fromEmployeeId) { this.fromEmployeeId = fromEmployeeId; }
    public String getFromEmployeeName() { return fromEmployeeName; }
    public void setFromEmployeeName(String fromEmployeeName) { this.fromEmployeeName = fromEmployeeName; }
    public String getToEmployeeId() { return toEmployeeId; }
    public void setToEmployeeId(String toEmployeeId) { this.toEmployeeId = toEmployeeId; }
    public String getToEmployeeName() { return toEmployeeName; }
    public void setToEmployeeName(String toEmployeeName) { this.toEmployeeName = toEmployeeName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
