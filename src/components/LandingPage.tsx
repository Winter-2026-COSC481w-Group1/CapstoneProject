import { BookOpen, ClipboardCheck, Zap, ArrowRight, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../supabase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [startText, setStartText] = useState("");
  
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setStartText("Go to Dashboard");
      } else {
        setStartText("Get Started");
      }
    }
    
    getUser();
  });
  
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              100% Free for Students
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Upload Your Notes,{' '}
              <span className="text-emerald-600">Ace Your Exams</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Turn your lecture slides and textbook PDFs into personalized practice tests in seconds. Study smarter, not harder.
            </p>

            <button
              onClick={() => {
                if (isLoggedIn)
                  navigate('/dashboard/home');
                else
                  navigate('/auth');
              }}
              className="group inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Typewriter text={startText} />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-20 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-100/20 to-transparent blur-3xl"></div>
              <DemoQuestionCard />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Three simple steps to better exam prep</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative h-full">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow h-full">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Your Materials</h3>
              <p className="text-gray-600">
                Drop in your lecture slides, textbook chapters, or any PDF — we'll read and understand them for you.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="w-8 h-0.5 border-t-2 border-dashed border-emerald-400"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="relative h-full">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow h-full">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Generate Practice Tests</h3>
              <p className="text-gray-600">
                Pick your topics, choose question types, and set the difficulty. Your custom practice test is ready in seconds.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="w-8 h-0.5 border-t-2 border-dashed border-emerald-400"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow h-full">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <ClipboardCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Study & Track Your Progress</h3>
            <p className="text-gray-600">
              Take your tests, get instant grading, and see exactly what you need to review before the real exam.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Stop Guessing What'll Be on the Exam
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Examable is completely free. Upload your notes and start studying smarter today.
          </p>
          <button
            onClick={
              () => {
                if (isLoggedIn)
                  navigate('/dashboard/home');
                else
                  navigate('/auth');
              }
            }
            className="inline-flex items-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
          >
            Get Started — It's Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


function DemoQuestionCard() {
  const [selected, setSelected] = useState<number | null>(null);

  const options = [
    "It stores genetic information",
    "It is the site of photosynthesis",
    "It generates ATP for the cell",
    "It controls what enters and exits the cell",
  ];

  return (
    <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-3xl mx-auto overflow-hidden">
      {/* Progress bar - mimics the exam top bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 sm:px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Biology 101 — Midterm Review</h4>
            <p className="text-xs text-gray-500">Question 1 of 15</p>
          </div>
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center ${
                  i === 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
            <div className="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center bg-gray-100 text-gray-400">
              ···
            </div>
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: '7%' }}></div>
        </div>
      </div>

      {/* Question body */}
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Multiple Choice
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed">
            What is the primary function of the chloroplast in a plant cell?
          </h3>
        </div>

        {/* Options - matching ExamMode radio style with feedback overlay */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const isCorrect = index === 1; // "photosynthesis" is correct
            const isSelected = selected === index;
            const showFeedback = selected !== null;

            let bgColor = "bg-white";
            let borderColor = "border-gray-200";
            let textColor = "text-gray-900";
            let radioColor = "border-gray-300";
            let radioInnerColor = "bg-white";

            if (isSelected) {
              if (isCorrect) {
                bgColor = "bg-emerald-50";
                borderColor = "border-emerald-500";
                textColor = "text-emerald-900";
                radioColor = "border-emerald-500 bg-emerald-500";
                radioInnerColor = "bg-white";
              } else {
                bgColor = "bg-red-50";
                borderColor = "border-red-500";
                textColor = "text-red-900";
                radioColor = "border-red-500 bg-red-500";
                radioInnerColor = "bg-white";
              }
            } else if (showFeedback && isCorrect) {
               // Optionally show correct answer if user guessed wrong
               bgColor = "bg-emerald-50/50";
               borderColor = "border-emerald-200";
            }

            return (
              <button
                key={index}
                onClick={() => setSelected(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${bgColor} ${borderColor} ${showFeedback ? "" : "hover:border-emerald-300"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${radioColor}`}>
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${radioInnerColor}`}></div>
                      )}
                    </div>
                    <span className={`font-medium transition-colors ${textColor}`}>{option}</span>
                  </div>
                  
                  {isSelected && (
                    <span className={`text-sm font-bold uppercase tracking-wider ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Source citation - appears after selecting, matching GradingReport's blue style */}
        {selected !== null && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 mb-1">Source Citation</div>
                <p className="text-sm text-gray-700 italic mb-2">"Chloroplasts are organelles found in plant cells that convert light energy into chemical energy through the process of photosynthesis."</p>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <span className="font-medium">Biology 101 — Lecture 4.pdf</span>
                  <span>•</span>
                  <span>Page 42</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt to try */}
        {selected === null && (
          <p className="text-center text-sm text-gray-400 mt-6 animate-pulse">👆 Try selecting an answer</p>
        )}
      </div>
    </div>
  );
}

function Typewriter({ text = "", speed = 50 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); // reset when text changes

    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}