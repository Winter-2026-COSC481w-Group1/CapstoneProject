import { useState } from "react";
import { CheckCircle, Circle, CheckSquare, Square, Zap, FileText } from "lucide-react";
import { useApp } from "../AppContext";
import { Assessment } from "../types";

export default function ExamStudio() {
  const {
    libraryFiles,
    assessments,
    setAssessments,
    setCurrentPage,
    currentAssessment,
    setCurrentAssessment,
  } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "multiple-choice",
  ]);
  const [questionCount, setQuestionCount] = useState(15);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );

  const readyFiles = libraryFiles.filter((f) => f.status === "ready");

  const toggleFile = (fileName: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileName)
        ? prev.filter((f) => f !== fileName)
        : [...prev, fileName],
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleGenerate = () => {
    const newAssessment: Assessment = {
      id: Date.now().toString(),
      title: `Assessment ${assessments.length + 1}`,
      createdAt: new Date(),
      status: "new",
      sourceFiles: selectedFiles,
      questionCount,
      difficulty,
      questions: [],
      attempts: {
        attempts: [],
        scores: [],
      },
    };

    setAssessments([...assessments, newAssessment]);
    setCurrentPage("loading");

    setTimeout(() => {
      setCurrentPage("assessments");
    }, 5000);
  };

  const canGenerate = selectedFiles.length > 0 && selectedTypes.length > 0;

  // for testing
  setCurrentAssessment(assessments[0]);

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exam Studio</h1>
          <p className="text-gray-600">Create and edit assessments</p>
        </div>

        {/* Not currently editing an exam */}
        {!currentAssessment && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Source Materials
                </h2>
                <p className="text-gray-600 mb-6">
                  Select files from your library
                </p>

                {readyFiles.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                    <p className="text-gray-600 mb-4">
                      No ready files in your library
                    </p>
                    <button
                      onClick={() => setCurrentPage("library")}
                      className="text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      Go to Library →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {readyFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => toggleFile(file.name)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          selectedFiles.includes(file.name)
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300 bg-white"
                        }`}
                      >
                        {selectedFiles.includes(file.name) ? (
                          <CheckSquare className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">
                            {file.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {file.pageCount} pages
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Question Types
                </h2>
                <p className="text-gray-600 mb-6">Select one or more types</p>

                <div className="grid sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => toggleType("multiple-choice")}
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      selectedTypes.includes("multiple-choice")
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="text-4xl mb-3">📝</div>
                    <div className="font-semibold text-gray-900">
                      Multiple Choice
                    </div>
                    <div className="text-sm text-gray-600 mt-1">4 options</div>
                  </button>

                  <button
                    onClick={() => toggleType("true-false")}
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      selectedTypes.includes("true-false")
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="text-4xl mb-3">✓✗</div>
                    <div className="font-semibold text-gray-900">
                      True/False
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Binary choice
                    </div>
                  </button>

                  <button
                    onClick={() => toggleType("short-answer")}
                    className={`p-6 rounded-2xl border-3 transition-all ${
                      selectedTypes.includes("short-answer")
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="text-4xl mb-3">✍️</div>
                    <div className="font-semibold text-gray-900">
                      Short Answer
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Free text</div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Question Count
                </h2>
                <p className="text-gray-600 mb-6">
                  How many questions to generate?
                </p>

                <div className="space-y-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-3 bg-emerald-100 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(5 150 105) 0%, rgb(5 150 105) ${((questionCount - 5) / 45) * 100}%, rgb(209 250 229) ${((questionCount - 5) / 45) * 100}%, rgb(209 250 229) 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>5</span>
                    <span className="font-bold text-emerald-600 text-2xl">
                      {questionCount}
                    </span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Difficulty Level
                </h2>
                <p className="text-gray-600 mb-6">Choose the challenge level</p>

                <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl">
                  <button
                    onClick={() => setDifficulty("easy")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      difficulty === "easy"
                        ? "bg-white text-emerald-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => setDifficulty("medium")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      difficulty === "medium"
                        ? "bg-white text-emerald-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setDifficulty("hard")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      difficulty === "hard"
                        ? "bg-white text-emerald-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Configuration Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Source Files
                      </div>
                      {selectedFiles.length === 0 ? (
                        <div className="text-sm text-gray-400 italic">
                          None selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-emerald-600">
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900 flex-1 min-w-0">
                                <div className="truncate">{file}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Question Types
                      </div>
                      {selectedTypes.length === 0 ? (
                        <div className="text-sm text-gray-400 italic">
                          None selected
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {type
                                .split("-")
                                .map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                .join(" ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Question Count
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {questionCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Difficulty
                      </div>
                      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                        {difficulty.charAt(0).toUpperCase() +
                          difficulty.slice(1)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      canGenerate
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    Generate Assessment
                  </button>

                  {!canGenerate && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Select at least one file and question type
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* When currently editing an exam */}
        {currentAssessment && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    <textarea
                      defaultValue={currentAssessment.title}
                      className="w-full"
                    />
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Source Files
                      </div>
                      {selectedFiles.length === 0 ? (
                        <div className="text-sm text-gray-400 italic">
                          None selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-emerald-600">
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900 flex-1 min-w-0">
                                <div className="truncate">{file}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Question Types
                      </div>
                      {selectedTypes.length === 0 ? (
                        <div className="text-sm text-gray-400 italic">
                          None selected
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {type
                                .split("-")
                                .map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                .join(" ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pb-4 border-b border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        Question Count
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentAssessment.questionCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Difficulty
                      </div>
                      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                        {currentAssessment.difficulty.charAt(0).toUpperCase() +
                          currentAssessment.difficulty.slice(1)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      canGenerate
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Save Edits
                  </button>

                  {!canGenerate && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Edit at least one question to save
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Questions */}
              {currentAssessment.questions.map((question, idx) => {
                return (
                  <div
                    key={question.id}
                    className="bg-white rounded-3xl p-6 shadow-lg border-2 border-emerald-500"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-500">
                            Question {idx + 1}
                          </span>
                        </div>
                        <h3 className="w-full text-lg font-bold text-gray-900 mb-4">
                          <textarea
                            className="w-full border-2 border-gray-200 rounded-xl p-1"
                            defaultValue={question.question}
                            onChange={(event) => {
                              // a question's value changed
                              console.log("question title change");
                              console.log(event);
                            }}
                          />
                        </h3>

                        {question.type === "multiple-choice" &&
                          question.options && (
                            <div className="space-y-2 mb-4">
                              {question.options.map((option, optIdx) => {
                                return (
                                  <input
                                    key={optIdx}
                                    className="flex items-center w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                                    defaultValue={option}
                                    type="text"
                                    onChange={(event) => {
                                      // a question's value changed
                                      console.log("option value changed");
                                      console.log(event);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}

                        {question.type === "true-false" && (
                          <div className="space-y-2 mb-4">
                            {["True", "False"].map((option) => {
                              const isCorrectAnswer = option === question.correctAnswer;
                              
                              return (
                                <div
                                  key={option}
                                  className="p-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span className="font-medium text-gray-700 w-full">
                                      {option}
                                    </span>
                                    <span className="float-end">
                                      {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                      {!isCorrectAnswer &&
                                        <Circle
                                          className="w-4 h-4 text-red-600 hover:scale-110 transition-transform duration-300"
                                          onClick={() => { question.correctAnswer = option }}
                                        />
                                      }
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {question.type === "short-answer" && (
                          <div className="space-y-3 mb-4">
                            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl">
                              <div className="text-gray-900 font-medium">
                                {question.correctAnswer}
                              </div>
                            </div>
                          </div>
                        )}

                        {question.source && (
                          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                            <div className="flex items-start gap-3">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-blue-900 mb-2">
                                  Source Citation
                                </div>
                                <p className="text-sm text-gray-700 italic mb-2 w-full">
                                  <textarea
                                    defaultValue={question.source.text}
                                    className="w-full rounded-md p-1"
                                  ></textarea>
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-700">
                                  <select
                                    className="font-medium bg-white rounded-sm"
                                    defaultValue={currentAssessment.sourceFiles}
                                  >
                                    {libraryFiles.map((file) => { 
                                      return (<option>{file.name}</option>)
                                    })}
                                  </select>
                                  <div>•</div>
                                  <div>
                                    Page&nbsp;
                                    <input
                                      type="number"
                                      defaultValue={question.source.page}
                                      className="rounded-sm"
                                    />
                                  </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
