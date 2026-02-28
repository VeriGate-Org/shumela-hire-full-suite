package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.dto.JobPostingResponse;
import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import com.arthmatic.shumelahire.service.JobPostingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/job-postings")
public class PublicJobPostingController {

    private static final Logger logger = LoggerFactory.getLogger(PublicJobPostingController.class);

    private final JobPostingService jobPostingService;

    public PublicJobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    /**
     * Get published jobs for public viewing
     * GET /api/public/job-postings/published
     */
    @GetMapping("/published")
    public ResponseEntity<?> getPublishedJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<JobPostingResponse> results = jobPostingService.getPublishedJobs(pageable)
                    .map(JobPostingResponse::toPublicView);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error getting published jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get job posting by slug (public view, increments view count)
     * GET /api/public/job-postings/slug/{slug}
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getJobPostingBySlug(@PathVariable String slug) {
        try {
            JobPostingResponse response = jobPostingService.getJobPostingBySlug(slug);
            return ResponseEntity.ok(response.toPublicView());
        } catch (IllegalArgumentException e) {
            logger.warn("Job posting not found with slug: {}", slug);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting job posting by slug {}", slug, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get featured published jobs
     * GET /api/public/job-postings/featured
     */
    @GetMapping("/featured")
    public ResponseEntity<?> getFeaturedJobs() {
        try {
            return ResponseEntity.ok(
                    jobPostingService.getFeaturedJobs().stream()
                            .map(JobPostingResponse::toPublicView)
                            .toList()
            );
        } catch (Exception e) {
            logger.error("Error getting featured jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Search published job postings (status forced to PUBLISHED)
     * GET /api/public/job-postings/search
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchPublishedJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) EmploymentType employmentType,
            @RequestParam(required = false) ExperienceLevel experienceLevel,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Boolean remoteWork,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<JobPostingResponse> results = jobPostingService.searchJobPostingsWithFilters(
                    search, department, employmentType, experienceLevel,
                    location, remoteWork, JobPostingStatus.PUBLISHED, pageable)
                    .map(JobPostingResponse::toPublicView);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching published job postings", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }
}
