package com.arthmatic.shumelahire.controller.engagement;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.engagement.RecognitionCreateRequest;
import com.arthmatic.shumelahire.dto.engagement.RecognitionResponse;
import com.arthmatic.shumelahire.service.engagement.RecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/engagement/recognitions")
@FeatureGate("RECOGNITION_REWARDS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
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
    public ResponseEntity<List<RecognitionResponse>> getRecognitionsFor(
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(recognitionService.getRecognitionsFor(employeeId));
    }

    @GetMapping("/given")
    public ResponseEntity<List<RecognitionResponse>> getRecognitionsFrom(
            @RequestParam Long employeeId) {
        return ResponseEntity.ok(recognitionService.getRecognitionsFrom(employeeId));
    }

    @GetMapping("/public")
    public ResponseEntity<List<RecognitionResponse>> getPublicRecognitions() {
        return ResponseEntity.ok(recognitionService.getPublicRecognitions());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(recognitionService.getLeaderboard(limit));
    }
}
