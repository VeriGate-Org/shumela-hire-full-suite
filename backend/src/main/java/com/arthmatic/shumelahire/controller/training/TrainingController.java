package com.arthmatic.shumelahire.controller.training;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.training.*;
import com.arthmatic.shumelahire.service.training.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training")
@FeatureGate("TRAINING_MANAGEMENT")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','LINE_MANAGER','EMPLOYEE')")
public class TrainingController {

    private static final Logger logger = LoggerFactory.getLogger(TrainingController.class);

    @Autowired
    private TrainingCourseService courseService;

    @Autowired
    private TrainingSessionService sessionService;

    @Autowired
    private TrainingEnrollmentService enrollmentService;

    @Autowired
    private CertificationService certificationService;

    @Autowired
    private TrainingAnalyticsService analyticsService;

    // ---- Courses ----

    @GetMapping("/courses")
    public ResponseEntity<List<TrainingCourseResponse>> getCourses(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(courseService.searchCourses(search));
        }
        List<TrainingCourseResponse> courses = Boolean.TRUE.equals(activeOnly)
                ? courseService.getActive()
                : courseService.getAll();
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(courseService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/courses/categories")
    public ResponseEntity<List<String>> getCourseCategories() {
        return ResponseEntity.ok(courseService.getCategories());
    }

    @PostMapping("/courses")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createCourse(@Valid @RequestBody TrainingCourseRequest request) {
        try {
            TrainingCourseResponse response = courseService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateCourse(@PathVariable Long id,
                                          @Valid @RequestBody TrainingCourseRequest request) {
        try {
            return ResponseEntity.ok(courseService.update(id, request, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.delete(id, "SYSTEM");
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ---- Sessions ----

    @GetMapping("/sessions")
    public ResponseEntity<List<TrainingSessionResponse>> getSessions(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Boolean upcoming,
            @RequestParam(required = false) Boolean openOnly) {
        if (courseId != null) {
            return ResponseEntity.ok(sessionService.getByCourse(courseId));
        }
        if (Boolean.TRUE.equals(upcoming)) {
            return ResponseEntity.ok(sessionService.getUpcoming());
        }
        if (Boolean.TRUE.equals(openOnly)) {
            return ResponseEntity.ok(sessionService.getOpenWithSeats());
        }
        return ResponseEntity.ok(sessionService.getAll());
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<?> getSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sessionService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createSession(@Valid @RequestBody TrainingSessionRequest request) {
        try {
            TrainingSessionResponse response = sessionService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> updateSession(@PathVariable Long id,
                                           @Valid @RequestBody TrainingSessionRequest request) {
        try {
            return ResponseEntity.ok(sessionService.update(id, request, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{id}/open")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> openSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sessionService.openSession(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> closeSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sessionService.closeSession(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> cancelSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sessionService.cancelSession(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Enrollments ----

    @GetMapping("/enrollments")
    public ResponseEntity<List<TrainingEnrollmentResponse>> getEnrollments(
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) Long employeeId) {
        if (sessionId != null) {
            return ResponseEntity.ok(enrollmentService.getBySession(sessionId));
        }
        if (employeeId != null) {
            return ResponseEntity.ok(enrollmentService.getByEmployee(employeeId));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/enrollments")
    public ResponseEntity<?> enroll(@Valid @RequestBody TrainingEnrollmentRequest request) {
        try {
            TrainingEnrollmentResponse response = enrollmentService.enroll(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/enrollments/{id}/attended")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> markAttended(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(enrollmentService.markAttended(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/enrollments/{id}/completed")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> markCompleted(@PathVariable Long id,
                                           @RequestParam(required = false) BigDecimal score,
                                           @RequestParam(required = false) String certificateUrl) {
        try {
            return ResponseEntity.ok(enrollmentService.markCompleted(id, score, certificateUrl, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/enrollments/{id}/no-show")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> markNoShow(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(enrollmentService.markNoShow(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/enrollments/{id}/cancel")
    public ResponseEntity<?> cancelEnrollment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(enrollmentService.cancel(id, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Certifications ----

    @GetMapping("/certifications")
    public ResponseEntity<List<CertificationResponse>> getCertifications(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Boolean expiring,
            @RequestParam(required = false) Boolean expired) {
        if (employeeId != null) {
            return ResponseEntity.ok(certificationService.getByEmployee(employeeId));
        }
        if (Boolean.TRUE.equals(expiring)) {
            return ResponseEntity.ok(certificationService.getExpiring(30));
        }
        if (Boolean.TRUE.equals(expired)) {
            return ResponseEntity.ok(certificationService.getExpired());
        }
        return ResponseEntity.ok(certificationService.getAll());
    }

    @GetMapping("/certifications/{id}")
    public ResponseEntity<?> getCertification(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(certificationService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/certifications")
    public ResponseEntity<?> createCertification(@Valid @RequestBody CertificationRequest request) {
        try {
            CertificationResponse response = certificationService.create(request, "SYSTEM");
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/certifications/{id}")
    public ResponseEntity<?> updateCertification(@PathVariable Long id,
                                                  @Valid @RequestBody CertificationRequest request) {
        try {
            return ResponseEntity.ok(certificationService.update(id, request, "SYSTEM"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/certifications/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> revokeCertification(@PathVariable Long id) {
        try {
            certificationService.revoke(id, "SYSTEM");
            return ResponseEntity.ok(Map.of("message", "Certification revoked"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Analytics ----

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }
}
