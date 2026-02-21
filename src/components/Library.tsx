import { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, Trash2, Eye } from 'lucide-react';
import { useApp } from '../AppContext';
import { LibraryFile } from '../types';
import { supabaseClient } from '../supabase';

import { post } from '../api';
import { supabaseClient } from '../supabase';

export default function Library() {
  const { libraryFiles, setLibraryFiles } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // load documents on mount
  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) {
          console.error('no session token available');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/v1/documents', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const files: LibraryFile[] = data.map((doc: any) => ({
            id: doc.id,
            name: doc.file_name,
            size: doc.file_size
              ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
              : '0 MB',
            uploadedAt: new Date(doc.created_at),
            status: doc.status as 'ready' | 'indexing' | 'processing' | 'pending' | 'failed',
            pageCount: doc.page_count ?? 0,
          }));
          setLibraryFiles(files);
        } else {
          console.error('failed fetching documents', res.status);
        }
      } catch (err) {
        console.error('error loading documents', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setLibraryFiles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <span className="ml-4 text-xl">Loading library...</span>
      </div>
    );
  }

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

    const newFile: LibraryFile = {
      id: Date.now().toString(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date(),
      status: 'indexing',
      pageCount: 0 // Will be updated from backend
    };

    setLibraryFiles(prev => [...prev, newFile]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await post('api/v1/documents', formData, session.access_token);
      setLibraryFiles(prev =>
        prev.map(f => f.id === newFile.id ? { ...result, status: 'ready' } : f)
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle upload error, maybe remove the file from the list
      setLibraryFiles(prev => prev.filter(f => f.id !== newFile.id));
    }
  };

  const handleDelete = (id: string) => {
    setLibraryFiles(libraryFiles.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Library</h1>
          <p className="text-gray-600">Upload and manage your course materials</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-white rounded-3xl border-3 border-dashed p-12 mb-8 transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragging ? 'Drop your files here' : 'Upload your documents'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop or click to browse
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm">
              PDF files up to 50MB
            </div>
          </label>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Files ({libraryFiles.length})
          </h2>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {libraryFiles.filter(f => f.status === 'ready').length} ready
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-4">
          {libraryFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-red-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {file.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
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
                  {file.status === 'ready' ? (
                    <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Ready</span>
                    </div>
                  ) : file.status === 'indexing' ? (
                    <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full">
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                      <span className="text-sm font-medium text-amber-700">Indexing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-700">Processing...</span>
                    </div>
                  )}

                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Preview"
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {libraryFiles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-600">Upload your first document to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
