import CreationStudio from "./CreationStudio";
import EditingStudio from "./EditingStudio";
import { useState } from "react";
import { Plus, FileText, Pencil, ArrowLeft, Loader2 } from "lucide-react";
import { useApp } from "../AppContext";

export default function ExamStudio() {
  const [studioProcess, setStudioProcess] = useState<"Creating" | "Editing" | "Default">("Default");
  const [loadingAssessmentId, setLoadingAssessmentId] = useState<string | null>(null);
  
  const { 
    setCurrentAssessment,
    assessments,
    fetchAssessmentDetails
  } = useApp();
  
  
  
  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-5">
          
        <div className="mb-8">          
          <h1 className="text-4xl font-bold text-gray-900 mb-2 dark:text-slate-100">{
            studioProcess === "Creating" ? "Create" :
              studioProcess === "Editing" ? "Edit" : 
                "Exam Studio"
            }</h1>
          
            {studioProcess === "Default" && <p className="text-gray-600 dark:text-slate-300">Create and edit assessments</p>}
            {studioProcess !== "Default" && (<>
              <button
                onClick={() => setStudioProcess("Default")}
                className="flex gap-2 items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
                Go back
              </button>
            </>)}
          </div>
        </div>
      
        {studioProcess === "Default" && <div>
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 space-x-3 space-x-reverse space-y-3 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
              <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-slate-100">
                Create a new assessment
              </h3>
              <button
                onClick={() => setStudioProcess('Creating')}
                className="inline-flex w-full max-w-96 items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" />
                Generate From Files
              </button>
              <button
                onClick={() => {
                  setCurrentAssessment(null);
                  setStudioProcess('Editing');
                }}
                className="inline-flex w-full max-w-96 items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" />
                Create From Scratch
              </button>
            </div>
          
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 dark:text-slate-100">
                Edit an existing assessment
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group flex-col flex gap-y-2 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20"
                  >
                    
                    <div className="flex flex-row gap-x-2">
                
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 w-full dark:text-slate-100">
                      {assessment.title}
                    </h3>
                    
                    </div>
                    
                    {/* Spacer to make the edit button align on all cards */ }
                    <div className="flex flex-grow"></div>
                      
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setLoadingAssessmentId(assessment.id);
                          try {
                            const updatedAssessment = await fetchAssessmentDetails(assessment.id);
                            if (updatedAssessment) {
                              setCurrentAssessment(updatedAssessment);
                              setStudioProcess("Editing");
                            }
                          } finally {
                            setLoadingAssessmentId(null);
                          }
                        }}
                        disabled={loadingAssessmentId !== null}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:bg-emerald-500 dark:hover:bg-emerald-400"
                      >
                        {loadingAssessmentId === assessment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Pencil className="w-4 h-4" />
                        )}
                        {loadingAssessmentId === assessment.id ? 'Loading...' : 'Edit'}
                      </button>
                    </div>
                  </div>
                
                ))}
      
                {assessments.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">No assessments yet</h3>
                    <p className="text-gray-600 mb-4 dark:text-slate-300">Create your first assessment to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>}
      
      {studioProcess === "Creating" && <CreationStudio />}
    
      {studioProcess === "Editing" && <EditingStudio />}
      </div>
    </div>
  );
}