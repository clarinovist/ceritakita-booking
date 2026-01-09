'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useSWR, { mutate } from 'swr';
import { HomepageContent } from '@/types/homepage';
import { ImageUpload } from '@/components/ui/ImageUpload';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FormValues {
    hero: {
        tagline: string;
        subtagline: string;
        cta_text: string;
        background_image: string;
    };
    about: {
        label: string;
        headline: string;
        body_1: string;
        body_2: string;
        image: string;
    };
}

export function HeroAboutTab() {
    const { data: content, isLoading } = useSWR<HomepageContent[]>('/api/admin/homepage/content', fetcher);

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { register, handleSubmit, reset, control } = useForm<FormValues>();

    useEffect(() => {
        if (content) {
            const formData: any = { hero: {}, about: {} };
            content.forEach(item => {
                if (item.section === 'hero' || item.section === 'about') {
                    formData[item.section][item.content_key] = item.content_value;
                }
            });
            reset(formData);
        }
    }, [content, reset]);

    const onSubmit = async (data: FormValues) => {
        setIsSaving(true);
        setMessage(null);

        const updates: Partial<HomepageContent>[] = [];

        // Hero
        Object.entries(data.hero).forEach(([key, value]) => {
            updates.push({ section: 'hero', content_key: key, content_value: value });
        });

        // About
        Object.entries(data.about).forEach(([key, value]) => {
            updates.push({ section: 'about', content_key: key, content_value: value });
        });

        try {
            const res = await fetch('/api/admin/homepage/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error('Failed to update');

            setMessage({ type: 'success', text: 'Changes saved successfully!' });
            mutate('/api/admin/homepage/content'); // Refresh data
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading content...</div>;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {message && (
                <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b">Hero Section</h3>
                <div className="grid gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                        <input
                            {...register('hero.tagline')}
                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Abadikan Setiap Momen Berharga"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sub-tagline</label>
                        <textarea
                            {...register('hero.subtagline')}
                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Dari wisuda hingga pernikahan..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                            <input
                                {...register('hero.cta_text')}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Booking Sekarang"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                            <Controller
                                name="hero.background_image"
                                control={control}
                                render={({ field }) => (
                                    <ImageUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        folder="hero"
                                        label=""
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b">About Section</h3>
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Label (Small Text)</label>
                            <input
                                {...register('about.label')}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Tentang Kami"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">About Image</label>
                            <Controller
                                name="about.image"
                                control={control}
                                render={({ field }) => (
                                    <ImageUpload
                                        value={field.value}
                                        onChange={field.onChange}
                                        folder="about"
                                        label=""
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                        <input
                            {...register('about.headline')}
                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Studio Foto untuk Setiap Cerita Anda"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Body Paragraph 1</label>
                        <textarea
                            {...register('about.body_1')}
                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="CeritaKita hadir..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Body Paragraph 2</label>
                        <textarea
                            {...register('about.body_2')}
                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Dengan tim fotografer..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
