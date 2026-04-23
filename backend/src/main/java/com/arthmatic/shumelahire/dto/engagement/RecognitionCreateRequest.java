package com.arthmatic.shumelahire.dto.engagement;

public class RecognitionCreateRequest {

    private String fromEmployeeId;
    private String toEmployeeId;
    private String category;
    private String message;
    private Integer points;
    private Boolean isPublic;

    public RecognitionCreateRequest() {}

    public String getFromEmployeeId() { return fromEmployeeId; }
    public void setFromEmployeeId(String fromEmployeeId) { this.fromEmployeeId = fromEmployeeId; }
    public String getToEmployeeId() { return toEmployeeId; }
    public void setToEmployeeId(String toEmployeeId) { this.toEmployeeId = toEmployeeId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
