import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabaseClient } from '../supabase';
import { useApp } from '../AppContext';

export default function AuthPage() {
  const { setCurrentUser, setCurrentPage } = useApp();
  const [emailSent, setEmailSent] = useState(false);
  const [otpErr, setOtpErr] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    
    if (error) {
      setErr(error.message);
    } else {
      setEmailSent(true);
    }
  };
  
  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email, // The user's email
      token: otp, // The token provided by the user
      type: 'recovery'
    });
    
    if (error) {
      setOtpErr(error.message);
    }
    
    if (data) {
      const user = data.user;
      const realUser = user ? {
        id: user.id,
        name: user.user_metadata.full_name,
        email: user.email!,
        avatar: user.user_metadata.full_name.match(/\b(\w)/g).join(''),
        sessionHash: 'something' // TODO remove this field or populate with useful data
      } : null;
      if (realUser) {
        setCurrentUser(realUser);
        setCurrentPage('resetPass');
      } else {
        setOtpErr('Could not verify OTP code.');
      }
    } else {
      setOtpErr('Could not verify OTP code.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-emerald-600 rounded-sm"></div>
            </div>
            <span className="font-bold text-2xl">ScholarAI</span>
          </div>

          <div className="max-w-md">
            <div className="text-6xl font-serif mb-6">"</div>
            <blockquote className="text-2xl font-light leading-relaxed mb-6">
              The beautiful thing about learning is that no one can take it away from you.
            </blockquote>
            <cite className="text-emerald-300 text-lg">— B.B. King</cite>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <button
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to home
          </button>
          
          {!emailSent && <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            {err && <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-2 text-center">
              <p className="font-bold text-red-900">{err}</p>
            </div>
            }

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Reset Password
            </button>
          </form>}
          
          {emailSent && <>
            <p className="font-medium">Password reset email sent! Check your email to find your one time pin.</p>
            <form onSubmit={handleSubmitOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eight Digit OTP
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="12345678"
                  maxLength={6}
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              </div>
              
              {otpErr && <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-2 text-center">
                <p className="font-bold text-red-900">{otpErr}</p>
              </div>
              }
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Submit OTP
            </button>
            </form>
          </>}
        </div>
      </div>
    </div>
  );
}
