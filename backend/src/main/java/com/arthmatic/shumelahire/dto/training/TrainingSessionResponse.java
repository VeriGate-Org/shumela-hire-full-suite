package com.arthmatic.shumelahire.dto.training;

import com.arthmatic.shumelahire.entity.training.TrainingSession;

import java.time.LocalDateTime;

public class TrainingSessionResponse {

    private String id;
    private String courseId;
    private String courseTitle;
    private String courseCode;
    private String trainerName;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private Integer availableSeats;
    private int enrollmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TrainingSessionResponse() {}

    public static TrainingSessionResponse fromEntity(TrainingSession entity) {
        TrainingSessionResponse r = new TrainingSessionResponse();
        r.id = entity.getId();
        r.courseId = entity.getCourse() != null ? entity.getCourse().getId() : null;
        r.courseTitle = entity.getCourse() != null ? entity.getCourse().getTitle() : null;
        r.courseCode = entity.getCourse() != null ? entity.getCourse().getCode() : null;
        r.trainerName = entity.getTrainerName();
        r.location = entity.getLocation();
        r.startDate = entity.getStartDate();
        r.endDate = entity.getEndDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.availableSeats = entity.getAvailableSeats();
        r.enrollmentCount = entity.getEnrollments() != null ? entity.getEnrollments().size() : 0;
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getTrainerName() { return trainerName; }
    public void setTrainerName(String trainerName) { this.trainerName = trainerName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(Integer availableSeats) { this.availableSeats = availableSeats; }

    public int getEnrollmentCount() { return enrollmentCount; }
    public void setEnrollmentCount(int enrollmentCount) { this.enrollmentCount = enrollmentCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
