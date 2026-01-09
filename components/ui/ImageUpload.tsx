'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    folder?: string;
    label?: string;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    folder = 'uploads',
    label = 'Upload Image'
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload JPG, PNG, GIF, or WEBP.');
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File is too large. Maximum size is 5MB.');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const response = await fetch('/api/uploads', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsUploading(false);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const triggerSelect = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="w-full space-y-2">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div
                onClick={triggerSelect}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={`
          relative flex flex-col items-center justify-center w-full min-h-[200px] 
          border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 border-gray-300'}
          ${error ? 'border-red-500 bg-red-50' : ''}
          ${isUploading ? 'pointer-events-none' : ''} // Prevent clicks while uploading
        `}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    disabled={disabled || isUploading}
                />

                {value ? (
                    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center p-2">
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={value}
                                alt="Uploaded image"
                                fill
                                className="object-contain rounded-md"
                            />
                        </div>
                        {!disabled && (
                            <button
                                onClick={removeImage}
                                type="button"
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        {isUploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-10 h-10 mb-2 animate-spin text-blue-500" />
                                <p className="text-sm">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-400">
                                    JPG, PNG, GIF or WEBP (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
        </div>
    );
}
