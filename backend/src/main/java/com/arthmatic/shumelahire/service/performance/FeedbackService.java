package com.arthmatic.shumelahire.service.performance;

import com.arthmatic.shumelahire.dto.performance.*;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.performance.*;
import com.arthmatic.shumelahire.repository.EmployeeDataRepository;
import com.arthmatic.shumelahire.repository.FeedbackRequestDataRepository;
import com.arthmatic.shumelahire.repository.FeedbackResponseDataRepository;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackService.class);

    @Autowired
    private FeedbackRequestDataRepository feedbackRequestRepository;

    @Autowired
    private FeedbackResponseDataRepository feedbackResponseRepository;

    @Autowired
    private EmployeeDataRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public FeedbackRequestResponse createRequest(FeedbackRequestCreateRequest request) {
        Employee employee = employeeRepository.findById(String.valueOf(request.getEmployeeId()))
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        Employee requester = employeeRepository.findById(String.valueOf(request.getRequesterId()))
                .orElseThrow(() -> new IllegalArgumentException("Requester not found: " + request.getRequesterId()));

        FeedbackRequest feedbackRequest = new FeedbackRequest();
        feedbackRequest.setEmployee(employee);
        feedbackRequest.setRequester(requester);
        feedbackRequest.setFeedbackType(FeedbackType.valueOf(request.getFeedbackType()));
        feedbackRequest.setDueDate(request.getDueDate());
        feedbackRequest.setStatus(FeedbackStatus.PENDING);

        feedbackRequest = feedbackRequestRepository.save(feedbackRequest);

        auditLogService.saveLog(request.getRequesterId().toString(), "CREATE", "FEEDBACK_REQUEST",
                feedbackRequest.getId().toString(), "Created 360 feedback request for employee " + request.getEmployeeId());
        logger.info("Feedback request created for employee {} by {}", request.getEmployeeId(), request.getRequesterId());

        notificationService.notifyApprovalRequired(employee.getId(), "Feedback Request",
                requester.getFullName() + " - " + feedbackRequest.getFeedbackType());

        return FeedbackRequestResponse.fromEntity(feedbackRequest);
    }

    @Transactional(readOnly = true)
    public FeedbackRequestResponse getRequest(Long id) {
        FeedbackRequest request = feedbackRequestRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Feedback request not found: " + id));
        return FeedbackRequestResponse.fromEntity(request);
    }

    @Transactional(readOnly = true)
    public List<FeedbackRequestResponse> getRequestsForEmployee(Long employeeId) {
        return feedbackRequestRepository.findByEmployeeId(String.valueOf(employeeId)).stream()
                .map(FeedbackRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackRequestResponse> getRequestsByRequester(Long requesterId) {
        return feedbackRequestRepository.findByRequesterId(String.valueOf(requesterId)).stream()
                .map(FeedbackRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackRequestResponse> getPendingRequests() {
        return feedbackRequestRepository.findByStatus(FeedbackStatus.PENDING).stream()
                .map(FeedbackRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public FeedbackResponseDto submitFeedback(Long requestId, FeedbackSubmitRequest submitRequest) {
        FeedbackRequest feedbackRequest = feedbackRequestRepository.findById(String.valueOf(requestId))
                .orElseThrow(() -> new IllegalArgumentException("Feedback request not found: " + requestId));

        if (feedbackRequest.getStatus() != FeedbackStatus.PENDING) {
            throw new IllegalArgumentException("Feedback request is not pending");
        }

        Employee respondent = employeeRepository.findById(String.valueOf(submitRequest.getRespondentId()))
                .orElseThrow(() -> new IllegalArgumentException("Respondent not found: " + submitRequest.getRespondentId()));

        FeedbackResponse response = new FeedbackResponse();
        response.setRequest(feedbackRequest);
        response.setRespondent(respondent);
        response.setRatings(submitRequest.getRatings());
        response.setComments(submitRequest.getComments());
        response.setStrengths(submitRequest.getStrengths());
        response.setImprovements(submitRequest.getImprovements());
        response.setSubmittedAt(LocalDateTime.now());

        response = feedbackResponseRepository.save(response);

        feedbackRequest.setStatus(FeedbackStatus.SUBMITTED);
        feedbackRequestRepository.save(feedbackRequest);

        auditLogService.saveLog(submitRequest.getRespondentId().toString(), "SUBMIT", "FEEDBACK_RESPONSE",
                response.getId().toString(), "Submitted feedback for request " + requestId);
        logger.info("Feedback submitted for request {} by respondent {}", requestId, submitRequest.getRespondentId());

        notificationService.sendInternalNotification(feedbackRequest.getRequester().getId(), "Feedback Received",
                respondent.getFullName() + " submitted feedback for " + feedbackRequest.getEmployee().getFullName(),
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return FeedbackResponseDto.fromEntity(response);
    }

    public void declineRequest(Long requestId) {
        FeedbackRequest feedbackRequest = feedbackRequestRepository.findById(String.valueOf(requestId))
                .orElseThrow(() -> new IllegalArgumentException("Feedback request not found: " + requestId));

        feedbackRequest.setStatus(FeedbackStatus.DECLINED);
        feedbackRequestRepository.save(feedbackRequest);

        notificationService.sendInternalNotification(feedbackRequest.getRequester().getId(), "Feedback Declined",
                "Feedback request for " + feedbackRequest.getEmployee().getFullName() + " was declined",
                NotificationType.APPROVAL_DENIED, NotificationPriority.MEDIUM);

        auditLogService.saveLog("SYSTEM", "DECLINE", "FEEDBACK_REQUEST",
                requestId.toString(), "Declined feedback request");
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponseDto> getResponses(Long requestId) {
        return feedbackResponseRepository.findByRequestId(String.valueOf(requestId)).stream()
                .map(FeedbackResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
