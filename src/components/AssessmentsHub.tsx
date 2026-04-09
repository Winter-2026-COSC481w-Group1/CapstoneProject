import { useState } from 'react';
import { Play, Download, Clock, CheckCircle, CircleX, FileText, TrashIcon, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabaseClient } from '../supabase';
import { useNavigate } from 'react-router-dom';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function AssessmentsHub() {
  const { assessments, setAssessments, setCurrentAssessment, fetchAssessmentDetails } = useApp();
  const [showDownloadMenu, setShowDownloadMenu] = useState<string | null>(null);
  const [assessmentsFilter, setAssessmentsFilter] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredAssessments = assessments.filter((assessment) => {
    if (assessmentsFilter === null) return true;
    if (assessmentsFilter === 'incomplete') return assessment.status === 'ready';
    return assessment.status === assessmentsFilter;
  });

  const assessmentCounts = {
    all: assessments.length,
    pending: assessments.filter((assessment) => assessment.status === 'pending').length,
    incomplete: assessments.filter((assessment) => assessment.status === 'ready').length,
    completed: assessments.filter((assessment) => assessment.status === 'completed').length,
  };

  const handleStartExam = async (assessmentId: string) => {
    try {
      setLoadingAction(`start-${assessmentId}`);
      const updatedAssessment = await fetchAssessmentDetails(assessmentId);
      if (updatedAssessment) {
        setCurrentAssessment(updatedAssessment);
        navigate('/dashboard/exam-mode');
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Could not load assessment details. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewResults = async (assessmentId: string) => {
    try {
      setLoadingAction(`view-${assessmentId}`);
      const updatedAssessment = await fetchAssessmentDetails(assessmentId);
      if (updatedAssessment) {
        setCurrentAssessment(updatedAssessment);
        navigate('/dashboard/grading-report');
      }
    } catch (error) {
      console.error('Failed to view results:', error);
      alert('Could not load assessment results. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadMenu = (assessmentId: string) => {
    setShowDownloadMenu((prev) => (prev === assessmentId ? null : assessmentId));
  };

  // Move assessment to trash
  const handleDelete = async (id: string) => {
    setDeletingAssessmentId(id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error('no session token available for delete');
        return;
      }
      const res = await fetch(`${VITE_API_URL}/api/v1/assessments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        setAssessments((prevAssessments) =>
          prevAssessments.filter((assessment) => assessment.id !== id)
        );
      } else {
        console.error('failed moving assessment to trash', res.status);
      }
    } catch (err) {
      console.error('error moving assessment to trash', err);
    } finally {
      setDeletingAssessmentId(null);
    }
  };

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessments</h1>
          <p className="text-gray-600">View and manage your exams</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button className={"px-4 py-2 " + ((assessmentsFilter === null) ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-300 bg-gray-200") + " rounded-full font-medium"}
            onClick={() => setAssessmentsFilter(null)}
          >
            All ({assessmentCounts.all})
          </button>
          <button className={"px-4 py-2 rounded-full font-medium " + ((assessmentsFilter === 'pending') ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-300 bg-gray-200")}
            onClick={() => setAssessmentsFilter('pending')}
          >
            Pending ({assessmentCounts.pending})
          </button>
          <button className={"px-4 py-2 rounded-full font-medium " + ((assessmentsFilter === 'incomplete') ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-300 bg-gray-200")}
            onClick={() => setAssessmentsFilter('incomplete')}
          >
            Incomplete ({assessmentCounts.incomplete})
          </button>
          <button className={"px-4 py-2 rounded-full font-medium " + ((assessmentsFilter === 'completed') ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-300 bg-gray-200")}
            onClick={() => setAssessmentsFilter('completed')}
          >
            Completed ({assessmentCounts.completed})
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => {
            const score = assessment.questionCount
              ? Math.round((assessment.numCorrect / assessment.questionCount) * 100)
              : 0;

            const showScore = assessment.status === 'completed';

            return (
            <div
              key={assessment.id}
              className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group flex-col flex gap-y-2 relative"
            >
              
              <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                {assessment.title}
              </h3>
              {assessment.status === "completed" && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 mb-3">
                  {assessment.numAttempts} attempt{assessment.numAttempts !== 1 ? 's' : ''}
                </div>
              )}
              <div className="flex flex-row items-center justify-between gap-x-2">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleDelete(assessment.id)}
                  disabled={deletingAssessmentId === assessment.id}
                  className="px-2 py-2 hover:text-red-700 rounded-md text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                <TrashIcon className="w-5" />
              </button>
                </div>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {assessment.status === 'pending' && (
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  ) || assessment.status === 'processing' && (
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <Clock className="w-3 h-3" />
                      Processing
                    </div>
                  ) || assessment.status === 'failed' && (
                    <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <CircleX className="w-3 h-3" />
                      Failed
                    </div>
                  )}
                </div>
              </div>
              {showScore && (
                <div className={`absolute right-4 top-16 w-12 h-12 ${getScoreBgColor(score)} rounded-full flex items-center justify-center text-lg font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
              )}
              </div>

              <div className="space-y-2">
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

              {assessment.status === "pending" && (
                  <div className="flex flex-grow"></div>
              )}
                  
                <button
                onClick={() => {
                  if (assessment.status === "completed" && !loadingAction) {
                    handleViewResults(assessment.id);
                  }
                  }}
                  disabled={!!loadingAction}
                  className={"w-full flex items-center justify-center gap-2 " + ((assessment.status === "completed") ? "bg-blue-100 hover:bg-blue-200 text-blue-600" : "bg-gray-200 text-gray-600 cursor-default") + " py-3 rounded-xl font-semibold " + (loadingAction?.startsWith(`view-${assessment.id}`) ? "opacity-75 cursor-not-allowed" : "")}
                >
                  {loadingAction === `view-${assessment.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Results
                </button>
                
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if ((assessment.status === "ready" || assessment.status === "completed") && !loadingAction) {
                      handleStartExam(assessment.id);
                    }
                  }}
                  disabled={!!loadingAction}
                  className={"flex-1 flex items-center justify-center gap-2 " + ((assessment.status === "ready" || assessment.status === "completed") ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-200 text-gray-600 cursor-default") + " py-3 rounded-xl font-semibold transition-colors " + (loadingAction?.startsWith(`start-${assessment.id}`) ? "opacity-75 cursor-not-allowed" : "")}
                >
                  {loadingAction === `start-${assessment.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Start
                </button>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (assessment.status === "ready" || assessment.status === "completed") {
                        handleDownloadMenu(assessment.id);
                      }
                    }}
                    className={"p-3 border-2 border-gray-200 " + ((assessment.status === "completed") ? "hover:border-emerald-500" : "bg-gray-200 cursor-default") + " rounded-xl transition-colors"}
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
            </div>
            );
          })}

          {assessments.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assessments yet</h3>
              <p className="text-gray-600 mb-4">Create your first assessment to get started</p>
              <button
                onClick={() => navigate('/dashboard/exam-studio')}
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