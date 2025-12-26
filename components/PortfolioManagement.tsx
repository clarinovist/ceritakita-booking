'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
}

interface PortfolioImage {
  id: string;
  service_id: string;
  image_url: string;
  display_order: number;
}

interface PortfolioManagementProps {
  services: Service[];
}

export default function PortfolioManagement({ services }: PortfolioManagementProps) {
  const [selectedService, setSelectedService] = useState<string>('');
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedService) {
      fetchPortfolioImages();
    } else {
      setImages([]);
      setError('');
    }
  }, [selectedService]);

  const fetchPortfolioImages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/portfolio?serviceId=${selectedService}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Failed to fetch portfolio images', error);
      setError('Network error while fetching images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length || !selectedService) return;

    setUploading(true);
    setError('');
    setUploadProgress(`Uploading ${files.length} file(s)...`);
    
    const successfulUploads: PortfolioImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceId', selectedService);

      try {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const newImage = await res.json();
          successfulUploads.push(newImage);
        } else {
          const errorData = await res.json();
          console.error(`Failed to upload ${file.name}:`, errorData);
          setError(prev => prev + `Failed to upload ${file.name}: ${errorData.error}\n`);
        }
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        setError(prev => prev + `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }

    // Add all successful uploads to the images list
    if (successfulUploads.length > 0) {
      setImages(prev => [...prev, ...successfulUploads]);
      setUploadProgress(`Successfully uploaded ${successfulUploads.length} of ${files.length} files`);
    } else {
      setUploadProgress('');
    }

    setUploading(false);
    
    // Reset input
    e.target.value = '';
    
    // Clear progress message after 3 seconds
    if (successfulUploads.length > 0) {
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const res = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== id));
      } else {
        const errorData = await res.json();
        alert(`Delete failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <ImageIcon size={20} /> Portfolio Management
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Select Service
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Select a service --</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <>
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="portfolio-upload"
                disabled={uploading}
              />
              <label
                htmlFor="portfolio-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                ) : (
                  <Upload size={32} className="text-gray-400" />
                )}
                <span className="text-sm font-semibold text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload images'}
                </span>
                <span className="text-xs text-gray-400">
                  Multiple files supported
                </span>
              </label>
            </div>

            {/* Upload Progress */}
            {uploading && uploadProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                {uploadProgress}
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 whitespace-pre-line">{error}</div>
                </div>
              </div>
            )}

            {/* Images Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span>Loading portfolio images...</span>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No portfolio images yet. Upload some to get started!
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group aspect-square overflow-hidden rounded-lg border bg-gray-50">
                      <Image
                        src={image.image_url}
                        alt={`Portfolio ${image.id}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-red-500 text-xs p-2 text-center">Image failed to load</div>';
                          }
                        }}
                      />
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Delete image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}