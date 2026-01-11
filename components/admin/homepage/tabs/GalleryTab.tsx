'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

import { PortfolioImage } from '@/lib/types';

interface ServiceCategory {
    id: string;
    name: string;
}

export function GalleryTab() {
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [images, setImages] = useState<Record<string, PortfolioImage[]>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch categories
                const catsRes = await fetch('/api/homepage');
                const catsData = await catsRes.json();

                if (catsData.categories) {
                    setCategories(catsData.categories);

                    // 2. Fetch images for each category
                    const imagesMap: Record<string, PortfolioImage[]> = {};

                    await Promise.all(catsData.categories.map(async (cat: ServiceCategory) => {
                        const imgRes = await fetch(`/api/portfolio?serviceId=${cat.id}`);
                        if (imgRes.ok) {
                            imagesMap[cat.id] = await imgRes.json();
                        } else {
                            imagesMap[cat.id] = [];
                        }
                    }));

                    setImages(imagesMap);
                }
            } catch (_error) {
                console.error('Failed to fetch gallery data:', _error);
                // alert('Failed to load gallery data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleUpload = async (file: File, serviceId: string) => {
        setUploading(serviceId);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('serviceId', serviceId);

        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const newImage = await res.json();

            setImages(prev => ({
                ...prev,
                [serviceId]: [...(prev[serviceId] || []), { ...newImage, is_active: 1 }]
            }));

            // alert('Image uploaded successfully');
        } catch (_error) {
            console.error(_error);
            alert('Failed to upload image');
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (id: string, serviceId: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await fetch('/api/portfolio', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error('Delete failed');

            setImages(prev => ({
                ...prev,
                [serviceId]: (prev[serviceId] || []).filter(img => img.id !== id)
            }));

            // alert('Image deleted');
        } catch {
            alert('Failed to delete image');
        }
    };

    const handleToggleVisibility = async (image: PortfolioImage) => {
        const newStatus = image.is_active ? 0 : 1;

        try {
            const res = await fetch('/api/portfolio', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: image.id, is_active: newStatus }),
            });

            if (!res.ok) throw new Error('Update failed');

            setImages(prev => ({
                ...prev,
                [image.service_id]: (prev[image.service_id] || []).map(img =>
                    img.id === image.id ? { ...img, is_active: newStatus } : img
                )
            }));

            // Success feedback omitted to avoid spamming alerts
        } catch {
            alert('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Portfolio Gallery</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage images for each service category. Toggle visibility to control what appears on the website.</p>
                </div>
            </div>

            <div className="space-y-12">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                {images[category.id]?.length || 0} images
                            </span>
                        </div>

                        <div className="p-6">
                            {/* Image Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                {(images[category.id] || []).map((img) => (
                                    <div
                                        key={img.id}
                                        className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${img.is_active ? 'border-transparent' : 'border-red-100 bg-red-50'
                                            }`}
                                    >
                                        <Image
                                            src={img.image_url}
                                            alt="Portfolio"
                                            fill
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                            className={`object-cover transition-all ${img.is_active ? 'group-hover:scale-105' : 'opacity-50 grayscale'
                                                }`}
                                        />

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleVisibility(img)}
                                                className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full transition-colors"
                                                title={img.is_active ? "Hide from gallery" : "Show in gallery"}
                                            >
                                                {img.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(img.id, category.id)}
                                                className="p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                                                title="Delete image"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {!img.is_active && (
                                            <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                                Hidden
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Upload Placeholders to fill row if needed, or just the upload button below */}
                            </div>

                            {/* Upload Area */}
                            <div className="max-w-xs">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Image</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors p-4 flex flex-col items-center justify-center text-center cursor-pointer relative h-32">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUpload(file, category.id);
                                        }}
                                        disabled={uploading === category.id}
                                    />
                                    {uploading === category.id ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            <div className="p-2 bg-gray-100 rounded-full mb-2">
                                                <Plus className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-500">Click to upload</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
