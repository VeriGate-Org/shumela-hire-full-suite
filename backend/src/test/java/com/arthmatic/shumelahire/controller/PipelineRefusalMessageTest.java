package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.service.PipelineService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Covers what the caller is told when the pipeline refuses a transition.
 *
 * <p>The rules themselves worked: {@code PipelineService} blocks a move that would skip a mandatory
 * verification check and explains why in the exception message. The controller then threw that
 * message away — {@code ResponseEntity.badRequest().build()} sends an empty body — so the pipeline
 * board could only report {@code "Failed to move candidate: HTTP 400"}. A governance control that
 * presents as an unexplained error is indistinguishable from a bug, and reads as one to anybody
 * watching a demonstration.</p>
 *
 * <p>These assert the body, not the status. The status was always right.</p>
 */
@ExtendWith(MockitoExtension.class)
class PipelineRefusalMessageTest {

    private static final String BLOCKED =
            "Cannot progress past Background Check stage. The following required verification checks "
            + "are not completed with CLEAR result: CRIMINAL_RECORD, QUALIFICATION";

    @Mock
    private PipelineService pipelineService;

    @InjectMocks
    private PipelineController pipelineController;

    @Test
    @DisplayName("a refused move returns the reason, not an empty 400")
    void refusedMoveCarriesTheReason() {
        when(pipelineService.moveApplicationToStage(anyString(), any(PipelineStage.class), any(), any(), anyString()))
                .thenThrow(new IllegalStateException(BLOCKED));

        ResponseEntity<?> response = pipelineController.moveApplicationToStage(
                "app-1", PipelineStage.OFFER_PREPARATION, null, null, "1");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody(), "an empty body is the defect: the caller can only report the status code");
        ErrorResponse body = assertInstanceOf(ErrorResponse.class, response.getBody());
        assertEquals(BLOCKED, body.getMessage());
    }

    @Test
    @DisplayName("progress-to-next carries the reason too — it is the button the board actually uses")
    void refusedProgressCarriesTheReason() {
        when(pipelineService.progressToNextStage(anyString(), any(), any(), anyString()))
                .thenThrow(new IllegalStateException(BLOCKED));

        ResponseEntity<?> response = pipelineController.progressToNextStage("app-1", null, null, "1");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = assertInstanceOf(ErrorResponse.class, response.getBody());
        assertEquals(BLOCKED, body.getMessage());
    }

    /**
     * Reject and withdraw did not catch {@link IllegalStateException} at all, so it reached the
     * catch-all handler and came back as a {@code 500} — the server reporting itself broken for
     * having correctly enforced a rule.
     */
    @Test
    @DisplayName("a refused rejection is a 400 with a reason, not a 500")
    void refusedRejectionIsNotAServerError() {
        when(pipelineService.rejectApplication(anyString(), any(PipelineStage.class), anyString(), any(), anyString()))
                .thenThrow(new IllegalStateException("Cannot move application from HIRED to REJECTED"));

        ResponseEntity<?> response = pipelineController.rejectApplication(
                "app-1", PipelineStage.REJECTED, "not proceeding", null, "1");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ErrorResponse body = assertInstanceOf(ErrorResponse.class, response.getBody());
        assertEquals("Cannot move application from HIRED to REJECTED", body.getMessage());
    }
}
