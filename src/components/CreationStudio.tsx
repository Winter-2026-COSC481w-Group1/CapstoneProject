import { useState } from "react";
import { CheckSquare, Square, Zap, ChevronRight, BookOpen } from "lucide-react";
import { useApp } from "../AppContext";
import { useToast } from '../ToastContext';
import { supabaseClient } from "../supabase";
import { post } from "../api";
import { useNavigate } from "react-router-dom";
import LoadingRoom from "./LoadingRoom";

export default function CreationStudio() {
  const navigate = useNavigate();

  const { libraryFiles, fetchAssessmentDetails, setAssessments } = useApp();
  const { showToast } = useToast();

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "multiple-choice",
  ]);
  const [questionCount, setQuestionCount] = useState(15);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );

  const readyFiles = libraryFiles.filter((f) => f.status === "ready");

  const [topic, setTopic] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleFile = (fileName: string) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.includes(fileName);
      if (isSelected) {
        // When unselecting a file, also remove its sections
        const file = libraryFiles.find(f => f.name === fileName);
        if (file?.sections) {
          const sectionTitles = file.sections.map(s => s.title);
          setSelectedSections(curr => curr.filter(s => !sectionTitles.includes(s)));
        }
        return prev.filter((f) => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  const toggleSection = (sectionTitle: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((s) => s !== sectionTitle)
        : [...prev, sectionTitle],
    );
  };

  function toggleType(type: string) {
    console.log("DEBUG: toggleType called with", type);
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );
  }

  const handleGenerate = async () => {
    // find file opject
    const selectedFileObjects = libraryFiles.filter((f) =>
      selectedFiles.includes(f.name),
    );

    // collect the document id's of the files
    const documentIds = selectedFileObjects.map(file => file.id);

    const requestBody = {
      document_ids: documentIds,
      sections: selectedSections.length > 0 ? selectedSections : null,
      query: topic, // topic/query
      title: assessmentTitle,
      num_questions: questionCount,
      difficulty: difficulty,
      question_types: selectedTypes.map((t) => t.replace("-", "_")), // match 'multiple_choice' backend format
    };

    const tempAssessmentId = `temp-${crypto.randomUUID()}`;
    const optimisticAssessment: Assessment = {
      id: tempAssessmentId,
      title: assessmentTitle.trim() || `Assessment: ${topic || "Untitled"}`,
      topic,
      createdAt: new Date(),
      status: "pending",
      sourceFiles: documentIds,
      questionCount: questionCount,
      difficulty,
      numAttempts: 0,
      numCorrect: 0,
      questions: [],
    };

    try {
      setIsGenerating(true);
      //get session token
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error("no session token available");
        setIsGenerating(false);
        return;
      }

      const createdAssessmentId = await post(
        "api/v1/assessments",
        requestBody,
        session.access_token,
      );

      // Refresh list then navigate to Hub
      await fetchAssessments();
      navigate("/dashboard/assessments");
    } catch (error) {
      // Remove temporary pending card when generation request fails.
      setAssessments((prevAssessments) =>
        prevAssessments.filter((assessment) => assessment.id !== tempAssessmentId),
      );
      console.error("Generation error:", error);
      showToast("error", "Assessment Failed", `${optimisticAssessment.title} failed to generate`);
      navigate("/dashboard/exam-studio");
    }
  };

  const canGenerate = selectedFiles.length > 0 && selectedTypes.length > 0;

  // Get sections for all selected files
  const availableSections = libraryFiles
    .filter(f => selectedFiles.includes(f.name))
    .flatMap(f => (f.sections || []).map(s => ({ ...s, fileName: f.name })));

  return (
    <>
      {isGenerating && <LoadingRoom isOverlay />}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">Assessment Title</h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">Give your assessment a name</p>
            <input
              type="text"
              value={assessmentTitle}
              onChange={(e) => setAssessmentTitle(e.target.value)}
              placeholder="e.g. Biology Midterm Review"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 outline-none transition-all dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">
              Source Materials
            </h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">Select files from your library</p>

            {readyFiles.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl dark:border-slate-700">
                <p className="text-gray-600 mb-4 dark:text-slate-300">
                  No ready files in your library
                </p>
                <button
                  onClick={() => navigate("/dashboard/library")}
                  className="text-emerald-600 font-medium hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedFiles.includes(file.name)
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400"
                      : "border-gray-200 hover:border-emerald-300 bg-white dark:bg-slate-950 dark:border-slate-700 dark:hover:border-emerald-400"
                      }`}
                  >
                    {selectedFiles.includes(file.name) ? (
                      <CheckSquare className="w-6 h-6 text-emerald-600 flex-shrink-0 dark:text-emerald-300" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-400 flex-shrink-0 dark:text-slate-500" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-slate-100">
                        {file.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {file.pageCount} pages • {file.sections?.length || 0} sections
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedFiles.length > 0 && availableSections.length > 0 && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">Chapters / Sections</h2>
              </div>
              <p className="text-gray-600 mb-6">Refine your assessment by selecting specific chapters (optional)</p>

              <div className="grid sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {availableSections.map((section, idx) => (
                  <button
                    key={`${section.fileName}-${section.title}-${idx}`}
                    onClick={() => toggleSection(section.title)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedSections.includes(section.title)
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-100 hover:border-emerald-200 bg-gray-50/50"
                      }`}
                  >
                    {selectedSections.includes(section.title) ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {section.title}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
                        <span className="truncate max-w-[100px]">{section.fileName}</span>
                        <ChevronRight className="w-2 h-2" />
                        <span>Page {section.page_number}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedSections.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => setSelectedSections([])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Clear Section Filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Topics</h2>
            <p className="text-gray-600 mb-6">
              Enter chapters or subjects. Use a <strong>comma</strong> to separate multiple topics.
            </p>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Mitosis, ATP"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 outline-none transition-all dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            {/* The "Card" Display */}
            {topic.includes(',') && (
              <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                {topic
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t !== "")
                  .map((cleanTopic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {cleanTopic}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">
              Question Types
            </h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">Select one or more types</p>

            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => toggleType("multiple-choice")}
                className={`p-6 rounded-2xl border-3 transition-all ${selectedTypes.includes("multiple-choice")
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400"
                  : "border-gray-200 hover:border-emerald-300 bg-white dark:bg-slate-950 dark:border-slate-700 dark:hover:border-emerald-400"
                  }`}
              >
                <div className="text-4xl mb-3">📝</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">
                  Multiple Choice
                </div>
                <div className="text-sm text-gray-600 mt-1 dark:text-slate-400">4 options</div>
              </button>

              <button
                onClick={() => toggleType("true-false")}
                className={`p-6 rounded-2xl border-3 transition-all ${selectedTypes.includes("true-false")
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400"
                  : "border-gray-200 hover:border-emerald-300 bg-white dark:bg-slate-950 dark:border-slate-700 dark:hover:border-emerald-400"
                  }`}
              >
                <div className="text-4xl mb-3">✓✗</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">True/False</div>
                <div className="text-sm text-gray-600 mt-1 dark:text-slate-400">Binary choice</div>
              </button>

              <button
                onClick={() => toggleType("short-answer")}
                className={`p-6 rounded-2xl border-3 transition-all ${selectedTypes.includes("short-answer")
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400"
                  : "border-gray-200 hover:border-emerald-300 bg-white dark:bg-slate-950 dark:border-slate-700 dark:hover:border-emerald-400"
                  }`}
              >
                <div className="text-4xl mb-3">✍️</div>
                <div className="font-semibold text-gray-900 dark:text-slate-100">Short Answer</div>
                <div className="text-sm text-gray-600 mt-1 dark:text-slate-400">Free text</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">
              Question Count
            </h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">
              How many questions to generate?
            </p>

            <div className="space-y-4">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-3 bg-emerald-100 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(5 150 105) 0%, rgb(5 150 105) ${((questionCount - 5) / 45) * 100}%, rgb(209 250 229) ${((questionCount - 5) / 45) * 100}%, rgb(209 250 229) 100%)`,
                }}
              />
              <div className="flex justify-between text-sm text-gray-600 dark:text-slate-300">
                <span>5</span>
                <span className="font-bold text-emerald-600 text-2xl dark:text-emerald-300">
                  {questionCount}
                </span>
                <span>50</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">
              Difficulty Level
            </h2>
            <p className="text-gray-600 mb-6 dark:text-slate-300">Choose the challenge level</p>

            <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl dark:bg-slate-800">
              <button
                onClick={() => setDifficulty("easy")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${difficulty === "easy"
                  ? "bg-white text-green-600 shadow-md dark:bg-slate-950 dark:text-green-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficulty("medium")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${difficulty === "medium"
                  ? "bg-white text-amber-600 shadow-md dark:bg-slate-950 dark:text-amber-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
              >
                Medium
              </button>
              <button
                onClick={() => setDifficulty("hard")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${difficulty === "hard"
                  ? "bg-white text-red-600 shadow-md dark:bg-slate-950 dark:text-red-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100"
                  }`}
              >
                Hard
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 dark:text-slate-100">
                Configuration Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">Assessment Title</div>
                  <div className="text-sm font-semibold text-gray-900 truncate dark:text-slate-100">
                    {assessmentTitle || <span className="text-gray-400 italic dark:text-slate-500">No custom title</span>}
                  </div>
                </div>

                <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">Source Files</div>
                  {selectedFiles.length === 0 ? (
                    <div className="text-sm text-gray-400 italic dark:text-slate-500">
                      None selected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5 dark:bg-emerald-500/10">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 flex-1 min-w-0 dark:text-slate-100">
                            <div className="truncate">{file}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSections.length > 0 && (
                  <div className="pb-4 border-b border-gray-200 animate-in slide-in-from-left-2 duration-300">
                    <div className="text-sm text-gray-600 mb-2 font-semibold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Filtered Chapters ({selectedSections.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSections.map((sec, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-stone-200 max-w-full truncate">
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pb-4 border-b border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Target Topics</div>
                  {topic.trim() === "" ? (
                    <div className="text-sm text-gray-400 italic dark:text-slate-500">
                      No topics specified
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {topic
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t !== "")
                        .map((cleanTopic, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"
                          >
                            {cleanTopic}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">
                    Question Types
                  </div>
                  {selectedTypes.length === 0 ? (
                    <div className="text-sm text-gray-400 italic dark:text-slate-500">
                      None selected
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedTypes.map((type) => (
                        <span
                          key={type}
                          onClick={() => toggleType(type)}
                          className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-emerald-200 transition-colors"
                        >
                          {type
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
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
                    {questionCount}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 dark:text-slate-300">Difficulty</div>
                  {difficulty === "easy" && (
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-green-500/10 dark:text-green-300">
                      Easy
                    </div>)}
                  {difficulty === "medium" &&
                    (<div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-amber-500/10 dark:text-amber-300">
                      Medium
                    </div>)}
                  {difficulty === "hard" &&
                    (<div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-red-500/10 dark:text-red-300">
                      Hard
                    </div>)}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${canGenerate
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                  }`}
              >
                <Zap className="w-5 h-5" />
                Generate Assessment
              </button>

              {!canGenerate && (
                <p className="text-sm text-gray-500 text-center mt-3 dark:text-slate-400">
                  Select at least one file and question type
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
