'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWR, { mutate } from 'swr';
import { HomepageContent } from '@/types/homepage';
import { Save, Loader2, Info } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FormValues {
    promo: {
        title: string;
        description: string;
        is_active: string;
    };
    cta: {
        headline: string;
        description: string;
        primary_button: string;
        secondary_button: string;
        background_image: string;
    };
    footer: {
        tagline: string;
        email: string;
        phone: string;
        address: string;
        instagram: string;
        whatsapp: string;
    };
}

export function PromoCtaTab() {
    const { data: content, isLoading } = useSWR<HomepageContent[]>('/api/admin/homepage/content', fetcher);

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>();

    useEffect(() => {
        if (content) {
            const formData: Partial<FormValues> = { promo: {}, cta: {}, footer: {} } as Partial<FormValues>;
            content.forEach(item => {
                if (['promo', 'cta', 'footer'].includes(item.section)) {
                    const section = item.section as 'promo' | 'cta' | 'footer';
                    if (formData[section]) {
                        (formData[section] as Record<string, string>)[item.content_key] = item.content_value;
                    }
                }
            });
            reset(formData);
        }
    }, [content, reset]);

    const onSubmit = async (data: FormValues) => {
        setIsSaving(true);
        setMessage(null);

        const updates: Partial<HomepageContent>[] = [];

        ['promo', 'cta', 'footer'].forEach(sectionKey => {
            const section = sectionKey as 'promo' | 'cta' | 'footer';
            const sectionData = data[section];
            if (sectionData) {
                Object.entries(sectionData).forEach(([key, value]) => {
                    updates.push({ section: section, content_key: key, content_value: value });
                });
            }
        });

        try {
            const res = await fetch('/api/admin/homepage/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error('Failed to update');

            setMessage({ type: 'success', text: 'Changes saved successfully!' });
            mutate('/api/admin/homepage/content');
        } catch {
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

            {/* Promo Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-display font-bold text-slate-800">Promo Section</h3>
                            <p className="text-sm text-slate-500 mt-1">Special offers popup or banner</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                        <div className="relative">
                            <select
                                {...register('promo.is_active')}
                                className="w-full md:w-1/3 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                            <div className="absolute left-[calc(33.33%-2rem)] md:left-[calc(33.33%-2.5rem)] top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                        <input
                            {...register('promo.title')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. Promo Spesial Bulan Ini"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                            {...register('promo.description')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                            rows={3}
                            placeholder="e.g. Diskon 20% untuk booking di hari kerja..."
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-display font-bold text-slate-800">CTA Section</h3>
                    <p className="text-sm text-slate-500 mt-1">Bottom Call-to-Action area</p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Headline</label>
                        <input
                            {...register('cta.headline')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. Siap Mengabadikan Momen Anda?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                            {...register('cta.description')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                            rows={2}
                            placeholder="e.g. Hubungi kami sekarang untuk konsultasi gratis..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Button Text</label>
                            <input
                                {...register('cta.primary_button')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. Mulai Booking"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Secondary Button Text</label>
                            <input
                                {...register('cta.secondary_button')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. Konsultasi via WhatsApp"
                            />
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <ImageUpload
                            label="Background Image"
                            value={watch('cta.background_image')}
                            onChange={(url) => setValue('cta.background_image', url)}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-display font-bold text-slate-800">Footer Config</h3>
                    <p className="text-sm text-slate-500 mt-1">Contact info and social links</p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Company Tagline (Footer)</label>
                        <textarea
                            {...register('footer.tagline')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                            rows={2}
                            placeholder="Short footer description..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Email</label>
                            <input
                                {...register('footer.email')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="contact@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                            <input
                                {...register('footer.phone')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="+62..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number (Numeric)</label>
                            <input
                                {...register('footer.whatsapp')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="6281234567890"
                            />
                            <p className="text-xs text-slate-500 mt-1">Format: 628xxx (No spaces/symbols)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Instagram URL</label>
                            <input
                                {...register('footer.instagram')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <input
                            {...register('footer.address')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="Full studio address..."
                        />
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
                                Save All Content
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form >
    );
}
