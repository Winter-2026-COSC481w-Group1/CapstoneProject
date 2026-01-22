import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useApp } from '../AppContext';

export default function ExamMode() {
  const { currentAssessment, setCurrentPage, assessments, setAssessments } = useApp();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!currentAssessment) {
    setCurrentPage('assessments');
    return null;
  }

  const questions = currentAssessment.questions;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [question.id]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const updatedQuestions = questions.map(q => ({
      ...q,
      userAnswer: answers[q.id] || ''
    }));

    const correctCount = updatedQuestions.filter(q =>
      q.userAnswer?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
    ).length;

    const score = Math.round((correctCount / questions.length) * 100);

    const updatedAssessment = {
      ...currentAssessment,
      status: 'completed' as const,
      score,
      questions: updatedQuestions
    };

    setAssessments(
      assessments.map(a => a.id === currentAssessment.id ? updatedAssessment : a)
    );

    setCurrentPage('grading-report');
  };

  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentAssessment.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <button
              onClick={() => setCurrentPage('assessments')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save & Exit
            </button>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
              {question.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
              {question.question}
            </h2>
          </div>

          <div className="space-y-3">
            {question.type === 'multiple-choice' && question.options && (
              <>
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[question.id] === option
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[question.id] === option
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-gray-900 font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {question.type === 'true-false' && (
              <>
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[question.id] === option
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[question.id] === option
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-gray-900 font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </>
            )}

            {question.type === 'short-answer' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[150px] resize-none"
              />
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-lg font-semibold text-sm transition-all ${
                  idx === currentQuestion
                    ? 'bg-emerald-600 text-white'
                    : answers[questions[idx].id]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Submit
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
