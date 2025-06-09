'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AircraftDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

interface AircraftDocumentsProps {
  aircraftId: string;
}

export default function AircraftDocuments({ aircraftId }: AircraftDocumentsProps) {
  const [documents, setDocuments] = useState<AircraftDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      // TODO: Implement document upload functionality
      // const uploadPromises = Array.from(files).map(file => uploadAircraftDocument(aircraftId, file));
      // await Promise.all(uploadPromises);
      // await loadDocuments();
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (doc: AircraftDocument) => {
    try {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const handleDelete = async (doc: AircraftDocument) => {
    try {
      // TODO: Implement document deletion functionality
      // await deleteAircraftDocument(aircraftId, doc.id);
      // await loadDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Aircraft Documents</h2>
        <div>
          <input
            id="aircraft-document-upload"
            name="aircraftDocuments"
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Documents
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium">{document.name}</h4>
                <p className="text-sm text-gray-500">
                  {formatFileSize(document.size)} • Uploaded{' '}
                  {format(document.uploadedAt, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outlined" size="small" onClick={() => handleDownload(document)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDelete(document)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
