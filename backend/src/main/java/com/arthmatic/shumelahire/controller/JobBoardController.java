package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.BatchPostRequest;
import com.arthmatic.shumelahire.dto.JobBoardPostRequest;
import com.arthmatic.shumelahire.entity.JobBoardPosting;
import com.arthmatic.shumelahire.entity.JobBoardType;
import com.arthmatic.shumelahire.service.JobBoardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/job-boards")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class JobBoardController {

    private final JobBoardService jobBoardService;

    @Autowired
    public JobBoardController(JobBoardService jobBoardService) {
        this.jobBoardService = jobBoardService;
    }

    @PostMapping("/postings")
    public ResponseEntity<?> createPosting(@Valid @RequestBody JobBoardPostRequest request) {
        try {
            JobBoardPosting posting = jobBoardService.postToBoard(
                    request.getJobPostingId(), request.getBoardType(), request.getBoardConfig());
            return ResponseEntity.status(HttpStatus.CREATED).body(posting);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to post to board: " + e.getMessage()));
        }
    }

    @PostMapping("/postings/batch")
    public ResponseEntity<?> batchPost(@Valid @RequestBody BatchPostRequest request) {
        try {
            var results = jobBoardService.postToMultipleBoards(
                    request.getJobPostingId(), request.getBoards());
            return ResponseEntity.status(HttpStatus.CREATED).body(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Batch posting failed: " + e.getMessage()));
        }
    }

    @PostMapping("/postings/{id}/sync")
    public ResponseEntity<?> syncPosting(@PathVariable String id) {
        try {
            return ResponseEntity.ok(jobBoardService.syncPosting(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/postings/{id}")
    public ResponseEntity<?> removePosting(@PathVariable String id) {
        try {
            return ResponseEntity.ok(jobBoardService.removePosting(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/postings/job/{jobId}")
    public ResponseEntity<List<JobBoardPosting>> getPostingsByJob(@PathVariable String jobId) {
        return ResponseEntity.ok(jobBoardService.getPostingsByJob(jobId));
    }

    @GetMapping("/available-boards")
    public ResponseEntity<List<Map<String, Object>>> getAvailableBoards() {
        return ResponseEntity.ok(jobBoardService.getAvailableBoards());
    }
}
