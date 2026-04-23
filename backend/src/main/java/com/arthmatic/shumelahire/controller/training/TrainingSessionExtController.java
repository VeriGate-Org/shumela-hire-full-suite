package com.arthmatic.shumelahire.controller.training;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.training.TrainingAttendance;
import com.arthmatic.shumelahire.entity.training.TrainingEvaluation;
import com.arthmatic.shumelahire.repository.TrainingAttendanceDataRepository;
import com.arthmatic.shumelahire.repository.TrainingEvaluationDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training/sessions")
@FeatureGate("TRAINING_MANAGEMENT")
public class TrainingSessionExtController {

    private static final Logger logger = LoggerFactory.getLogger(TrainingSessionExtController.class);

    @Autowired
    private TrainingAttendanceDataRepository attendanceRepository;

    @Autowired
    private TrainingEvaluationDataRepository evaluationRepository;

    // ---- Attendance ----

    @GetMapping("/{sessionId}/attendance")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> getAttendance(@PathVariable String sessionId) {
        return ResponseEntity.ok(attendanceRepository.findBySessionId(sessionId));
    }

    @PostMapping("/{sessionId}/attendance")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> recordAttendance(@PathVariable String sessionId,
                                              @RequestBody List<TrainingAttendance> records) {
        try {
            for (TrainingAttendance record : records) {
                record.setSessionId(sessionId);
                if (record.getAttended() && record.getCheckInTime() == null) {
                    record.setCheckInTime(LocalDateTime.now());
                }
            }
            List<TrainingAttendance> saved = attendanceRepository.saveAll(records);
            logger.info("Recorded attendance for session {} ({} records)", sessionId, saved.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}/attendance/{attendanceId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateAttendance(@PathVariable String sessionId,
                                              @PathVariable String attendanceId,
                                              @RequestBody Map<String, Object> request) {
        try {
            TrainingAttendance attendance = attendanceRepository.findById(attendanceId)
                    .orElseThrow(() -> new IllegalArgumentException("Attendance record not found: " + attendanceId));
            if (request.containsKey("attended")) {
                attendance.setAttended((Boolean) request.get("attended"));
                if (attendance.getAttended() && attendance.getCheckInTime() == null) {
                    attendance.setCheckInTime(LocalDateTime.now());
                }
            }
            if (request.containsKey("notes")) {
                attendance.setNotes((String) request.get("notes"));
            }
            return ResponseEntity.ok(attendanceRepository.save(attendance));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Evaluations ----

    @GetMapping("/{sessionId}/evaluations")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER')")
    public ResponseEntity<?> getEvaluations(@PathVariable String sessionId) {
        return ResponseEntity.ok(evaluationRepository.findBySessionId(sessionId));
    }

    @PostMapping("/{sessionId}/evaluations")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
    public ResponseEntity<?> submitEvaluation(@PathVariable String sessionId,
                                              @RequestBody TrainingEvaluation evaluation) {
        try {
            evaluation.setSessionId(sessionId);
            // Check for existing evaluation
            evaluationRepository.findBySessionIdAndEmployeeId(
                    sessionId, evaluation.getEmployeeId()
            ).ifPresent(existing -> {
                throw new IllegalArgumentException("Evaluation already submitted for this session");
            });
            TrainingEvaluation saved = evaluationRepository.save(evaluation);
            logger.info("Employee {} submitted evaluation for session {}", evaluation.getEmployeeId(), sessionId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{sessionId}/evaluations/summary")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> getEvaluationSummary(@PathVariable String sessionId) {
        List<TrainingEvaluation> evals = evaluationRepository.findBySessionId(sessionId);
        if (evals.isEmpty()) {
            return ResponseEntity.ok(Map.of("count", 0, "averageOverall", 0));
        }
        double avgOverall = evals.stream().mapToInt(TrainingEvaluation::getOverallRating).average().orElse(0);
        double avgContent = evals.stream().filter(e -> e.getContentRating() != null)
                .mapToInt(TrainingEvaluation::getContentRating).average().orElse(0);
        double avgInstructor = evals.stream().filter(e -> e.getInstructorRating() != null)
                .mapToInt(TrainingEvaluation::getInstructorRating).average().orElse(0);
        double avgRelevance = evals.stream().filter(e -> e.getRelevanceRating() != null)
                .mapToInt(TrainingEvaluation::getRelevanceRating).average().orElse(0);
        return ResponseEntity.ok(Map.of(
                "count", evals.size(),
                "averageOverall", Math.round(avgOverall * 10) / 10.0,
                "averageContent", Math.round(avgContent * 10) / 10.0,
                "averageInstructor", Math.round(avgInstructor * 10) / 10.0,
                "averageRelevance", Math.round(avgRelevance * 10) / 10.0
        ));
    }
}
