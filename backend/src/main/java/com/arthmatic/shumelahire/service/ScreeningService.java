package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.ScreeningAnswer;
import com.arthmatic.shumelahire.entity.ScreeningQuestion;
import com.arthmatic.shumelahire.entity.QuestionType;
import com.arthmatic.shumelahire.repository.ScreeningAnswerDataRepository;
import com.arthmatic.shumelahire.repository.ScreeningQuestionDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional
public class ScreeningService {
    
    @Autowired
    private ScreeningQuestionDataRepository questionRepository;

    @Autowired
    private ScreeningAnswerDataRepository answerRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Question Management
    public ScreeningQuestion createQuestion(ScreeningQuestion question) {
        validateQuestion(question);
        
        if (question.getDisplayOrder() == null || question.getDisplayOrder() == 0) {
            Integer maxOrder = questionRepository.findMaxDisplayOrderByJobPostingId(question.getJobPostingId());
            question.setDisplayOrder(maxOrder != null ? maxOrder + 1 : 1);
        }
        
        ScreeningQuestion saved = questionRepository.save(question);
        
        auditLogService.logSystemAction(
            "SCREENING_QUESTION_CREATED",
            "ScreeningQuestion",
            "Created screening question for Job Posting " + question.getJobPostingId() + ": " + question.getQuestionText()
        );
        
        return saved;
    }
    
    public ScreeningQuestion updateQuestion(String questionId, ScreeningQuestion questionUpdate) {
        ScreeningQuestion existing = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found"));
        
        existing.setQuestionText(questionUpdate.getQuestionText());
        existing.setQuestionType(questionUpdate.getQuestionType());
        existing.setIsRequired(questionUpdate.getIsRequired());
        existing.setQuestionOptions(questionUpdate.getQuestionOptions());
        existing.setValidationRules(questionUpdate.getValidationRules());
        existing.setHelpText(questionUpdate.getHelpText());
        existing.setIsActive(questionUpdate.getIsActive());
        
        validateQuestion(existing);
        
        ScreeningQuestion saved = questionRepository.save(existing);
        
        auditLogService.logSystemAction(
            "SCREENING_QUESTION_UPDATED",
            "ScreeningQuestion",
            "Updated screening question ID " + questionId
        );
        
        return saved;
    }
    
    public void deleteQuestion(String questionId) {
        ScreeningQuestion question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found"));
        
        question.setIsActive(false);
        questionRepository.save(question);
        
        auditLogService.logSystemAction(
            "SCREENING_QUESTION_DELETED",
            "ScreeningQuestion",
            "Deactivated screening question ID " + questionId
        );
    }
    
    public List<ScreeningQuestion> getQuestionsByJobPosting(String jobPostingId) {
        return questionRepository.findActiveQuestionsByJobPostingIdOrderedByDisplay(jobPostingId);
    }
    
    // Answer Management
    public ScreeningAnswer saveAnswer(String applicationId, String questionId, String answerValue, String answerFileUrl, String answerFileName) {
        ScreeningQuestion question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found"));
        
        Optional<ScreeningAnswer> existingAnswer = answerRepository.findByApplicationIdAndScreeningQuestionId(applicationId, questionId);
        
        ScreeningAnswer answer;
        if (existingAnswer.isPresent()) {
            answer = existingAnswer.get();
            answer.setAnswerValue(answerValue);
            answer.setAnswerFileUrl(answerFileUrl);
            answer.setAnswerFileName(answerFileName);
        } else {
            answer = new ScreeningAnswer(applicationId, question, answerValue);
            answer.setAnswerFileUrl(answerFileUrl);
            answer.setAnswerFileName(answerFileName);
        }
        
        validateAnswer(answer, question);
        
        ScreeningAnswer saved = answerRepository.save(answer);
        
        auditLogService.logSystemAction(
            "SCREENING_ANSWER_SAVED",
            "ScreeningAnswer",
            "Application " + applicationId + " answered question: " + question.getQuestionText().substring(0, Math.min(50, question.getQuestionText().length()))
        );
        
        return saved;
    }
    
    public List<ScreeningAnswer> getAnswersByApplication(String applicationId) {
        return answerRepository.findByApplicationIdOrderedByQuestionDisplay(applicationId);
    }
    
    public void deleteAnswersByApplication(String applicationId) {
        answerRepository.deleteByApplicationId(applicationId);
        
        auditLogService.logSystemAction(
            "SCREENING_ANSWERS_DELETED",
            "ScreeningAnswer",
            "Deleted all screening answers for application " + applicationId
        );
    }
    
    // Validation
    public boolean validateApplicationAnswers(String applicationId) {
        Long missingRequired = answerRepository.countMissingRequiredAnswersByApplicationId(applicationId);
        Long invalidAnswers = answerRepository.countInvalidAnswersByApplicationId(applicationId);
        
        return missingRequired == 0 && invalidAnswers == 0;
    }
    
    public String getValidationSummary(String applicationId) {
        Long missingRequired = answerRepository.countMissingRequiredAnswersByApplicationId(applicationId);
        Long invalidAnswers = answerRepository.countInvalidAnswersByApplicationId(applicationId);
        
        if (missingRequired == 0 && invalidAnswers == 0) {
            return "All screening questions completed successfully";
        }
        
        StringBuilder summary = new StringBuilder();
        if (missingRequired > 0) {
            summary.append("Missing ").append(missingRequired).append(" required answer(s). ");
        }
        if (invalidAnswers > 0) {
            summary.append("Found ").append(invalidAnswers).append(" invalid answer(s).");
        }
        
        return summary.toString().trim();
    }
    
