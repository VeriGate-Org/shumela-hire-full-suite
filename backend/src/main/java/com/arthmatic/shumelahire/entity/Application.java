package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity(name = "TgApplication")
@Table(name = "tg_applications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "applicant_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Applicant applicant;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "job_id")
    private String jobId;

    @Column(name = "status", nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "screening_notes", columnDefinition = "TEXT")
    private String screeningNotes;

    @Column(name = "interview_feedback", columnDefinition = "TEXT")
    private String interviewFeedback;

    @Column(name = "salary_expectation")
    private Double salaryExpectation;

    @Column(name = "availability_date")
    private LocalDateTime availabilityDate;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "interviewed_at")
    private LocalDateTime interviewedAt;

    @Column(name = "offer_extended_at")
    private LocalDateTime offerExtendedAt;

    @Column(name = "response_deadline")
    private LocalDateTime responseDeadline;

    // Constructors
    public Application() {
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "SUBMITTED";
    }

    public Application(Applicant applicant, String jobTitle) {
        this();
        this.applicant = applicant;
        this.jobTitle = jobTitle;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Applicant getApplicant() {
        return applicant;
    }

    public void setApplicant(Applicant applicant) {
        this.applicant = applicant;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getScreeningNotes() {
        return screeningNotes;
    }

    public void setScreeningNotes(String screeningNotes) {
        this.screeningNotes = screeningNotes;
    }

    public String getInterviewFeedback() {
        return interviewFeedback;
    }

    public void setInterviewFeedback(String interviewFeedback) {
        this.interviewFeedback = interviewFeedback;
    }

    public Double getSalaryExpectation() {
        return salaryExpectation;
    }

    public void setSalaryExpectation(Double salaryExpectation) {
        this.salaryExpectation = salaryExpectation;
    }

    public LocalDateTime getAvailabilityDate() {
        return availabilityDate;
    }

    public void setAvailabilityDate(LocalDateTime availabilityDate) {
        this.availabilityDate = availabilityDate;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getInterviewedAt() {
        return interviewedAt;
    }

    public void setInterviewedAt(LocalDateTime interviewedAt) {
        this.interviewedAt = interviewedAt;
    }

    public LocalDateTime getOfferExtendedAt() {
        return offerExtendedAt;
    }

    public void setOfferExtendedAt(LocalDateTime offerExtendedAt) {
        this.offerExtendedAt = offerExtendedAt;
    }

    public LocalDateTime getResponseDeadline() {
        return responseDeadline;
    }

    public void setResponseDeadline(LocalDateTime responseDeadline) {
        this.responseDeadline = responseDeadline;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Application{" +
                "id=" + id +
                ", jobTitle='" + jobTitle + '\'' +
                ", status='" + status + '\'' +
                ", rating=" + rating +
                ", submittedAt=" + submittedAt +
                '}';
    }

    // Status constants
    public static final String STATUS_SUBMITTED = "SUBMITTED";
    public static final String STATUS_SCREENING = "SCREENING";
    public static final String STATUS_INTERVIEWING = "INTERVIEWING";
    public static final String STATUS_OFFERED = "OFFERED";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_WITHDRAWN = "WITHDRAWN";
}
