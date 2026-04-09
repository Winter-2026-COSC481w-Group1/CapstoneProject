import { HardDrive, LogOut, KeyRound, UserRoundX } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabaseClient } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, libraryFiles, assessments } = useApp();
  
  if (!currentUser) return null;

  const totalQuestions = assessments.reduce((sum, a) => {
    if (a.status == "failed") {
      return sum;
    } else {
      return sum + a.questionCount;
    }
  }, 0);
  const totalStorage = libraryFiles.reduce((sum, f) => {
    const sizeInMB = parseFloat(f.size.split(' ')[0]);
    return sum + sizeInMB;
  }, 0);

  const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    console.log(error); // not using this value currently...
    navigate('/');
  };
  
  const handleAccountDeletion = async () => {
    console.log("account deletion");
    // todo implement full user deletion
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
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {currentUser!.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentUser!.name}</h2>
                <p className="text-gray-600">{currentUser!.email}</p>
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

          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-red-900 mb-6">Danger Zone</h3>

            <div className="space-y-3">
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
              
              <button
                  onClick={() => { navigate('/resetPass'); }}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <div className="font-semibold text-red-900">Reset Password</div>
                  <div className="text-sm text-red-700">Change your password</div>
                </div>
              </div>
              </button>
              
              <button
                onClick={handleAccountDeletion}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <UserRoundX className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold text-red-900">Delete Account</div>
                    <div className="text-sm text-red-700">Permanently delete all your data</div>
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
