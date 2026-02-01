import { User, HardDrive, FileText, LogOut, Trash2, Hash } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabaseClient } from '../supabase';

export default function Profile() {
  const { currentUser, setCurrentUser, setCurrentPage, libraryFiles, assessments } = useApp();

  if (!currentUser) {
    setCurrentPage('landing');
    return null;
  }

  const totalQuestions = assessments.reduce((sum, a) => sum + a.questionCount, 0);
  const totalStorage = libraryFiles.reduce((sum, f) => {
    const sizeInMB = parseFloat(f.size.split(' ')[0]);
    return sum + sizeInMB;
  }, 0);

  const handleLogout = async () => {
    setCurrentUser(null);
    // if I don't use this error value, it complains. ... also doesn't seem to work... very confusing
    const { error } = await supabaseClient.auth.signOut();
    console.log(error);
    setCurrentPage('landing');
  };

  const handlePurgeLibrary = () => {
    if (confirm('Are you sure you want to delete all files from your library? This action cannot be undone.')) {
      alert('Library purged (mock action)');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {currentUser.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                  <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Account Type</div>
                    <div className="font-semibold text-gray-900">Premium</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <Hash className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Session Hash</div>
                    <div className="font-mono text-xs text-gray-900 break-all">
                      {currentUser.sessionHash}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Usage Statistics</h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Storage Used</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {totalStorage.toFixed(1)} MB / 500 MB
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${(totalStorage / 500) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Files Uploaded</div>
                  <div className="text-3xl font-bold text-gray-900">{libraryFiles.length}</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Assessments Created</div>
                  <div className="text-3xl font-bold text-gray-900">{assessments.length}</div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Questions Generated</div>
                  <div className="text-3xl font-bold text-gray-900">{totalQuestions}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h3>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Edit Profile</div>
                    <div className="text-sm text-gray-600">Update your personal information</div>
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Export Data</div>
                    <div className="text-sm text-gray-600">Download all your assessments and results</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-red-900 mb-6">Danger Zone</h3>

            <div className="space-y-3">
              <button
                onClick={handlePurgeLibrary}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold text-red-900">Purge Library</div>
                    <div className="text-sm text-red-700">Delete all files and assessments</div>
                  </div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold text-red-900">Log Out</div>
                    <div className="text-sm text-red-700">Sign out of your account</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
