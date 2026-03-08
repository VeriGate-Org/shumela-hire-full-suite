package com.arthmatic.shumelahire.dto.performance;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class TrainingRecommendationDto {

    private Long courseId;
    private String courseTitle;
    private String category;
    private String deliveryMethod;
    private BigDecimal durationHours;
    private List<String> matchingCompetencies = new ArrayList<>();

    public TrainingRecommendationDto() {}

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDeliveryMethod() { return deliveryMethod; }
    public void setDeliveryMethod(String deliveryMethod) { this.deliveryMethod = deliveryMethod; }
    public BigDecimal getDurationHours() { return durationHours; }
    public void setDurationHours(BigDecimal durationHours) { this.durationHours = durationHours; }
    public List<String> getMatchingCompetencies() { return matchingCompetencies; }
    public void setMatchingCompetencies(List<String> matchingCompetencies) { this.matchingCompetencies = matchingCompetencies; }
}
