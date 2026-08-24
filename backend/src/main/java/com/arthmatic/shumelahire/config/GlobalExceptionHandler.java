package com.arthmatic.shumelahire.config;

import com.arthmatic.shumelahire.exception.FeatureNotEnabledException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(FeatureNotEnabledException.class)
    public ResponseEntity<Map<String, Object>> handleFeatureNotEnabled(FeatureNotEnabledException ex) {
        logger.warn("Feature not enabled: {}", ex.getFeatureCode());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Feature not available",
                "message", "The feature '" + ex.getFeatureCode() + "' is not enabled for your plan",
                "featureCode", ex.getFeatureCode(),
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad request",
                "message", ex.getMessage(),
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * A refused business rule is an answer, not a server fault.
     *
     * <p>{@link IllegalStateException} is what the domain throws when an operation is legitimate but
     * the current state forbids it — a pipeline transition that would skip a mandatory verification
     * check, a candidate already at the final stage. Like {@link MultipartException} below, it is a
     * {@code RuntimeException}, so without this it fell into the catch-all and came back as a
     * {@code 500}: the caller was told the server had broken when in fact the server had just
     * enforced a rule, and the reason never reached the screen.</p>
     *
     * <p>Endpoints that already catch it locally and return their own body keep doing so; this is
     * the backstop for the ones that do not.</p>
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        logger.warn("Refused by a business rule: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Not permitted in the current state",
                "message", ex.getMessage() != null ? ex.getMessage() : "The current state does not permit this action",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * A malformed upload is the caller's mistake, not ours.
     *
     * <p>{@link MultipartException} is a {@code RuntimeException}, so without this it fell into the
     * catch-all below and every bad upload came back as a 500 — telling the client to retry
     * something that will never succeed, and putting a false error on our own dashboards. Seen on
     * {@code /api/cv/upload}, which answered {@code 500 "Current request is not a multipart
     * request"} to a plain JSON POST.</p>
     *
     * <p>Also covers the size limit: exceeding it raises {@link MaxUploadSizeExceededException},
     * a subclass, which deserves the same treatment for the same reason.</p>
     */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipart(MultipartException ex) {
        boolean tooLarge = ex instanceof MaxUploadSizeExceededException;
        logger.warn("Rejected upload: {}", ex.getMessage());
        return ResponseEntity.status(tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST).body(Map.of(
                "error", tooLarge ? "File too large" : "Invalid upload",
                "message", tooLarge
                        ? "The file exceeds the maximum upload size."
                        : "This endpoint expects a file upload (multipart/form-data).",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * A refusal is not a fault.
     *
     * <p>{@link AccessDeniedException} is a {@code RuntimeException}, so without this every
     * method-level {@code @PreAuthorize} denial fell into the catch-all below and came back as
     * {@code 500 "Access Denied"} — a server error for something the server decided on purpose.
     * Clients cannot distinguish "you may not" from "we broke", retries are pointless, and genuine
     * faults get buried under authorisation noise on the dashboards.</p>
     *
     * <p>Seen on {@code /api/ai/salary-benchmark/analyze}, which is restricted to ADMIN and
     * HR_MANAGER: a hiring manager calling it received a 500 rather than a 403.</p>
     *
     * <p>The body deliberately does not name the roles required. Telling a caller which role would
     * have worked maps out the authorisation model for anyone probing it.</p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Forbidden",
                "message", "You do not have permission to perform this action.",
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        logger.error("Unhandled error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal server error",
                "message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
