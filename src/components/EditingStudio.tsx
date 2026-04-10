import { useEffect, useRef, useState } from "react";
import { CheckCircle, Circle, FileText, X, Plus, ChevronDown } from "lucide-react";
import { useApp } from "../AppContext";
import { Assessment } from "../types";
import { put } from '../api';
import { supabaseClient } from '../supabase';

export default function EditingStudio() {
  const {
    libraryFiles,
    assessments,
    currentAssessment,
    setAssessments,
    setCurrentAssessment,
  } = useApp();

  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const difficultyDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedDifficulty = (currentAssessment?.difficulty || "medium").toLowerCase();
  const difficultyStyles: Record<string, string> = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };
  const difficultySizes: Record<string, string> = {
    easy: "w-24",
    medium: "w-28",
    hard: "w-24",
  };

  const handleDifficultyChange = function (difficulty: string) {
    // validate
    if (
      difficulty != "easy" &&
      difficulty != "medium" &&
      difficulty != "hard"
    )
      return;
    if (!currentAssessment) return;

    const changedAssessment: Assessment = structuredClone(currentAssessment);
    changedAssessment.difficulty = difficulty;
    setCurrentAssessment(changedAssessment);
    setIsEdited(true);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!difficultyDropdownRef.current) return;
      if (!difficultyDropdownRef.current.contains(event.target as Node)) {
        setIsDifficultyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSaving = async function () {
    if (!currentAssessment || isSaving || currentAssessment.questions.length == 0) return;
    
    setIsSaving(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error('No session token available');
        return;
      }

      const types = Array.from(new Set(currentAssessment.questions.map(q => q.type)));
      const questions = currentAssessment.questions.map(q => ({
        type: q.type,
        question: q.question,
        numOptions: q.numOptions,
        options: q.options || [],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(q.correctAnswer as string),
        source_text: q.source?.text || '',
        page_number: q.source?.page || 0,
        document_id: q.source?.document_id || '',
      }));

      const data = {
        title: currentAssessment.title,
        types,
        difficulty: currentAssessment.difficulty,
        questions,
        topic: currentAssessment.topic,
      };

      await put(`api/v1/assessments/${currentAssessment.id}`, data, session.access_token);

      // Update local state
      const updatedAssessment = structuredClone(currentAssessment);
      setCurrentAssessment(updatedAssessment);
      
      // if this is a newly created assessment, make sure to add it to the assessments list
      if (assessments.filter(assessment => assessment.id === currentAssessment.id).length === 0)
        setAssessments([updatedAssessment, ...assessments]);
      else {
        // otherwise update the assessment that is already in the assessments list
        const updatedAssessments = assessments.map((test) =>
          test.id === updatedAssessment.id ? { ...updatedAssessment } : test,
        );
        setAssessments(updatedAssessments);
      }

      setIsEdited(false);
    } catch (error) {
      console.error('Error updating assessment:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  useEffect(() => {
    if (!currentAssessment) {
      // create a blank assessment and save it automatically
      const blankAssessment: Assessment = {
        id: crypto.randomUUID(), // equivalent to the python method (uuid4) used
        title: "Empty Assessment",
        topic: "",
        createdAt: new Date(),
        status: 'ready',
        sourceFiles: [],
        questionCount: 0,
        difficulty: 'medium',
        numAttempts: 0,
        numCorrect: 0,
        questions: [],
      };
      setCurrentAssessment(blankAssessment);
      setIsEdited(true);
    }
  });
  
  if (!currentAssessment) {
    return null;
  }

  const handleCorrectOptionChange = function (
    questionNum: number,
    correctAnswer: number,
  ) {
    if (!currentAssessment) return;
    const changedAssessment: Assessment = structuredClone(currentAssessment);
    changedAssessment.questions[questionNum].correctAnswer = correctAnswer;
    setCurrentAssessment(structuredClone(changedAssessment));
    setIsEdited(true);
  };

  return ( 
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-28">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h3 className="text-xl font-bold text-gray-900 mb-6 dark:text-slate-100">
              <textarea
                defaultValue={currentAssessment.title}
                className="w-full bg-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                onChange={(e) => {
                  currentAssessment.title = e.target.value;
                  setIsEdited(true);
                }}
              />
            </h3>

            <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">
                  Source Files
                </div>
                {currentAssessment.sourceFiles.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">
                    None selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentAssessment.sourceFiles.map((file, idx) => {
                      const fileName = libraryFiles.find((lib) => lib.id === file)?.name || file;
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-emerald-600">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 flex-1 min-w-0 dark:text-slate-100">
                            <div className="truncate">{fileName}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">
                  Question Types
                </div>
                {new Set(
                  currentAssessment.questions.map(
                    (question) => question.type,
                  ),
                ).size === 0 ? (
                  <div className="text-sm text-gray-400 italic">None</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set(
                        currentAssessment.questions.map(
                          (question) => question.type,
                        ),
                      ),
                    ).map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium dark:bg-emerald-500/10 dark:text-emerald-300"
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

              <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">
                  Question Count
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {currentAssessment.questionCount}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">Difficulty</div>
                <div
                  ref={difficultyDropdownRef}
                  className={`relative inline-block ${difficultySizes[selectedDifficulty] || difficultySizes.medium}`}
                >
                  <button
                    type="button"
                    className={`relative rounded-full px-4 py-1 pr-8 text-sm font-medium transition-colors ${difficultyStyles[selectedDifficulty] || difficultyStyles.medium}`}
                    onClick={() => {
                      setIsDifficultyOpen((prev) => !prev);
                    }}
                  >
                    <span className="block text-center capitalize">{selectedDifficulty}</span>
                    <ChevronDown
                      className={`pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform ${isDifficultyOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDifficultyOpen && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {(["easy", "medium", "hard"] as const).map((difficulty) => (
                        <button
                          key={difficulty}
                          type="button"
                          className={`w-full px-2 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 ${selectedDifficulty === difficulty ? "font-semibold" : "font-medium"}`}
                          onClick={() => {
                            handleDifficultyChange(difficulty);
                            setIsDifficultyOpen(false);
                          }}
                        >
                          <span className="block text-center capitalize">{difficulty}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => { handleSaving(); }}
              disabled={!isEdited || isSaving}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                isEdited && !isSaving && currentAssessment.questions.length != 0
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {isSaving ? "Saving..." : "Save Edits"}
            </button>

            {!isEdited && (
              <p className="text-sm text-gray-500 text-center mt-3 dark:text-slate-400">
                Edit something to save
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
              className="bg-white rounded-3xl p-6 shadow-lg border-2 border-emerald-500 dark:bg-slate-900 dark:border-emerald-400 dark:shadow-black/20"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm w-full font-semibold text-gray-500 dark:text-slate-400">
                      Question {idx + 1}
                    </span>
                    <select
                      defaultValue={
                        question.type === "multiple-choice"
                          ? "Multiple Choice"
                          : question.type === "true-false"
                            ? "True/False"
                            : question.type === "short-answer"
                              ? "Short Answer"
                              : "Short Answer"
                      }
                      className="text-sm font-semibold text-gray-600 rounded-lg appearance-none p-1 border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      onChange={(e) => {
                        const changedAssessment =
                          structuredClone(currentAssessment);
                        const changedQuestion =
                          changedAssessment.questions[idx];
                        switch (e.target.value) {
                          case "Multiple Choice":
                            changedQuestion.type = "multiple-choice";
                            changedQuestion.correctAnswer = 0;
                            changedQuestion.numOptions = 4;
                            changedQuestion.options = ["", "", "", ""];
                            break;
                          case "True/False":
                            changedQuestion.type = "true-false";
                            changedQuestion.correctAnswer = 0;
                            changedQuestion.numOptions = 2;
                            changedQuestion.options = ["True", "False"];
                            break;
                          case "Short Answer":
                            changedQuestion.type = "short-answer";
                            changedQuestion.correctAnswer = 0;
                            changedQuestion.numOptions = 0;
                            changedQuestion.options = undefined;
                            break;
                        }

                        setCurrentAssessment(changedAssessment);
                        setIsEdited(true);
                      }}
                    >
                      <option>Multiple Choice</option>
                      <option>True/False</option>
                      <option>Short Answer</option>
                    </select>
                    <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                      <X
                        className="w-6 h-6 hover:text-red-600 hover:scale-110 transition-transform duration-300"
                        onClick={() => {
                          // delete this question
                          const changedAssessment =
                            structuredClone(currentAssessment);
                          changedAssessment.questions.splice(idx, 1);
                          changedAssessment.questionCount =
                            changedAssessment.questions.length;
                          const sourceFilesSet = new Set(
                            changedAssessment.questions.map((question) => question.source?.document_id || "None Selected"),
                          );
                          sourceFilesSet.delete("None Selected");
                          changedAssessment.sourceFiles =
                            Array.from(sourceFilesSet);
                          setCurrentAssessment(changedAssessment);
                          setIsEdited(true);
                        }}
                      />
                    </span>
                  </div>
                  <h3 className="w-full text-lg font-bold text-gray-900 mb-4 dark:text-slate-100">
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl p-1 bg-white text-gray-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                      defaultValue={question.question}
                      onChange={(event) => {
                        // a question's value changed
                        currentAssessment.questions[idx].question =
                          event.target.value;
                        setIsEdited(true);
                      }}
                    />
                  </h3>

                  {question.type === "multiple-choice" &&
                    question.options && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIdx) => {
                          const isCorrectAnswer =
                            optIdx === question.correctAnswer;

                          return (
                            <div
                              className="flex items-center gap-2 w-full"
                              key={optIdx}
                            >
                              <input
                                className="flex items-center w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                                defaultValue={option}
                                type="text"
                                onChange={(event) => {
                                  // an option's value changed
                                  question.options![optIdx] = event.target.value;
                                  setIsEdited(true);
                                }}
                              />
                              <span className="float-end">
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                )}
                                {!isCorrectAnswer && (
                                  <Circle
                                    className="w-4 h-4 text-red-600 hover:scale-110 transition-transform duration-300"
                                    onClick={() => {
                                      // Edit a copy of the currentAssessment and then reassign to trigger an update
                                      handleCorrectOptionChange(
                                        idx,
                                        optIdx,
                                      );
                                    }}
                                  />
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {question.type === "true-false" && (
                    <div className="space-y-2 mb-4">
                      {(question.options ?? ["True", "False"]).map((option, optIdx) => {
                        const isCorrectAnswer =
                          optIdx === question.correctAnswer;

                        return (
                          <div
                            className="flex items-center gap-2 w-full"
                            key={optIdx}
                          >
                            <div className="flex items-center w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {option}
                            </div>
                            <span className="float-end">
                              {isCorrectAnswer && (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              )}
                              {!isCorrectAnswer && (
                                <Circle
                                  className="w-4 h-4 text-red-600 hover:scale-110 transition-transform duration-300"
                                  onClick={() => {
                                    // Edit a copy of the currentAssessment and then reassign to trigger an update
                                    handleCorrectOptionChange(idx, optIdx);
                                  }}
                                />
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="space-y-3 mb-4">
                      <textarea
                        className="w-full text-gray-900 font-medium p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-slate-100"
                        defaultValue={String(question.options && question.options[0] || '')}
                        onChange={(e) => {
                          question.options![0] = e.target.value;
                          setIsEdited(true);
                        }}
                      ></textarea>
                    </div>
                  )}

                  {question.source && (
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg dark:bg-blue-500/10 dark:border-blue-400">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 dark:text-blue-300" />
                        <div className="flex-1">
                          <div className="w-full inline-flex text-sm font-semibold text-blue-900 mb-2 dark:text-blue-200">
                            <span className="w-full">Source Citation</span>
                            <X
                              className="w-6 h-6 hover:scale-110 transition-transform duration-300"
                              onClick={() => {
                                const changedAssessment =
                                  structuredClone(currentAssessment);
                                changedAssessment.questions[idx].source =
                                  undefined;
                                const sourceFilesSet = new Set(
                                  changedAssessment.questions.map(
                                    (question) => question.source?.document_id || "None Selected",
                                  ),
                                );
                                sourceFilesSet.delete("None Selected");
                                changedAssessment.sourceFiles =
                                  Array.from(sourceFilesSet);
                                setCurrentAssessment(changedAssessment);
                                setIsEdited(true);
                              }}
                            ></X>
                          </div>
                          <p className="text-sm text-gray-700 italic mb-2 w-full dark:text-slate-300">
                            <textarea
                              defaultValue={question.source.text}
                              className="w-full rounded-md p-1 dark:bg-slate-900 dark:text-slate-100"
                              onChange={(e) => {
                                question.source!.text = e.target.value;
                                setIsEdited(true);
                              }}
                            ></textarea>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <select
                              className="font-medium bg-white rounded-sm dark:bg-slate-900 dark:text-slate-100"
                              value={question.source.document_id || ""}
                              onChange={(e) => {
                                const changedAssessment =
                                  structuredClone(currentAssessment);
                                const selectedId = e.target.value;
                                const selectedFile = libraryFiles.find(
                                  (file) => file.id === selectedId,
                                );

                                changedAssessment.questions[idx].source!.document_id = selectedId;
                                changedAssessment.questions[idx].source!.document_name =
                                  selectedFile?.name || "";
                                const sourceFilesSet = new Set(
                                  changedAssessment.questions.map(
                                    (question) => question.source?.document_id || "None Selected",
                                  ),
                                );
                                sourceFilesSet.delete("None Selected");
                                changedAssessment.sourceFiles =
                                  Array.from(sourceFilesSet);
                                setCurrentAssessment(changedAssessment);
                                setIsEdited(true);
                              }}
                            >
                              <option key="0" value="">None Selected</option>
                              {libraryFiles.map((file) => {
                                return (
                                  <option key={file.id} value={file.id}>
                                    {file.name}
                                  </option>
                                );
                              })}
                            </select>
                            <div>•</div>
                            <div>
                              Page&nbsp;
                                <input
                                type="number"
                                defaultValue={question.source.page}
                                className="rounded-sm dark:bg-slate-900 dark:text-slate-100"
                                onChange={(e) => {
                                  question.source!.page = Number(
                                    e.target.value,
                                  );
                                  setIsEdited(true);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!question.source && (
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg dark:bg-blue-500/10 dark:border-blue-400">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 dark:text-blue-300" />
                        <div className="flex-1">
                          <div className="w-full inline-flex text-sm font-semibold text-blue-900 dark:text-blue-200">
                            <span className="w-full">
                              No Source Citation
                            </span>
                            <Plus
                              className="w-6 h-6 hover:scale-110 transition-transform duration-300"
                              onClick={() => {
                                const changedAssessment =
                                  structuredClone(currentAssessment);
                                changedAssessment.questions[idx].source = {
                                  text: "",
                                  page: 0,
                                  document_id: "",
                                  document_name: "None Selected",
                                };
                                setCurrentAssessment(changedAssessment);
                                setIsEdited(true);
                              }}
                            ></Plus>
                            <div />
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

        {/* Add Question button*/}
        <button
          onClick={() => {
            const changedAssessment = structuredClone(currentAssessment);
            changedAssessment.questions.push({
              id: "q" + currentAssessment.questions.length + 1,
              type: "multiple-choice",
              question: "",
              options: ["", "", "", ""],
              correctAnswer: 0,
              numOptions: 4,
              source: undefined,
            });
            changedAssessment.questionCount =
              changedAssessment.questions.length;
            setCurrentAssessment(changedAssessment);
            setIsEdited(true);
          }}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all border-blue-200 hover:border-blue-300 border-2 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-lg hover:shadow-xl"
        >
          Add a question
        </button>
      </div>
    </div>
  );
}
