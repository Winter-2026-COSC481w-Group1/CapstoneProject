import { useEffect, useState } from 'react';
import { Trash2, FileText, BookOpen, RotateCcw, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabaseClient } from '../supabase';
import { post } from '../api';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function Trash() {
  const {
    trashedDocuments,
    trashedAssessments,
    fetchTrash,
    fetchLibraryFiles,
    fetchAssessments,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash().finally(() => setLoading(false));
  }, []);

  const getToken = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token ?? null;
  };

  // ── Documents ─────────────────────────────────────────────────
  const handleRestoreDocument = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    setActionKey(`restore-document-${id}`);
    try {
      await post(`api/v1/trash/documents/${id}/restore`, {}, token);
      await Promise.all([fetchTrash(), fetchLibraryFiles()]);
    } catch (err) {
      console.error('Error restoring document:', err);
    } finally {
      setActionKey(null);
    }
  };

  const handlePermanentDeleteDocument = async (id: string) => {
    if (!confirm('Permanently delete this file? This cannot be undone.')) return;
    const token = await getToken();
    if (!token) return;
    setActionKey(`delete-document-${id}`);
    try {
      const res = await fetch(`${VITE_API_URL}/api/v1/trash/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTrash();
    } catch (err) {
      console.error('Error permanently deleting document:', err);
    } finally {
      setActionKey(null);
    }
  };

  // ── Assessments ───────────────────────────────────────────────
  const handleRestoreAssessment = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    setActionKey(`restore-assessment-${id}`);
    try {
      await post(`api/v1/trash/assessments/${id}/restore`, {}, token);
      await Promise.all([fetchTrash(), fetchAssessments()]);
    } catch (err) {
      console.error('Error restoring assessment:', err);
    } finally {
      setActionKey(null);
    }
  };

  const handlePermanentDeleteAssessment = async (id: string) => {
    if (!confirm('Permanently delete this assessment? This cannot be undone.')) return;
    const token = await getToken();
    if (!token) return;
    setActionKey(`delete-assessment-${id}`);
    try {
      const res = await fetch(`${VITE_API_URL}/api/v1/trash/assessments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTrash();
    } catch (err) {
      console.error('Error permanently deleting assessment:', err);
    } finally {
      setActionKey(null);
    }
  };

  const totalItems = trashedDocuments.length + trashedAssessments.length;

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center dark:bg-red-500/10">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-300" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">Trash</h1>
          </div>
          <p className="text-gray-600 dark:text-slate-300">
            Items in the trash are permanently deleted after <span className="font-semibold">30 days</span>.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-slate-400">Loading trash…</div>
        ) : totalItems === 0 ? (
          <div className="text-center py-20">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">Trash is empty</h3>
            <p className="text-gray-500 dark:text-slate-400">Deleted files and assessments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Trashed Documents */}
            {trashedDocuments.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 dark:text-slate-100">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                  Files ({trashedDocuments.length})
                </h2>
                <div className="space-y-3">
                  {trashedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20"
                    >
                      {(() => {
                        const isRestoring = actionKey === `restore-document-${doc.id}`;
                        const isDeleting = actionKey === `delete-document-${doc.id}`;
                        const isWorking = isRestoring || isDeleting;

                        return (
                          <>
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-red-500/10">
                        <FileText className="w-6 h-6 text-red-500 dark:text-red-300" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate dark:text-slate-100">{doc.name}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1 dark:text-slate-400">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.pageCount} pages</span>
                          <span>•</span>
                          <span>Deleted {doc.deletedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Days countdown badge */}
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        doc.daysRemaining <= 5
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}>
                        {doc.daysRemaining <= 5 && <AlertTriangle className="w-3 h-3" />}
                        {doc.daysRemaining}d left
                      </div>

                      <button
                        onClick={() => handleRestoreDocument(doc.id)}
                        disabled={isWorking}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-emerald-500/10"
                        title="Restore"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin dark:text-emerald-300" />
                        ) : (
                          <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                        )}
                      </button>

                      <button
                        onClick={() => handlePermanentDeleteDocument(doc.id)}
                        disabled={isWorking}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-red-500/10"
                        title="Delete forever"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 text-red-600 animate-spin dark:text-red-300" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 dark:text-red-300" />
                        )}
                      </button>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trashed Assessments */}
            {trashedAssessments.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 dark:text-slate-100">
                  <BookOpen className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                  Assessments ({trashedAssessments.length})
                </h2>
                <div className="space-y-3">
                  {trashedAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="bg-white rounded-2xl p-5 shadow border border-gray-200 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20"
                    >
                      {(() => {
                        const isRestoring = actionKey === `restore-assessment-${assessment.id}`;
                        const isDeleting = actionKey === `delete-assessment-${assessment.id}`;
                        const isWorking = isRestoring || isDeleting;

                        return (
                          <>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-purple-500/10">
                        <BookOpen className="w-6 h-6 text-purple-500 dark:text-purple-300" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate dark:text-slate-100">{assessment.title}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1 dark:text-slate-400">
                          <span>{assessment.questionCount} questions</span>
                          <span>•</span>
                          <span className="capitalize">{assessment.difficulty}</span>
                          <span>•</span>
                          <span>Deleted {assessment.deletedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        assessment.daysRemaining <= 5
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}>
                        {assessment.daysRemaining <= 5 && <AlertTriangle className="w-3 h-3" />}
                        {assessment.daysRemaining}d left
                      </div>

                      <button
                        onClick={() => handleRestoreAssessment(assessment.id)}
                        disabled={isWorking}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-emerald-500/10"
                        title="Restore"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin dark:text-emerald-300" />
                        ) : (
                          <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                        )}
                      </button>

                      <button
                        onClick={() => handlePermanentDeleteAssessment(assessment.id)}
                        disabled={isWorking}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed dark:hover:bg-red-500/10"
                        title="Delete forever"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 text-red-600 animate-spin dark:text-red-300" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 dark:text-red-300" />
                        )}
                      </button>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}