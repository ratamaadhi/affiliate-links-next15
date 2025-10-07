'use client';

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/use-file-upload';

export default function FileUpload({
  fileUrl,
  onFilesChange,
  onImageChange,
}: {
  fileUrl?: string;
  onFilesChange?: (_files: any[]) => void;
  onImageChange?: (imageUrl: string | null, file?: File) => void;
}) {
  const maxSizeMB = 2;
  const maxSize = maxSizeMB * 1024 * 1024; // 2MB default
  const isUpdatingRef = useRef(false);
  const prevFileUrlRef = useRef(fileUrl);

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept: 'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif',
    maxSize,
    initialFiles: fileUrl
      ? [
          {
            name: fileUrl.split('/').pop() || 'image',
            size: 0,
            type: 'image',
            url: fileUrl,
            id: fileUrl,
          },
        ]
      : [],
    multiple: false,
    onFilesChange: (files) => {
      // Call original callback for backward compatibility
      onFilesChange?.(files);
    },
  });

  // Update files when fileUrl prop changes (but only if there are no uploaded files)
  useEffect(() => {
    if (isUpdatingRef.current || prevFileUrlRef.current === fileUrl) return;

    const hasActualFile = files.length > 0 && files[0].file instanceof File;
    const currentFileUrl =
      files.length > 0 && !hasActualFile && !(files[0].file instanceof File)
        ? files[0].file.url
        : null;

    if (fileUrl && !hasActualFile && currentFileUrl !== fileUrl) {
      // Clear existing files first, then add the new fileUrl
      isUpdatingRef.current = true;
      clearFiles();
      const fileMetadata = {
        name: fileUrl.split('/').pop() || 'image',
        size: 0,
        type: 'image',
        url: fileUrl,
        id: fileUrl,
      };
      setTimeout(() => {
        isUpdatingRef.current = false;
        prevFileUrlRef.current = fileUrl;
      }, 0);
    } else if (!fileUrl && files.length > 0 && !hasActualFile) {
      // Clear files if fileUrl is removed and no actual file is uploaded
      isUpdatingRef.current = true;
      clearFiles();
      setTimeout(() => {
        isUpdatingRef.current = false;
        prevFileUrlRef.current = fileUrl;
      }, 0);
    } else {
      prevFileUrlRef.current = fileUrl;
    }
  }, [fileUrl, clearFiles]);

  // Handle image change separately to avoid render-time state updates
  useEffect(() => {
    if (isUpdatingRef.current) return;

    if (files.length > 0) {
      const fileObj = files[0];
      const imageUrl = fileObj.preview || '';
      const actualFile =
        fileObj.file instanceof File ? fileObj.file : undefined;
      onImageChange?.(imageUrl, actualFile);
    } else {
      onImageChange?.(null, undefined);
    }
  }, [files, onImageChange]);
  const previewUrl =
    files[0]?.preview ||
    (files[0]?.file instanceof File ? null : files[0]?.file?.url) ||
    fileUrl ||
    null;
  const fileName = files[0]?.file.name || null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* Drop area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload image file"
          />
          {previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={files[0]?.file?.name || 'Uploaded image'}
                className="mx-auto max-h-full rounded object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Drop your image here</p>
              <p className="text-muted-foreground text-xs">
                SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={openFileDialog}
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Select image
              </Button>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                removeFile(files[0]?.id);
                onImageChange?.(null, undefined);
              }}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
