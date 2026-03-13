"use client";

import * as React from "react";
import Image from "next/image";
import { useUploadFiles } from "@better-upload/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  route?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  route = "images",
  multiple = false,
  maxFiles = 4,
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Normalize value to array
  const images = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  const { upload, isPending, progresses } = useUploadFiles({
    route,
    onUploadComplete: (data) => {
      // Extract URLs from the response
      const urls: string[] = [];
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          const key = file.objectInfo?.key;
          if (key) {
            const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""}/${key}`;
            urls.push(publicUrl);
          }
        }
      }

      if (urls.length > 0) {
        if (multiple) {
          onChange([...images, ...urls]);
        } else {
          onChange(urls[0] as string);
        }
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesToUpload = multiple
        ? Array.from(files).slice(0, maxFiles - images.length)
        : [files[0]!];
      upload(filesToUpload);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isPending) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const filesToUpload = multiple
        ? Array.from(files).slice(0, maxFiles - images.length)
        : [files[0]!];
      upload(filesToUpload);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } else {
      onChange("");
    }
  };

  const canAddMore = multiple ? images.length < maxFiles : images.length === 0;

  // Calculate overall progress from file upload info objects
  const progressValues = Object.values(progresses);
  const overallProgress =
    progressValues.length > 0
      ? progressValues.reduce((acc, file) => acc + (file.progress || 0), 0) /
        progressValues.length
      : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group bg-muted relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(index)}
                disabled={disabled || isPending}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center p-8",
              (disabled || isPending) && "cursor-not-allowed"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileChange}
              disabled={disabled || isPending}
              className="sr-only"
            />

            {isPending ? (
              <>
                <Loader2 className="text-muted-foreground mb-3 size-10 animate-spin" />
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {Math.round(overallProgress * 100)}% complete
                </p>
              </>
            ) : (
              <>
                <div className="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
                  {isDragging ? (
                    <ImageIcon className="text-primary size-6" />
                  ) : (
                    <Upload className="text-muted-foreground size-6" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {isDragging
                    ? "Drop images here"
                    : "Click or drag images to upload"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {multiple
                    ? `Up to ${maxFiles} images • PNG, JPG, WebP`
                    : "PNG, JPG, WebP"}
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Progress bar */}
      {isPending && overallProgress > 0 && (
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
