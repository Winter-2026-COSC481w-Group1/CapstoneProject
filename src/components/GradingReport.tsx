import { CheckCircle, XCircle, Download, ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '../AppContext';

export default function GradingReport() {
  const { currentAssessment, setCurrentPage, assessments } = useApp();

  if (!currentAssessment) {
    setCurrentPage('assessments');
    return null;
  }

  const assessment = assessments.find(a => a.id === currentAssessment.id) || currentAssessment;
  const score = assessment.lastScore || 0;
  const questions = assessment.questions;
  const correctCount = questions.filter(q =>
    q.userAnswer?.toLowerCase().trim() === q.options![correctAnswer].toLowerCase().trim()
  ).length;

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
          onClick={() => setCurrentPage('assessments')}
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Question Review</h2>
          <p className="text-gray-600">Review your answers with source citations</p>
        </div>

        <div className="space-y-6">
          {questions.map((question, idx) => {
            const isCorrect = question.userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
            const hasAnswer = question.userAnswer && question.userAnswer.trim() !== '';

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
                          const isUserAnswer = option === question.userAnswer;
                          const isCorrectAnswer = option === question.correctAnswer;

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
                        {['True', 'False'].map((option) => {
                          const isUserAnswer = option === question.userAnswer;
                          const isCorrectAnswer = option === question.correctAnswer;

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
            onClick={() => setCurrentPage('assessments')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
