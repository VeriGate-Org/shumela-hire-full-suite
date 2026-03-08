package com.arthmatic.shumelahire.dto.engagement;

public class RecognitionCreateRequest {

    private Long fromEmployeeId;
    private Long toEmployeeId;
    private String category;
    private String message;
    private Integer points;
    private Boolean isPublic;

    public RecognitionCreateRequest() {}

    public Long getFromEmployeeId() { return fromEmployeeId; }
    public void setFromEmployeeId(Long fromEmployeeId) { this.fromEmployeeId = fromEmployeeId; }
    public Long getToEmployeeId() { return toEmployeeId; }
    public void setToEmployeeId(Long toEmployeeId) { this.toEmployeeId = toEmployeeId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
