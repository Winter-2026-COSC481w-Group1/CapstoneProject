import { CheckCircle, XCircle, Download, ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { Question, AttemptAnswer } from '../types';


export default function GradingReport() {
  const { currentAssessment, assessments } = useApp();
  const navigate = useNavigate();

  if (!currentAssessment) {
    navigate('/dashboard/assessments');
    return null;
  }

  const assessment = assessments.find(a => a.id === currentAssessment.id) || currentAssessment;
  const questions = assessment.questions;
  const lastAttempt = assessment.lastAttempt;

  // Calculate score dynamically from attempt data
  const calculateScore = (): number => {
    if (!lastAttempt || !lastAttempt.answers) return 0;

    let correctCount = 0;
    for (const question of questions) {
      const attemptAnswer = lastAttempt.answers.find((a: AttemptAnswer) => a.questionId === question.id);
      if (!attemptAnswer) continue;

      if (question.type === 'short-answer') {
        // Use the stored correctness for short answers
        if (attemptAnswer.shortAnswerIsCorrect === true) {
          correctCount++;
        }
      } else {
        // For MCQ and True/False, compare answer to correct answer
        if (attemptAnswer.answer === question.correctAnswer) {
          correctCount++;
        }
      }
    }

    return questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  };

  // Helper function to safely parse date
  const parseDate = (dateString: string | Date | undefined): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    try {
      // Handle ISO strings (e.g., "2024-01-16T10:30:00Z")
      console.log(dateString)
      return new Date(dateString);
    } catch (e) {
      console.error('Error parsing date:', dateString, e);
      return null;
    }
  };

  // Helper function to determine if a question is correct
  const isQuestionCorrect = (q: Question): boolean => {
    if (q.type === 'short-answer' && lastAttempt) {
      // For short-answer, use the shortAnswerIsCorrect from attempt data if available
      const attemptAnswer = lastAttempt.answers?.find((a: AttemptAnswer) => a.questionId === q.id);
      if (attemptAnswer && attemptAnswer.shortAnswerIsCorrect !== null && attemptAnswer.shortAnswerIsCorrect !== undefined) {
        return attemptAnswer.shortAnswerIsCorrect;
      }
      // Fallback to string comparison if shortAnswerIsCorrect not available
      return (
        typeof q.userAnswer === 'string' &&
        typeof q.correctAnswer === 'string' &&
        q.userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
      );
    }
    // For MCQ and True/False, compare answer to correct answer index
    return q.userAnswer === q.correctAnswer;
  };

  const correctCount = questions.filter(isQuestionCorrect).length;
  const score = calculateScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 70) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Assessments
        </button>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              <p className="text-gray-600 mb-4">{assessment.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{questions.length} questions</span>
                <span>•</span>
                <span>{correctCount} correct</span>
                <span>•</span>
                <span>{questions.length - correctCount} incorrect</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBgColor(score)}`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                <Download className="w-4 h-4" />
                Download Graded PDF
              </button>
            </div>
          </div>
        </div>

        {lastAttempt && (
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attempt Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{lastAttempt.attempts}</div>
                <div className="text-sm text-gray-600">Attempt Number</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {lastAttempt && parseDate(lastAttempt.time_submitted) ? parseDate(lastAttempt.time_submitted)!.toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {lastAttempt && parseDate(lastAttempt.time_submitted) ? parseDate(lastAttempt.time_submitted)!.toLocaleTimeString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question Review</h2>
          <p className="text-gray-600">Review your answers with source citations</p>
        </div>

        <div className="space-y-6">
          {questions.map((question, idx) => {
            const isCorrect = isQuestionCorrect(question);
            const hasAnswer =
              question.type === 'short-answer'
                ? typeof question.userAnswer === 'string' && question.userAnswer.trim() !== ''
                : question.userAnswer !== undefined && question.userAnswer !== null;

            return (
              <div
                key={question.id}
                className={`bg-white rounded-3xl p-6 shadow-lg border-2 ${
                  isCorrect ? 'border-emerald-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCorrect ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-500">Question {idx + 1}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{question.question}</h3>

                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIdx) => {
                          const isUserAnswer = optIdx === question.userAnswer;
                          const isCorrectAnswer = optIdx === question.correctAnswer;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border-2 ${
                                isCorrectAnswer
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : isUserAnswer && !isCorrect
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                {isUserAnswer && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                <span className={`font-medium ${
                                  isCorrectAnswer ? 'text-emerald-700' : isUserAnswer ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'true-false' && (
                      <div className="space-y-2 mb-4">
                        {['True', 'False'].map((option, optIdx) => {
                          const isUserAnswer = optIdx === question.userAnswer;
                          const isCorrectAnswer = optIdx === question.correctAnswer;

                          return (
                            <div
                              key={option}
                              className={`p-3 rounded-xl border-2 ${
                                isCorrectAnswer
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : isUserAnswer && !isCorrect
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                {isUserAnswer && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                <span className={`font-medium ${
                                  isCorrectAnswer ? 'text-emerald-700' : isUserAnswer ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'short-answer' && (
                      <div className="space-y-3 mb-4">
                        {hasAnswer && !isCorrect && (
                          <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl">
                            <div className="text-sm font-medium text-red-700 mb-1">Your Answer:</div>
                            <div className="text-gray-900 line-through">{question.userAnswer}</div>
                          </div>
                        )}
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl">
                          <div className="text-sm font-medium text-emerald-700 mb-1">
                            {isCorrect ? 'Your Answer (Correct):' : 'Correct Answer:'}
                          </div>
                          <div className="text-gray-900 font-medium">{question.correctAnswer}</div>
                        </div>
                      </div>
                    )}

                    {question.source && (
                      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-blue-900 mb-2">Source Citation</div>
                            <p className="text-sm text-gray-700 italic mb-2">"{question.source.text}"</p>
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                              <span className="font-medium">{question.source.fileName}</span>
                              <span>•</span>
                              <span>Page {question.source.page}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard/assessments')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
