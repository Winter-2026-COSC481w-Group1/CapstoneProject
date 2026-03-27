import { CheckCircle, XCircle, Download, ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { Question } from '../types';


export default function GradingReport() {
  const { currentAssessment, assessments } = useApp();
  const navigate = useNavigate();

  if (!currentAssessment) {
    navigate('/dashboard/assessments');
    return null;
  }

  const assessment = assessments.find(a => a.id === currentAssessment.id) || currentAssessment;
  const questions = assessment.questions;
  const attemptData = assessment.attempt;
  const attemptAnswers = Array.isArray(attemptData?.answers) ? attemptData.answers : [];

  const normalizeAttemptEntry = (entry: unknown): { value: number | boolean | string | null; isCorrect: boolean | null } => {
    if (entry === undefined || entry === null) return { value: null, isCorrect: null };

    if (typeof entry === 'object' && entry !== null) {
      const obj = entry as Record<string, unknown>;
      const value = obj.value ?? obj.answer ?? null;
      const isCorrect =
        typeof obj.isCorrect === 'boolean'
          ? obj.isCorrect
          : typeof obj.is_correct === 'boolean'
          ? obj.is_correct
          : null;
      if (value === undefined) {
        // In some legacy cases, answers are sent as primitive objects with questionId/answer
        return { value: null, isCorrect };
      }
      return {
        value: value as number | boolean | string | null,
        isCorrect,
      };
    }

    if (typeof entry === 'number' || typeof entry === 'boolean' || typeof entry === 'string') {
      return { value: entry, isCorrect: null };
    }

    return { value: null, isCorrect: null };
  };

  const getNormalizedAnswer = (index: number) => normalizeAttemptEntry(attemptAnswers[index]);
  const getAnswerValue = (index: number) => getNormalizedAnswer(index).value;
  const getAnswerCorrectFlag = (index: number) => getNormalizedAnswer(index).isCorrect;

  const getAnswerIndex = (index: number): number | null => {
    const value = getAnswerValue(index);
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'boolean') {
      return value ? 0 : 1;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return 0;
      if (normalized === 'false') return 1;
    }

    return null;
  };

  const isQuestionCorrectByBackend = (index: number): boolean | null => {
    const flag = getAnswerCorrectFlag(index);
    return flag !== null ? flag : null;
  };

  const isQuestionCorrect = (question: Question, index: number): boolean => {
    const backendFlag = isQuestionCorrectByBackend(index);
    if (backendFlag !== null) return backendFlag;

    const answerValue = getAnswerValue(index);
    if (question.type === 'short-answer') {
      if (typeof answerValue !== 'string') return false;
      return answerValue.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    }

    const userIndex = getAnswerIndex(index);
    if (userIndex === null) return false;

    return userIndex === Number(question.correctAnswer);
  };

  // Helper function to safely parse date
  const parseDate = (dateString: string | Date | undefined): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    try {
      // Handle ISO strings (e.g., "2024-01-16T10:30:00Z")
      return new Date(dateString);
    } catch (e) {
      console.error('Error parsing date:', dateString, e);
      return null;
    }
  };

  const numCorrectSource = questions.filter((q, idx) => isQuestionCorrect(q, idx)).length;
  const numCorrect = attemptData?.numCorrect ?? numCorrectSource;
  const attemptNumber = attemptData?.numAttempts ?? assessment.numAttempts;
  const attemptDate = parseDate(assessment.attempt?.timeSubmitted);

  const score = questions.length > 0 ? Math.round((numCorrect / questions.length) * 100) : 0;

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
                <span>{numCorrect} correct</span>
                <span>•</span>
                <span>{questions.length - numCorrect} incorrect</span>
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

        {assessment.status === "completed" && (
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attempt Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{attemptNumber}</div>
                <div className="text-sm text-gray-600">Attempt Number</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {assessment.status === "completed" && attemptDate ? attemptDate.toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {assessment.status === "completed" && attemptDate ? attemptDate.toLocaleTimeString() : 'N/A'}
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
            const userAnswerIndex = getAnswerIndex(idx);
            const isCorrect = isQuestionCorrect(question, idx);

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
                          const isUserAnswer = optIdx === userAnswerIndex;
                          const isCorrectAnswer = optIdx === Number(question.correctAnswer);

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
                          const isUserAnswer = optIdx === userAnswerIndex;
                          const isCorrectAnswer = optIdx === Number(question.correctAnswer);

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

                    {question.source && (
                      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-blue-900 mb-2">Source Citation</div>
                            <p className="text-sm text-gray-700 italic mb-2">"{question.source.text}"</p>
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                              <span className="font-medium">
                              {question.source.document_name || question.source.document_id}
                            </span>
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
