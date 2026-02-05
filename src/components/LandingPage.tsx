import { BookOpen, Search, Zap, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';

export default function LandingPage() {
  const { setCurrentPage } = useApp();
  
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              AI-Powered Assessment Engine
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Your Textbooks Into{' '}
              <span className="text-emerald-600">Intelligent</span> Exams
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Upload your course materials and let AI generate comprehensive, context-aware assessments in seconds.
            </p>

            <button
              onClick={() => {
                setCurrentPage('auth');
              }}
              className="group inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Login or Sign up
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-20 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-100/20 to-transparent blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-emerald-200 rounded w-3/4"></div>
                    <div className="h-4 bg-emerald-100 rounded w-1/2"></div>
                    <div className="h-4 bg-emerald-100 rounded w-5/6"></div>
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="h-20 bg-emerald-600 rounded-xl"></div>
                      <div className="h-20 bg-white border-2 border-emerald-200 rounded-xl"></div>
                      <div className="h-20 bg-white border-2 border-emerald-200 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Three steps to intelligent assessment generation</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Vector Ingestion</h3>
              <p className="text-gray-600">
                Your documents are processed and converted into semantic embeddings, preserving context and meaning.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="w-8 h-0.5 border-t-2 border-dashed border-emerald-400"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Context Retrieval</h3>
              <p className="text-gray-600">
                AI searches through your materials to find the most relevant information for generating questions.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="w-8 h-0.5 border-t-2 border-dashed border-emerald-400"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Llama 3 Inference</h3>
            <p className="text-gray-600">
              Advanced language models generate high-quality questions with accurate answers and citations.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Assessment Process?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of educators creating better exams with AI.
          </p>
          <button
            onClick={() => setCurrentPage('auth')}
            className="inline-flex items-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
