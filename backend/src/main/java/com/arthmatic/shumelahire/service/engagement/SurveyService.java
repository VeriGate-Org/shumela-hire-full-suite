package com.arthmatic.shumelahire.service.engagement;

import com.arthmatic.shumelahire.dto.engagement.*;
import com.arthmatic.shumelahire.entity.Employee;
import com.arthmatic.shumelahire.entity.engagement.Survey;
import com.arthmatic.shumelahire.entity.engagement.SurveyQuestion;
import com.arthmatic.shumelahire.entity.engagement.SurveyStatus;
import com.arthmatic.shumelahire.entity.engagement.QuestionType;
import com.arthmatic.shumelahire.repository.EmployeeRepository;
import com.arthmatic.shumelahire.repository.engagement.*;
import com.arthmatic.shumelahire.entity.NotificationPriority;
import com.arthmatic.shumelahire.entity.NotificationType;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SurveyService {

    private static final Logger logger = LoggerFactory.getLogger(SurveyService.class);

    @Autowired
    private SurveyRepository surveyRepository;

    @Autowired
    private SurveyQuestionRepository surveyQuestionRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private NotificationService notificationService;

    public SurveyResponse createSurvey(SurveyCreateRequest request, Long createdBy) {
        Survey survey = new Survey();
        survey.setTitle(request.getTitle());
        survey.setDescription(request.getDescription());
        survey.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        survey.setStartDate(request.getStartDate());
        survey.setEndDate(request.getEndDate());
        survey.setCreatedBy(createdBy);
        survey.setStatus(SurveyStatus.DRAFT);

        survey = surveyRepository.save(survey);

        if (request.getQuestions() != null) {
            for (SurveyCreateRequest.QuestionRequest qr : request.getQuestions()) {
                SurveyQuestion question = new SurveyQuestion();
                question.setSurvey(survey);
                question.setQuestionText(qr.getQuestionText());
                question.setQuestionType(QuestionType.valueOf(qr.getQuestionType()));
                question.setOptions(qr.getOptions());
                question.setDisplayOrder(qr.getDisplayOrder() != null ? qr.getDisplayOrder() : 0);
                question.setIsRequired(qr.getIsRequired() != null ? qr.getIsRequired() : true);
                surveyQuestionRepository.save(question);
            }
        }

        auditLogService.saveLog(createdBy.toString(), "CREATE", "SURVEY",
                survey.getId().toString(), "Created survey: " + survey.getTitle());
        logger.info("Survey created: {} by user {}", survey.getTitle(), createdBy);

        return SurveyResponse.fromEntity(surveyRepository.findById(survey.getId()).orElse(survey));
    }

    @Transactional(readOnly = true)
    public SurveyResponse getSurvey(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + id));
        return SurveyResponse.fromEntity(survey);
    }

    @Transactional(readOnly = true)
    public Page<SurveyResponse> getAllSurveys(Pageable pageable) {
        return surveyRepository.findAll(pageable).map(SurveyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SurveyResponse> getActiveSurveys() {
        return surveyRepository.findByStatus(SurveyStatus.ACTIVE).stream()
                .map(SurveyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SurveyResponse activateSurvey(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + id));
        survey.setStatus(SurveyStatus.ACTIVE);
        survey = surveyRepository.save(survey);

        auditLogService.saveLog("SYSTEM", "ACTIVATE", "SURVEY",
                survey.getId().toString(), "Activated survey: " + survey.getTitle());

        notificationService.sendInternalNotification(survey.getCreatedBy(), "Survey Activated",
                "Your survey '" + survey.getTitle() + "' is now active",
                NotificationType.APPROVAL_GRANTED, NotificationPriority.MEDIUM);

        return SurveyResponse.fromEntity(survey);
    }

    public SurveyResponse closeSurvey(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + id));
        survey.setStatus(SurveyStatus.CLOSED);
        survey = surveyRepository.save(survey);

        auditLogService.saveLog("SYSTEM", "CLOSE", "SURVEY",
                survey.getId().toString(), "Closed survey: " + survey.getTitle());

        notificationService.sendInternalNotification(survey.getCreatedBy(), "Survey Closed",
                "Survey '" + survey.getTitle() + "' has been closed",
                NotificationType.APPROVAL_GRANTED, NotificationPriority.LOW);

        return SurveyResponse.fromEntity(survey);
    }

    public void submitResponse(Long surveyId, SurveySubmitRequest request) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + surveyId));

        if (survey.getStatus() != SurveyStatus.ACTIVE) {
            throw new IllegalArgumentException("Survey is not active");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        if (surveyResponseRepository.existsBySurveyIdAndEmployeeId(surveyId, request.getEmployeeId())) {
            throw new IllegalArgumentException("Employee has already responded to this survey");
        }

        for (SurveySubmitRequest.AnswerRequest answer : request.getAnswers()) {
            SurveyQuestion question = surveyQuestionRepository.findById(answer.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Question not found: " + answer.getQuestionId()));

            com.arthmatic.shumelahire.entity.engagement.SurveyResponse response =
                    new com.arthmatic.shumelahire.entity.engagement.SurveyResponse();
            response.setSurvey(survey);
            response.setQuestion(question);
            response.setEmployee(employee);
            response.setRating(answer.getRating());
            response.setTextResponse(answer.getTextResponse());
            surveyResponseRepository.save(response);
        }

        auditLogService.saveLog(request.getEmployeeId().toString(), "SUBMIT_RESPONSE", "SURVEY",
                surveyId.toString(), "Submitted response to survey: " + survey.getTitle());
        logger.info("Employee {} submitted response to survey {}", request.getEmployeeId(), surveyId);

        notificationService.sendInternalNotification(survey.getCreatedBy(), "Survey Response",
                "New response submitted for '" + survey.getTitle() + "'",
                NotificationType.APPROVAL_GRANTED, NotificationPriority.LOW);
    }

    @Transactional(readOnly = true)
    public SurveyResultsResponse getSurveyResults(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + surveyId));

        SurveyResultsResponse results = new SurveyResultsResponse();
        results.setSurveyId(surveyId);
        results.setSurveyTitle(survey.getTitle());
        results.setTotalRespondents(surveyResponseRepository.countDistinctRespondents(surveyId));

        List<SurveyQuestion> questions = surveyQuestionRepository.findBySurveyIdOrderByDisplayOrderAsc(surveyId);
        List<SurveyResultsResponse.QuestionResult> questionResults = new ArrayList<>();

        for (SurveyQuestion question : questions) {
            SurveyResultsResponse.QuestionResult qr = new SurveyResultsResponse.QuestionResult();
            qr.setQuestionId(question.getId());
            qr.setQuestionText(question.getQuestionText());
            qr.setQuestionType(question.getQuestionType().name());
            qr.setAverageRating(surveyResponseRepository.getAverageRating(surveyId, question.getId()));

            List<com.arthmatic.shumelahire.entity.engagement.SurveyResponse> responses =
                    surveyResponseRepository.findBySurveyIdAndQuestionId(surveyId, question.getId());
            qr.setResponseCount((long) responses.size());
            qr.setTextResponses(responses.stream()
                    .map(com.arthmatic.shumelahire.entity.engagement.SurveyResponse::getTextResponse)
                    .filter(t -> t != null && !t.isEmpty())
                    .collect(Collectors.toList()));

            questionResults.add(qr);
        }

        results.setQuestionResults(questionResults);
        return results;
    }

    public void deleteSurvey(Long id) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found: " + id));
        surveyRepository.delete(survey);

        auditLogService.saveLog("SYSTEM", "DELETE", "SURVEY",
                id.toString(), "Deleted survey: " + survey.getTitle());
        logger.info("Survey deleted: {}", id);
    }
}
