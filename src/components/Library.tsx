import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, CircleX, Trash2, Eye } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { LibraryFile } from '../types';
import { supabaseClient } from '../supabase';

import { post, get} from '../api';

const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function Library() {
  const { libraryFiles, setLibraryFiles } = useApp();
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [previewingDocumentId, setPreviewingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      // Handle not logged in
      return;
    }
    const tempId = Date.now().toString();

    const newFile: LibraryFile = {
      id: tempId,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date(),
      status: 'pending',
      pageCount: 0 // Will be updated from backend
    };

    setLibraryFiles(prev => [newFile, ...prev]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await post('api/v1/documents', formData, session.access_token);
      const doc = result.document;
      setLibraryFiles(prev =>
        prev.map(f => f.id === tempId ? {
          id: doc.id,
          name: doc.name,
          size: typeof doc.size === 'number'
            ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
            : doc.size,
          uploadedAt: new Date(doc.uploadedAt),
          // Use the status directly from the backend response
          status: doc.status as LibraryFile['status'],
          pageCount: doc.pageCount ?? 0
        } : f)
      );

      // Show appropriate toast based on final status
      if (doc.status === 'ready') {
        showToast('success', 'Document Ready', `${file.name} is ready to use`);
      } else if (doc.status === 'failed') {
        showToast('error', 'Document Failed', `${file.name} could not be processed`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle upload error, maybe remove the file from the list
      setLibraryFiles(prev => prev.filter(f => f.id !== tempId));
      showToast('error', 'Document Failed', `Failed to upload ${file.name}`);
    }
  };

  // Move document to trash
  const handleDelete = async (id: string) => {
    setDeletingDocumentId(id);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error('no session token available for delete');
        return;
      }
      const res = await fetch(`${VITE_API_URL}/api/v1/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        setLibraryFiles(prev => prev.filter(f => f.id !== id));
      } else {
        console.error('failed moving document to trash', res.status);
      }
    } catch (err) {
      console.error('error moving document to trash', err);
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handlePreview = async (documentId: string) => {
      setPreviewingDocumentId(documentId);
      try {
      const { data: {session} } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return null;
      const response = await get(`api/v1/documents/${documentId}/preview`, session.access_token);
      
      // the url is our signed url from Supabase
      // opening in a new tab allows the browser's native pdf viewer to take over
      window.open(response.url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.error('error previewing document', err);
      } finally {
        setPreviewingDocumentId(null);
      }
      }

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 dark:text-slate-100">My Library</h1>
          <p className="text-gray-600 dark:text-slate-300">Upload and manage your course materials</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-white rounded-3xl border-3 border-dashed p-12 mb-8 transition-all dark:bg-slate-900 dark:border-slate-700 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50 scale-[1.02] dark:bg-emerald-500/10'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.pptx"
            onChange={handleFileInput}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              isDragging ? 'bg-emerald-600' : 'bg-emerald-100'
            }`}>
              <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-slate-100">
              {isDragging ? 'Drop your files here' : 'Upload your documents'}
            </h3>
            <p className="text-gray-600 mb-4 dark:text-slate-300">
              Drag and drop or click to browse
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm dark:bg-emerald-500/10 dark:text-emerald-300">
              PDF or PPTX files up to 50MB
            </div>
          </label>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Your Files ({libraryFiles.length})
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 dark:text-slate-300">
              {libraryFiles.filter(f => f.status === 'ready').length} ready
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-4">
          {libraryFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-red-500/10">
                  <FileText className="w-7 h-7 text-red-600 dark:text-red-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate dark:text-slate-100">
                    {file.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.pageCount} pages</span>
                    <span>•</span>
                    <span>
                      {file.uploadedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const isPreviewLoading = previewingDocumentId === file.id;
                    const isDeleteLoading = deletingDocumentId === file.id;

                    return (
                      <>
                  {file.status === 'ready' ? (
                    <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full dark:bg-emerald-500/10">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Ready</span>
                    </div>
                  ) : file.status === 'pending' ? (
                    <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full dark:bg-blue-500/10">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin dark:text-blue-300" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Pending...</span>
                    </div>
                  ) : file.status === 'processing' ? (
                    <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full dark:bg-blue-500/10">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin dark:text-blue-300" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing...</span>
                    </div>
                  ) : file.status === 'indexing' ? (
                    <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full dark:bg-amber-500/10">
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin dark:text-amber-300" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Indexing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full dark:bg-red-500/10">
                      <CircleX className="w-4 h-4 text-red-600 dark:text-red-300" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Failed</span>
                    </div>
                  )}

                  <button
                    onClick={() => handlePreview(file.id)}
                    disabled={isPreviewLoading || isDeleteLoading}
                    className={`p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800 ${
                      isPreviewLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Preview"
                  >
                    {isPreviewLoading ? (
                      <Loader2 className="w-5 h-5 text-gray-600 animate-spin dark:text-slate-300" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={isDeleteLoading || isPreviewLoading}
                    className={`p-2 hover:bg-red-100 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-500/10 ${
                      isDeleteLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Move to Trash"
                  >
                    {isDeleteLoading ? (
                      <Loader2 className="w-5 h-5 text-red-600 animate-spin dark:text-red-300" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-300" />
                    )}
                  </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}

          {libraryFiles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4 dark:text-slate-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">No files yet</h3>
              <p className="text-gray-600 dark:text-slate-300">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}