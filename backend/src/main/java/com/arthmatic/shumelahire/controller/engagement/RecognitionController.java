package com.arthmatic.shumelahire.controller.engagement;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.engagement.RecognitionCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.RecognitionResponse;
import com.arthmatic.shumelahire.service.engagement.RecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/engagement/recognitions")
@FeatureGate("RECOGNITION_REWARDS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
public class RecognitionController {

    @Autowired
    private RecognitionService recognitionService;

    @PostMapping
    public ResponseEntity<?> giveRecognition(@RequestBody RecognitionCreateRequest request) {
        try {
            RecognitionResponse recognition = recognitionService.giveRecognition(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(recognition);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/received")
    public ResponseEntity<Page<RecognitionResponse>> getRecognitionsFor(
            @RequestParam Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recognitionService.getRecognitionsFor(employeeId, PageRequest.of(page, size)));
    }

    @GetMapping("/given")
    public ResponseEntity<Page<RecognitionResponse>> getRecognitionsFrom(
            @RequestParam Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recognitionService.getRecognitionsFrom(employeeId, PageRequest.of(page, size)));
    }

    @GetMapping("/public")
    public ResponseEntity<Page<RecognitionResponse>> getPublicRecognitions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recognitionService.getPublicRecognitions(PageRequest.of(page, size)));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(recognitionService.getLeaderboard(limit));
    }
}
