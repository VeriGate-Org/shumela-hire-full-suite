'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  uploading?: boolean;
  progress?: number;
  error?: string | null;
  multiple?: boolean;
  onFilesSelect?: (files: File[]) => void;
}

export default function FileUploadDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  uploading = false,
  progress = 0,
  error = null,
  multiple = false,
  onFilesSelect,
}: FileUploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 10MB limit`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File "${file.name}" has unsupported type. Allowed: PDF, Word, JPEG, PNG, GIF`;
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    setValidationError(null);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        setValidationError(err);
        return;
      }
    }

    if (multiple && onFilesSelect) {
      onFilesSelect(fileArray);
    } else if (fileArray.length > 0) {
      onFileSelect(fileArray[0]);
    }
  }, [multiple, onFileSelect, onFilesSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const displayError = validationError || error;

  if (uploading) {
    return (
      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <DocumentIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Uploading...</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-1">{progress}%</p>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-xs text-green-700">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button type="button" onClick={onClear} className="text-green-600 hover:text-green-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-border hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop your file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Word, JPEG, PNG, GIF — max 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
        />
      </div>
      {displayError && (
        <p className="text-sm text-red-600 mt-2">{displayError}</p>
      )}
    </div>
  );
}
