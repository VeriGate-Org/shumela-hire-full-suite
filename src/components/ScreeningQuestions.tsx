'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

interface ScreeningQuestion {
  id: number;
  jobPostingId: number;
  questionType: 'TEXT' | 'DROPDOWN' | 'YES_NO' | 'MULTIPLE_CHOICE' | 'FILE_UPLOAD' | 'CHECKBOX' | 'NUMBER' | 'DATE' | 'EMAIL' | 'PHONE';
  questionText: string;
  isRequired: boolean;
  displayOrder: number;
  questionOptions?: string;
  validationRules?: string;
  helpText?: string;
  isActive: boolean;
}

interface ScreeningAnswer {
  id?: number;
  questionId: number;
  answerValue?: string;
  answerFileUrl?: string;
  answerFileName?: string;
}

interface ScreeningQuestionsProps {
  applicationId: number;
  jobPostingId: number;
  onComplete?: (answers: ScreeningAnswer[]) => void;
  readonly?: boolean;
}

function parseOptions(optionsJson?: string): string[] {
  if (!optionsJson) return [];
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return optionsJson.split(',').map(s => s.trim()).filter(Boolean);
  }
}

export default function ScreeningQuestions({
  applicationId,
  jobPostingId,
  onComplete,
  readonly = false
}: ScreeningQuestionsProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: ScreeningAnswer }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [savedAnswers, setSavedAnswers] = useState<{ [key: number]: boolean }>({});

  const loadQuestions = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/screening/questions/job-posting/${jobPostingId}`);

      if (response.ok) {
        const data = await response.json();
        setQuestions(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  }, [jobPostingId]);

  const loadExistingAnswers = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/screening/answers/application/${applicationId}`);

      if (response.ok) {
        const data = await response.json();
        const existingAnswers = Array.isArray(data) ? data : [];

        const answerMap: { [key: number]: ScreeningAnswer } = {};
        const savedMap: { [key: number]: boolean } = {};

        existingAnswers.forEach((answer: ScreeningAnswer & { screeningQuestion: { id: number } }) => {
          const questionId = answer.screeningQuestion.id;
          answerMap[questionId] = { ...answer, questionId };
          savedMap[questionId] = true;
        });

        setAnswers(answerMap);
        setSavedAnswers(savedMap);
      }
    } catch (error) {
      console.error('Error loading existing answers:', error);
    }
  }, [applicationId]);

  useEffect(() => {
    loadQuestions();
    if (applicationId) {
      loadExistingAnswers();
    }
  }, [loadQuestions, applicationId, loadExistingAnswers]);

  const handleAnswerChange = async (questionId: number, value: string) => {
    const newAnswer: ScreeningAnswer = {
      ...answers[questionId],
      questionId,
      answerValue: value,
    };

    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));

    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }

    // Auto-save after 1 second of inactivity
    if (!readonly) {
      setTimeout(() => saveAnswer(questionId, newAnswer), 1000);
    }
  };

  const handleFileUpload = async (questionId: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [questionId]: 'File size must be less than 10MB'
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'SCREENING_ANSWER');

      // Upload to document service (assuming similar to applicant documents)
      const response = await apiFetch(`/api/applicants/${user?.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const document = await response.json();
        
        const newAnswer: ScreeningAnswer = {
          ...answers[questionId],
          questionId,
          answerFileUrl: document.url,
          answerFileName: file.name,
        };

        setAnswers(prev => ({
          ...prev,
          [questionId]: newAnswer
        }));

        await saveAnswer(questionId, newAnswer);
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        [questionId]: 'File upload failed'
      }));
    }
  };

  const saveAnswer = async (questionId: number, answer: ScreeningAnswer) => {
    if (readonly) return;

    try {
      const response = await apiFetch('/api/screening/answers', {
        method: 'POST',
        body: JSON.stringify({
          applicationId,
          questionId,
          answerValue: answer.answerValue,
          answerFileUrl: answer.answerFileUrl,
          answerFileName: answer.answerFileName,
        }),
      });

      if (response.ok) {
        setSavedAnswers(prev => ({
          ...prev,
          [questionId]: true
        }));
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const validateAnswers = () => {
    const newErrors: { [key: number]: string } = {};
    
    questions.forEach(question => {
      if (question.isRequired && !answers[question.id]?.answerValue && !answers[question.id]?.answerFileUrl) {
        newErrors[question.id] = 'This question is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const answersArray = Object.values(answers);
      
      const response = await apiFetch('/api/screening/answers/bulk', {
        method: 'POST',
        body: JSON.stringify({
          applicationId,
          answers: answersArray.map(answer => ({
            questionId: answer.questionId,
            answerValue: answer.answerValue,
            answerFileUrl: answer.answerFileUrl,
            answerFileName: answer.answerFileName,
          }))
        }),
      });

      if (response.ok) {
        onComplete?.(answersArray);
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: ScreeningQuestion) => {
    const answer = answers[question.id];
    const hasError = !!errors[question.id];
    const isSaved = savedAnswers[question.id];

    switch (question.questionType) {
      case 'TEXT':
        return (
          <div className="relative">
            <textarea
              id={`question-${question.id}`}
              value={answer?.answerValue || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={readonly}
              maxLength={500}
              className={`w-full p-3 border rounded-sm ${
                hasError ? 'border-red-500' : 'border-gray-300'
              } ${readonly ? 'bg-gray-50' : ''}`}
              placeholder="Enter your answer..."
              rows={3}
            />
            <div className="text-sm text-gray-500 mt-1">
              {(answer?.answerValue || '').length} / 500
            </div>
            {isSaved && !readonly && (
              <div className="absolute top-2 right-2 text-green-500 text-sm">
                ✓ Saved
              </div>
            )}
          </div>
        );

      case 'DROPDOWN':
        const options = parseOptions(question.questionOptions);
        return (
          <div className="relative">
            <select
              id={`question-${question.id}`}
              value={answer?.answerValue || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={readonly}
              className={`w-full p-3 border rounded-sm ${
                hasError ? 'border-red-500' : 'border-gray-300'
              } ${readonly ? 'bg-gray-50' : ''}`}
            >
              <option value="">Select an option...</option>
              {options.map((option, index) => (
                <option key={index} value={option.trim()}>
                  {option.trim()}
                </option>
              ))}
            </select>
            {isSaved && !readonly && (
              <div className="absolute top-2 right-2 text-green-500 text-sm">
                ✓ Saved
              </div>
            )}
          </div>
        );

      case 'YES_NO':
        return (
          <div className="space-y-2">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="Yes"
                  checked={answer?.answerValue === 'Yes'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={readonly}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value="No"
                  checked={answer?.answerValue === 'No'}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={readonly}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {isSaved && !readonly && (
              <div className="text-green-500 text-sm">
                ✓ Saved
              </div>
            )}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        const mcOptions = parseOptions(question.questionOptions);
        return (
          <div className="space-y-2">
            {mcOptions.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.trim()}
                  checked={answer?.answerValue === option.trim()}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={readonly}
                  className="mr-2"
                />
                {option.trim()}
              </label>
            ))}
            {isSaved && !readonly && (
              <div className="text-green-500 text-sm">
                ✓ Saved
              </div>
            )}
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div className="space-y-2">
            {!readonly && (
              <input
                type="file"
                id={`question-${question.id}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(question.id, file);
                }}
                className="w-full p-2 border border-gray-300 rounded-sm"
                accept=".pdf,.doc,.docx,.txt"
              />
            )}
            {answer?.answerFileName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📄</span>
                <span>{answer.answerFileName}</span>
                {isSaved && !readonly && (
                  <span className="text-green-500">✓ Saved</span>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No screening questions available for this position.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gold-50 border-l-4 border-violet-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-violet-700">
              {readonly ? 
                'These are the screening questions and answers for this application.' :
                'Please answer the following screening questions. Required questions are marked with an asterisk (*). Your answers are automatically saved as you type.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {index + 1}. {question.questionText}
                {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              </h3>
            </div>

            {renderQuestionInput(question)}

            {errors[question.id] && (
              <div className="mt-2 text-sm text-red-600">
                {errors[question.id]}
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-500">
            {Object.keys(savedAnswers).length} of {questions.filter(q => q.isRequired).length} required questions answered
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gold-500 text-violet-950 px-6 py-3 rounded-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {submitting ? 'Submitting...' : 'Complete Screening Questions'}
          </button>
        </div>
      )}
    </div>
  );
}
