import { useState } from 'react';
import { Play, Download, Clock, CheckCircle, FileText, MoreVertical } from 'lucide-react';
import { useApp } from '../AppContext';

export default function AssessmentsHub() {
  const { assessments, setCurrentPage, setCurrentAssessment } = useApp();
  const [showDownloadMenu, setShowDownloadMenu] = useState<string | null>(null);

  const handleStartExam = (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (assessment) {
      setCurrentAssessment(assessment);
      setCurrentPage('exam-mode');
    }
  };

  const handleDownloadMenu = (assessmentId: string) => {
    setShowDownloadMenu(showDownloadMenu === assessmentId ? null : assessmentId);
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessments</h1>
          <p className="text-gray-600">View and manage your exams</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-full font-medium">
            All ({assessments.length})
          </button>
          <button className="px-4 py-2 text-gray-600 hover:bg-white rounded-full font-medium transition-colors">
            Draft ({assessments.filter(a => a.status === 'draft').length})
          </button>
          <button className="px-4 py-2 text-gray-600 hover:bg-white rounded-full font-medium transition-colors">
            Completed ({assessments.filter(a => a.status === 'completed').length})
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {assessment.status === 'draft' && (
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <Clock className="w-3 h-3" />
                      Ready to Start
                    </div>
                  )}
                  {assessment.status === 'completed' && assessment.score !== undefined && (
                    <div className="absolute top-4 right-4">
                      <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{assessment.score}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {assessment.title}
              </h3>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{assessment.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {assessment.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    assessment.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    assessment.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {assessment.difficulty.charAt(0).toUpperCase() + assessment.difficulty.slice(1)}
                  </span>
                </div>
              </div>

              {assessment.status === 'draft' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartExam(assessment.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Online
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => handleDownloadMenu(assessment.id)}
                      className="p-3 border-2 border-gray-200 hover:border-emerald-500 rounded-xl transition-colors"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                    {showDownloadMenu === assessment.id && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-10">
                        <button className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm font-medium text-gray-700">
                          Question Paper
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm font-medium text-gray-700">
                          Answer Key
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {assessment.status === 'completed' && (
                <button
                  onClick={() => {
                    setCurrentAssessment(assessment);
                    setCurrentPage('grading-report');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-3 rounded-xl font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  View Results
                </button>
              )}
            </div>
          ))}

          {assessments.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assessments yet</h3>
              <p className="text-gray-600 mb-4">Create your first assessment to get started</p>
              <button
                onClick={() => setCurrentPage('exam-studio')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Play className="w-4 h-4" />
                Create Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
