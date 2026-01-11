'use client';

import { useState } from 'react';
import { HeroAboutTab } from './homepage/tabs/HeroAboutTab';
import { ServiceCategoriesTab } from './homepage/tabs/ServiceCategoriesTab';
import { ValuePropsTab } from './homepage/tabs/ValuePropsTab';
import { TestimonialsTab } from './homepage/tabs/TestimonialsTab';
import { PromoCtaTab } from './homepage/tabs/PromoCtaTab';
import { GalleryTab } from './homepage/tabs/GalleryTab';
import { LayoutTemplate, Grid, Star, MessageSquare, Megaphone, Image as ImageIcon } from 'lucide-react';

type TabType = 'hero' | 'services' | 'value-props' | 'testimonials' | 'promo' | 'gallery';

export default function HomepageCMS() {
    const [activeTab, setActiveTab] = useState<TabType>('hero');

    const tabs = [
        { id: 'hero', label: 'Hero & About', icon: LayoutTemplate },
        { id: 'services', label: 'Services', icon: Grid },
        { id: 'value-props', label: 'Value Props', icon: Star },
        { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
        { id: 'promo', label: 'Promo & CTA', icon: Megaphone },
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    ];

    return (
        <div className="space-y-6">


            {/* Tab Navigation - Modern Pill Style */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/50">
                    <nav className="flex gap-2 p-3 overflow-x-auto scrollbar-thin">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'hero' && <HeroAboutTab />}
                    {activeTab === 'services' && <ServiceCategoriesTab />}
                    {activeTab === 'value-props' && <ValuePropsTab />}
                    {activeTab === 'testimonials' && <TestimonialsTab />}
                    {activeTab === 'promo' && <PromoCtaTab />}
                    {activeTab === 'gallery' && <GalleryTab />}
                </div>
            </div>
        </div>
    );
}
