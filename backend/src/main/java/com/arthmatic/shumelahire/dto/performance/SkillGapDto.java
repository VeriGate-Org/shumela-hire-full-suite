package com.arthmatic.shumelahire.dto.performance;

import java.util.ArrayList;
import java.util.List;

public class SkillGapDto {

    private Long competencyId;
    private String competencyName;
    private String frameworkName;
    private String category;
    private Integer currentLevel;
    private Integer targetLevel;
    private Integer gap;
    private List<RecommendedCourse> recommendedCourses = new ArrayList<>();

    public SkillGapDto() {}

    public static class RecommendedCourse {
        private Long courseId;
        private String courseTitle;

        public RecommendedCourse() {}

        public RecommendedCourse(Long courseId, String courseTitle) {
            this.courseId = courseId;
            this.courseTitle = courseTitle;
        }

        public Long getCourseId() { return courseId; }
        public void setCourseId(Long courseId) { this.courseId = courseId; }
        public String getCourseTitle() { return courseTitle; }
        public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    }

    public Long getCompetencyId() { return competencyId; }
    public void setCompetencyId(Long competencyId) { this.competencyId = competencyId; }
    public String getCompetencyName() { return competencyName; }
    public void setCompetencyName(String competencyName) { this.competencyName = competencyName; }
    public String getFrameworkName() { return frameworkName; }
    public void setFrameworkName(String frameworkName) { this.frameworkName = frameworkName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }
    public Integer getTargetLevel() { return targetLevel; }
    public void setTargetLevel(Integer targetLevel) { this.targetLevel = targetLevel; }
    public Integer getGap() { return gap; }
    public void setGap(Integer gap) { this.gap = gap; }
    public List<RecommendedCourse> getRecommendedCourses() { return recommendedCourses; }
    public void setRecommendedCourses(List<RecommendedCourse> recommendedCourses) { this.recommendedCourses = recommendedCourses; }
}