    // Private validation methods
    private void validateQuestion(ScreeningQuestion question) {
        if (question.getQuestionText() == null || question.getQuestionText().trim().isEmpty()) {
            throw new IllegalArgumentException("Question text is required");
        }
        
        if (question.getQuestionType() == null) {
            throw new IllegalArgumentException("Question type is required");
        }
        
        if (question.hasOptions() && (question.getQuestionOptions() == null || question.getQuestionOptions().trim().isEmpty())) {
            throw new IllegalArgumentException("Question options are required for " + question.getQuestionType() + " questions");
        }
        
        if (question.hasOptions()) {
            try {
                JsonNode options = objectMapper.readTree(question.getQuestionOptions());
                if (!options.isArray() || options.size() == 0) {
                    throw new IllegalArgumentException("Question options must be a non-empty JSON array");
                }
            } catch (Exception e) {
                throw new IllegalArgumentException("Question options must be valid JSON array");
            }
        }
        
        if (questionRepository.existsByJobPostingIdAndQuestionTextAndIsActiveTrue(question.getJobPostingId(), question.getQuestionText())) {
            throw new IllegalArgumentException("A question with this text already exists for this job posting");
        }
    }
    
    private void validateAnswer(ScreeningAnswer answer, ScreeningQuestion question) {
        answer.setIsValid(true);
        answer.setValidationMessage(null);
        
        boolean isEmpty = answer.isEmpty();
        
        if (question.isRequired() && isEmpty) {
            answer.setIsValid(false);
            answer.setValidationMessage("This question is required");
            return;
        }
        
        if (isEmpty) {
            return; // Optional empty answer is valid
        }
        
        switch (question.getQuestionType()) {
            case EMAIL:
                if (!isValidEmail(answer.getAnswerValue())) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please enter a valid email address");
                }
                break;
                
            case PHONE:
                if (!isValidPhone(answer.getAnswerValue())) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please enter a valid phone number");
                }
                break;
                
            case NUMBER:
                if (!isValidNumber(answer.getAnswerValue())) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please enter a valid number");
                }
                break;
                
            case YES_NO:
                if (!isValidYesNo(answer.getAnswerValue())) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please select Yes or No");
                }
                break;
                
            case DROPDOWN:
            case MULTIPLE_CHOICE:
                if (!isValidOption(answer.getAnswerValue(), question.getQuestionOptions())) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please select a valid option");
                }
                break;
                
            case FILE_UPLOAD:
                if (answer.getAnswerFileUrl() == null || answer.getAnswerFileUrl().trim().isEmpty()) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Please upload a file");
                }
                break;
        }
        
        // Apply custom validation rules if present
        if (question.getValidationRules() != null && !question.getValidationRules().trim().isEmpty()) {
            applyCustomValidation(answer, question.getValidationRules());
        }
    }
    
    private boolean isValidEmail(String email) {
        if (email == null) return false;
        String emailRegex = "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$";
        return Pattern.compile(emailRegex).matcher(email).matches();
    }
    
    private boolean isValidPhone(String phone) {
        if (phone == null) return false;
        String phoneRegex = "^[+]?[0-9\\s\\-\\(\\)]+$";
        return Pattern.compile(phoneRegex).matcher(phone.trim()).matches() && phone.trim().length() >= 10;
    }
    
    private boolean isValidNumber(String number) {
        if (number == null) return false;
        try {
            Double.parseDouble(number.trim());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    private boolean isValidYesNo(String value) {
        if (value == null) return false;
        String normalizedValue = value.trim().toLowerCase();
        return normalizedValue.equals("yes") || normalizedValue.equals("no") || 
               normalizedValue.equals("true") || normalizedValue.equals("false");
    }
    
    private boolean isValidOption(String value, String optionsJson) {
        if (value == null || optionsJson == null) return false;
        
        try {
            JsonNode options = objectMapper.readTree(optionsJson);
            for (JsonNode option : options) {
                if (option.asText().equals(value)) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }
        
        return false;
    }
    
    private void applyCustomValidation(ScreeningAnswer answer, String validationRules) {
        try {
            JsonNode rules = objectMapper.readTree(validationRules);
            
            if (rules.has("minLength")) {
                int minLength = rules.get("minLength").asInt();
                if (answer.getAnswerValue() != null && answer.getAnswerValue().length() < minLength) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Answer must be at least " + minLength + " characters long");
                    return;
                }
            }
            
            if (rules.has("maxLength")) {
                int maxLength = rules.get("maxLength").asInt();
                if (answer.getAnswerValue() != null && answer.getAnswerValue().length() > maxLength) {
                    answer.setIsValid(false);
                    answer.setValidationMessage("Answer must be no more than " + maxLength + " characters long");
                    return;
                }
            }
            
            if (rules.has("pattern")) {
                String pattern = rules.get("pattern").asText();
                if (answer.getAnswerValue() != null && !Pattern.compile(pattern).matcher(answer.getAnswerValue()).matches()) {
                    String message = rules.has("patternMessage") ? rules.get("patternMessage").asText() : "Answer format is invalid";
                    answer.setIsValid(false);
                    answer.setValidationMessage(message);
                }
            }
            
        } catch (Exception e) {
            // If validation rules are malformed, log but don't fail the validation
            System.err.println("Error applying custom validation rules: " + e.getMessage());
        }
    }
}