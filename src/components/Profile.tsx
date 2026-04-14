import { HardDrive, LogOut, KeyRound, UserRoundX, Pencil } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabaseClient } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, libraryFiles, assessments } = useApp();
  
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  
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
    confirm("Are you sure? This will delete all your uploaded documents and all your assessments.");
    
    // get the session token which
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) {
      console.error('no session token available for account deletion');
      return;
    }
    
    // delete this user's reference to all files (file will be saved if another user has them uploaded)
    for (const file of libraryFiles) {
      try {
        const res = await fetch(`${VITE_API_URL}/api/v1/documents/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.error('Error permanently deleting document:', err);
      }
      
      try {
        const res = await fetch(`${VITE_API_URL}/api/v1/trash/documents/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.error('Error permanently deleting document:', err);
      }
    }
    
    // delete the user from the auth table (cascades down through public tables)
    try {
      const res = await fetch(`${VITE_API_URL}/api/v1/api/users`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        console.log('successfully deleted account');
      }
      else
      {
        console.error('failed deleting account');
      }
    } catch (err) {
      console.error('error deleting account', err);
    } finally {
      navigate('/');
    }
  };
  
  const handleNameChange = async () => { 
    const { error } = await supabaseClient.auth.updateUser({
      data: { full_name: newName }
    });
    if (!error) {
      currentUser.name = newName;
      setEditingName(false);
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
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {currentUser!.avatar}
              </div>
              <div>
                <div className="inline-flex">
                  <h2 className={!editingName ? "text-2xl font-bold text-gray-900" : "hidden"}>{currentUser!.name}</h2>
                  <input
                    className={editingName ? "text-2xl font-bold text-gray-900 border-gray-900 border-2 rounded-md p-1" : "hidden"}
                    onChange={(e) => { 
                      setNewName(e.currentTarget.value);
                    }}
                  ></input>
                  <Pencil
                    className={!editingName ? "w-4 h-4 inline ml-2 m-auto hover:scale-110" : "hidden"}
                    onClick={() => { setEditingName(true) }}
                  />
                  <button
                    className={editingName ? "ml-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors" : "hidden"}
                    onClick={() => {
                      handleNameChange();
                    }}
                  >Save</button>
                </div>
                <p className={editingName ? "text-red-600" : "hidden"}>Warning: using Google sign-in overwrites your name</p>
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
