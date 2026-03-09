import CreationStudio from "./CreationStudio";
import EditingStudio from "./EditingStudio";
import { useState } from "react";
import { Plus, FileText, Pencil, ArrowLeft } from "lucide-react";
import { useApp } from "../AppContext";

export default function ExamStudio() {
  const [studioProcess, setStudioProcess] = useState<"Creating" | "Editing" | "Default">("Default");
  
  const { 
    setCurrentAssessment,
    assessments
  } = useApp();
  
  
  
  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-5">
          
        <div className="mb-8">          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{
            studioProcess === "Creating" ? "Create" :
              studioProcess === "Editing" ? "Edit" : 
                "Exam Studio"
            }</h1>
          
            {studioProcess === "Default" && <p className="text-gray-600">Create and edit assessments</p>}
            {studioProcess !== "Default" && (<>
              <button
                onClick={() => setStudioProcess("Default")}
                className="flex gap-2 items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Go back
              </button>
            </>)}
          </div>
        </div>
      
        {studioProcess === "Default" && <div>
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Create a new assessment
              </h3>
              <button
                onClick={() => setStudioProcess('Creating')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Get Started
              </button>
            </div>
          
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Edit an existing assessment
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group flex-col flex gap-y-2"
                  >
                    
                    <div className="flex flex-row gap-x-2">
                
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 w-full">
                      {assessment.title}
                    </h3>
                    
                    </div>
                    
                    {/* Spacer to make the edit button align on all cards */ }
                    <div className="flex flex-grow"></div>
                      
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentAssessment(structuredClone(assessment));
                          setStudioProcess("Editing");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                
                ))}
      
                {assessments.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No assessments yet</h3>
                    <p className="text-gray-600 mb-4">Create your first assessment to get started</p>
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
