import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const messages = [
  'Reading your documents...',
  'Analyzing content structure...',
  'Extracting key concepts...',
  'Drafting questions...',
  'Verifying answer accuracy...',
  'Finalizing rubric...',
  'Almost ready...'
];

export default function LoadingRoom() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-emerald-200 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="w-32 h-32 mx-auto">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
                  className="fill-emerald-600 animate-pulse"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="15"
                  className="fill-white"
                />
                <circle
                  cx="35"
                  cy="45"
                  r="8"
                  className="fill-emerald-200"
                />
                <circle
                  cx="65"
                  cy="45"
                  r="8"
                  className="fill-emerald-200"
                />
                <circle
                  cx="50"
                  cy="65"
                  r="6"
                  className="fill-emerald-300"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-40 h-40 text-emerald-600/20 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4 min-h-[2.5rem] transition-all duration-500">
          {messages[currentMessage]}
        </h2>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Our AI is carefully analyzing your materials to create a comprehensive assessment.
        </p>

        <div className="max-w-md mx-auto mb-8">
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full animate-progress"></div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          Please do not refresh or close this page
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
