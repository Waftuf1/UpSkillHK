'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { WaffleSpinner } from './WaffleSpinner';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  isLoading?: boolean;
}

export function FileUpload({
  onUpload,
  accept = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  isLoading = false,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
        ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <WaffleSpinner size={48} />
          <p className="text-slate-600">Extracting your profile...</p>
        </div>
      ) : (
        <>
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-slate-600">
            {isDragActive ? 'Drop your file here' : 'Drag & drop your CV here, or click to browse'}
          </p>
          <p className="mt-1 text-sm text-slate-500">PDF or DOCX, max 10MB</p>
        </>
      )}
    </div>
  );
}
