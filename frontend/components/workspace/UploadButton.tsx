"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UploadedAsset } from "@/types";
import { uploadAsset } from "@/lib/services/assets";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_MB = 20;

interface UploadButtonProps {
  projectId: string;
  onUploaded: (asset: UploadedAsset) => void;
}

export function UploadButton({ projectId, onUploaded }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_MB}MB limit`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const asset = await uploadAsset(projectId, file);
      onUploaded(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        aria-hidden="true"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={isUploading}
        onClick={() => inputRef.current?.click()}
        title="Upload image to canvas"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 1v9M3 5l4-4 4 4M1 11h12v1.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5V11z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Upload
      </Button>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-danger whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
