package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.ScreeningAnswer;
import com.arthmatic.shumelahire.entity.ScreeningQuestion;
import com.arthmatic.shumelahire.service.ScreeningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/screening")
public class ScreeningController {

    private static final Logger logger = LoggerFactory.getLogger(ScreeningController.class);

    private final ScreeningService screeningService;

    public ScreeningController(ScreeningService screeningService) {
        this.screeningService = screeningService;
    }

    // --- Question endpoints ---

    @GetMapping("/questions/job-posting/{jobPostingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> getQuestionsByJobPosting(@PathVariable String jobPostingId) {
        try {
            List<ScreeningQuestion> questions = screeningService.getQuestionsByJobPosting(jobPostingId);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("Error fetching screening questions for job posting {}", jobPostingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to load screening questions"));
        }
    }

    @PostMapping("/questions")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> createQuestion(@RequestBody ScreeningQuestion question, Authentication authentication) {
        try {
            question.setCreatedBy(authentication.getName());
            ScreeningQuestion created = screeningService.createQuestion(question);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating screening question", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create screening question"));
        }
    }

    @PutMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> updateQuestion(@PathVariable String id, @RequestBody ScreeningQuestion question) {
        try {
            ScreeningQuestion updated = screeningService.updateQuestion(id, question);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating screening question {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update screening question"));
        }
    }

    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> deleteQuestion(@PathVariable String id) {
        try {
            screeningService.deleteQuestion(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting screening question {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete screening question"));
        }
    }

    // --- Answer endpoints ---

    @GetMapping("/answers/application/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> getAnswersByApplication(@PathVariable String applicationId) {
        try {
            List<ScreeningAnswer> answers = screeningService.getAnswersByApplication(applicationId);
            return ResponseEntity.ok(answers);
        } catch (Exception e) {
            logger.error("Error fetching screening answers for application {}", applicationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to load screening answers"));
        }
    }

    @PostMapping("/answers")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> saveAnswer(@RequestBody Map<String, Object> request) {
        try {
            String applicationId = request.get("applicationId").toString();
            String questionId = request.get("questionId").toString();
            String answerValue = request.get("answerValue") != null ? request.get("answerValue").toString() : null;
            String answerFileUrl = request.get("answerFileUrl") != null ? request.get("answerFileUrl").toString() : null;
            String answerFileName = request.get("answerFileName") != null ? request.get("answerFileName").toString() : null;

            ScreeningAnswer saved = screeningService.saveAnswer(applicationId, questionId, answerValue, answerFileUrl, answerFileName);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error saving screening answer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to save screening answer"));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/answers/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> saveBulkAnswers(@RequestBody Map<String, Object> request) {
        try {
            String applicationId = request.get("applicationId").toString();
            List<Map<String, Object>> answersList = (List<Map<String, Object>>) request.get("answers");

            for (Map<String, Object> answerData : answersList) {
                String questionId = answerData.get("questionId").toString();
                String answerValue = answerData.get("answerValue") != null ? answerData.get("answerValue").toString() : null;
                String answerFileUrl = answerData.get("answerFileUrl") != null ? answerData.get("answerFileUrl").toString() : null;
                String answerFileName = answerData.get("answerFileName") != null ? answerData.get("answerFileName").toString() : null;

                screeningService.saveAnswer(applicationId, questionId, answerValue, answerFileUrl, answerFileName);
            }

            return ResponseEntity.ok(Map.of("message", "Answers saved successfully", "applicationId", applicationId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error saving bulk screening answers", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to save screening answers"));
        }
    }

    @GetMapping("/answers/validate/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> validateAnswers(@PathVariable String applicationId) {
        try {
            boolean isValid = screeningService.validateApplicationAnswers(applicationId);
            String summary = screeningService.getValidationSummary(applicationId);
            return ResponseEntity.ok(Map.of("valid", isValid, "summary", summary));
        } catch (Exception e) {
            logger.error("Error validating screening answers for application {}", applicationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to validate screening answers"));
        }
    }
}
