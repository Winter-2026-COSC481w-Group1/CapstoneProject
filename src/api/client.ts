import { supabaseClient } from '../supabase';
import type { LibraryFile } from '../types';

const API_BASE_URL = 'http://localhost:8000';

async function getAuthToken(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('No active session. Please log in.');
  }

  return data.session.access_token;
}

async function authorizedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) {
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // ignore JSON parse errors and keep default message
    }
    throw new Error(message);
  }

  return response;
}

// ---- Documents (Library) helpers ----

type BackendDocumentRow = {
  id: string;
  file_name: string;
  file_size: number;
  page_count: number;
  status: string;
  created_at?: string;
};

type UploadResponseDocument = {
  id: string;
  name: string;
  status: string;
  size: number;
  pageCount: number;
  uploadedAt?: string | null;
};

function mapBackendRowToLibraryFile(doc: BackendDocumentRow): LibraryFile {
  const sizeInMb = doc.file_size / (1024 * 1024);

  let status: LibraryFile['status'];
  if (doc.status === 'pending') {
    status = 'indexing';
  } else if (doc.status === 'ready' || doc.status === 'completed') {
    status = 'ready';
  } else {
    status = 'processing';
  }

  return {
    id: doc.id,
    name: doc.file_name,
    size: `${sizeInMb.toFixed(1)} MB`,
    uploadedAt: doc.created_at ? new Date(doc.created_at) : new Date(),
    status,
    pageCount: doc.page_count
  };
}

function mapUploadResponseToLibraryFile(doc: UploadResponseDocument): LibraryFile {
  const sizeInMb = doc.size / (1024 * 1024);

  let status: LibraryFile['status'];
  if (doc.status === 'pending') {
    status = 'indexing';
  } else if (doc.status === 'ready' || doc.status === 'completed') {
    status = 'ready';
  } else {
    status = 'processing';
  }

  return {
    id: doc.id,
    name: doc.name,
    size: `${sizeInMb.toFixed(1)} MB`,
    uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
    status,
    pageCount: doc.pageCount
  };
}

export async function fetchLibraryDocuments(): Promise<LibraryFile[]> {
  const res = await authorizedFetch('/api/documents', {
    method: 'GET'
  });

  const data = (await res.json()) as BackendDocumentRow[];
  return data.map(mapBackendRowToLibraryFile);
}

export async function uploadLibraryDocument(file: File): Promise<LibraryFile> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authorizedFetch('/api/documents', {
    method: 'POST',
    body: formData
  });

  const data = (await res.json()) as { document: UploadResponseDocument };
  return mapUploadResponseToLibraryFile(data.document);
}

