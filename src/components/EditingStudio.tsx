import { useState } from "react";
import { CheckCircle, Circle, FileText, X, Plus } from "lucide-react";
import { useApp } from "../AppContext";
import { Assessment } from "../types";

export default function EditingStudio() {
  const {
    libraryFiles,
    assessments,
    setCurrentPage,
    currentAssessment,
    setCurrentAssessment,
  } = useApp();

  const [isEdited, setIsEdited] = useState(false);
  
  if (!currentAssessment) {
    setCurrentPage('assessments');
    return null;
  }

  const handleDifficultyChange = function (difficulty: string) {
    // validate
    if (
      difficulty != "none" &&
      difficulty != "easy" &&
      difficulty != "medium" &&
      difficulty != "hard"
    )
      return;
    if (!currentAssessment) return;

    // assign with no re-render
    currentAssessment.difficulty = difficulty;
    setIsEdited(true);
  };

  const handleSaving = function () {
    console.log("saved!");
    // TODO actually save the currentAssessment
    if (currentAssessment) {
      const assessmentIndex = assessments.findIndex((test) => test.id === currentAssessment.id );
      if (assessmentIndex >= 0)
        assessments[assessmentIndex] = currentAssessment; // saves into the assessments in local state
      // this is where an api call is necessary
    }
    setIsEdited(false);
  };

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
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              <textarea
                defaultValue={currentAssessment.title}
                className="w-full"
                onChange={(e) => {
                  currentAssessment.title = e.target.value;
                  setIsEdited(true);
                }}
              />
            </h3>

            <div className="space-y-4 mb-6">
              <div className="pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Source Files
                </div>
                {currentAssessment.sourceFiles.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">
                    None selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentAssessment.sourceFiles.map((file, idx) => (
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
                <div className="text-sm text-gray-600 mb-2">Difficulty</div>
                <select
                  defaultValue={
                    currentAssessment.difficulty.charAt(0).toUpperCase() +
                    currentAssessment.difficulty.slice(1)
                  }
                  className="text-left bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium appearance-none"
                  onChange={(e) => {
                    handleDifficultyChange(e.target.value.toLowerCase());
                  }}
                >
                  <option className="bg-white">None</option>
                  <option className="bg-white">Easy</option>
                  <option className="bg-white">Medium</option>
                  <option className="bg-white">Hard</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaving}
              disabled={!isEdited}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                isEdited
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Save Edits
            </button>

            {!isEdited && (
              <p className="text-sm text-gray-500 text-center mt-3">
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
              className="bg-white rounded-3xl p-6 shadow-lg border-2 border-emerald-500"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm w-full font-semibold text-gray-500">
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
                      className="text-sm font-semibold text-gray-600 rounded-lg appearance-none p-1 border-2 border-gray-200"
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
                    <span className="text-sm font-semibold text-gray-500">
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
                            changedAssessment.questions.map((question) => {
                              if (question.source) {
                                return question.source.fileName;
                              } else return "None Selected"; // this is also an option a source can have that should be ignored
                            }),
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
                  <h3 className="w-full text-lg font-bold text-gray-900 mb-4">
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl p-1"
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
                                className="flex items-center w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50"
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
                            <div className="flex items-center w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50">
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
                        className="w-full text-gray-900 font-medium p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg"
                        defaultValue={question.correctAnswer}
                        onChange={(e) => {
                          question.options![0] = e.target.value;
                          setIsEdited(true);
                        }}
                      ></textarea>
                    </div>
                  )}

                  {question.source && (
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="w-full inline-flex text-sm font-semibold text-blue-900 mb-2">
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
                                    (question) => {
                                      if (question.source) {
                                        return question.source.fileName;
                                      } else return "None Selected";
                                    },
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
                          <p className="text-sm text-gray-700 italic mb-2 w-full">
                            <textarea
                              defaultValue={question.source.text}
                              className="w-full rounded-md p-1"
                              onChange={(e) => {
                                question.source!.text = e.target.value;
                                setIsEdited(true);
                              }}
                            ></textarea>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <select
                              className="font-medium bg-white rounded-sm"
                              defaultValue={question.source.fileName}
                              onChange={(e) => {
                                const changedAssessment =
                                  structuredClone(currentAssessment);
                                changedAssessment.questions[
                                  idx
                                ].source!.fileName = e.target.value;
                                const sourceFilesSet = new Set(
                                  changedAssessment.questions.map(
                                    (question) => {
                                      if (question.source) {
                                        return question.source.fileName;
                                      } else return "None Selected";
                                    },
                                  ),
                                );
                                sourceFilesSet.delete("None Selected");
                                changedAssessment.sourceFiles =
                                  Array.from(sourceFilesSet);
                                setCurrentAssessment(changedAssessment);
                                setIsEdited(true);
                              }}
                            >
                              <option key="0">None Selected</option>
                              {libraryFiles.map((file, fileNum) => {
                                return (
                                  <option key={fileNum}>{file.name}</option>
                                );
                              })}
                            </select>
                            <div>•</div>
                            <div>
                              Page&nbsp;
                              <input
                                type="number"
                                defaultValue={question.source.page}
                                className="rounded-sm"
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
                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="w-full inline-flex text-sm font-semibold text-blue-900">
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
                                  fileName: "None Selected",
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
