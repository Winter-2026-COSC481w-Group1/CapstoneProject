import { Plus, FileText, TrendingUp, Clock, CheckCircle, FileUp, FileCheck } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Dashboard() {
  const { currentUser, libraryFiles, assessments, activities, setCurrentPage } = useApp();

  const readyFiles = libraryFiles.filter(f => f.status === 'ready').length;
  const completedAssessments = assessments.filter(a => a.status === 'completed');
  const avgScore = completedAssessments.length > 0
    ? Math.round(completedAssessments.reduce((acc, a) => acc + (a.score || 0), 0) / completedAssessments.length)
    : 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser?.name?.split(' ')[0]}
            </h1>
            <p className="text-gray-600">Ready to create something amazing?</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {today}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-30"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm mb-6">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Quick Action
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Generate New Assessment
              </h2>
              <p className="text-emerald-100 mb-8 text-lg max-w-md">
                Create intelligent, context-aware exams from your library materials in seconds.
              </p>
              <button
                onClick={() => setCurrentPage('exam-studio')}
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow-lg group-hover:scale-105 transform duration-300"
              >
                <Plus className="w-5 h-5" />
                Start Creating
              </button>
            </div>
            <div className="absolute bottom-0 right-0 opacity-10">
              <FileText className="w-64 h-64 text-white" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">All Systems Ready</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-4xl font-bold text-gray-900">{libraryFiles.length}</div>
              <div className="text-gray-600 text-sm">Files in Library</div>
            </div>
            <button
              onClick={() => setCurrentPage('library')}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1 mt-4"
            >
              View all files
              <span>→</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold text-gray-900">{avgScore}%</div>
              <div className="text-gray-600 text-sm">Average Score</div>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-emerald-600">
                    Performance
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-emerald-100">
                <div
                  style={{ width: `${avgScore}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-600 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'exam-created' ? 'bg-emerald-100' :
                    activity.type === 'file-uploaded' ? 'bg-blue-100' :
                    'bg-amber-100'
                  }`}>
                    {activity.type === 'exam-created' ? (
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    ) : activity.type === 'file-uploaded' ? (
                      <FileUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Assessments</div>
                  <div className="text-2xl font-bold text-gray-900">{assessments.length}</div>
                </div>
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Ready Files</div>
                  <div className="text-2xl font-bold text-gray-900">{readyFiles}</div>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completed Tests</div>
                  <div className="text-2xl font-bold text-gray-900">{completedAssessments.length}</div>
                </div>
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
