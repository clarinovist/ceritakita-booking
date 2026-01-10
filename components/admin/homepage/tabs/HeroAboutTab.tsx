'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useSWR, { mutate } from 'swr';
import { HomepageContent } from '@/types/homepage';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Save, Loader2, Info } from 'lucide-react';

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

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            mutate('/api/admin/homepage/content'); // Refresh data
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">
            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <Info size={18} />
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-display font-bold text-slate-800 flex items-center gap-2">
                        Hero Section
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Configure the main banner of your homepage</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tagline (H1)</label>
                            <input
                                {...register('hero.tagline')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Abadikan Setiap Momen Berharga"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-tagline (Description)</label>
                            <textarea
                                {...register('hero.subtagline')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                rows={3}
                                placeholder="e.g. Dari wisuda hingga pernikahan..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">CTA Button Text</label>
                                <input
                                    {...register('hero.cta_text')}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Booking Sekarang"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Background Image</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <Controller
                                        name="hero.background_image"
                                        control={control}
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                folder="hero"
                                                label="Upload Background"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-display font-bold text-slate-800">
                        About Section
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Tell your studio's story</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Text Content */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Label (Small Text)</label>
                                <input
                                    {...register('about.label')}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Tentang Kami"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Headline</label>
                                <input
                                    {...register('about.headline')}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Studio Foto untuk Setiap Cerita Anda"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Paragraph 1</label>
                                <textarea
                                    {...register('about.body_1')}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    rows={4}
                                    placeholder="First paragraph of your story..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Paragraph 2</label>
                                <textarea
                                    {...register('about.body_2')}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    rows={4}
                                    placeholder="Second paragraph (optional)..."
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">About Image</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 h-full min-h-[300px] flex flex-col justify-center">
                                <Controller
                                    name="about.image"
                                    control={control}
                                    render={({ field }) => (
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            folder="about"
                                            label="Upload About Image"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 sticky bottom-6 z-20">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 inline-flex">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 font-semibold flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save All Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
