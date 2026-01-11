'use client';

import React, { useState } from 'react';
import { Tag, ShoppingBag, Camera, type LucideIcon } from 'lucide-react';
import { ServicesTable } from './tables/ServicesTable';
import { AddonsTable } from './tables/AddonsTable';
import { PhotographersTable } from './tables/PhotographersTable';
import { Service, Addon, Photographer } from '@/lib/types';

// Props matching what AdminDashboard passes to these components
interface CatalogManagementProps {
    // Service hooks
    services: Service[];
    handleOpenAddServiceModal: () => void;
    handleOpenEditServiceModal: (service: Service) => void;
    handleDeleteService: (id: string) => void;
    toggleServiceActive: (id: string, active: boolean) => void;

    // Addon hooks
    addons: Addon[];
    handleOpenAddAddonModal: () => void;
    handleOpenEditAddonModal: (addon: Addon) => void;
    handleDeleteAddon: (id: string) => void;
    toggleAddonActive: (id: string, active: boolean) => void;

    // Photographer hooks
    photographers: Photographer[];
    handleOpenAddPhotographerModal: () => void;
    handleOpenEditPhotographerModal: (photographer: Photographer) => void;
    handleDeletePhotographer: (id: string) => void;
    togglePhotographerActive: (id: string, active: boolean) => void;
}

type TabType = 'services' | 'addons' | 'photographers';

interface TabConfig {
    id: TabType;
    label: string;
    icon: LucideIcon;
}

const TABS: TabConfig[] = [
    { id: 'services', label: 'Services', icon: Tag },
    { id: 'addons', label: 'Add-ons', icon: ShoppingBag },
    { id: 'photographers', label: 'Photographers', icon: Camera }
];

export default function CatalogManagement({
    services,
    handleOpenAddServiceModal,
    handleOpenEditServiceModal,
    handleDeleteService,
    toggleServiceActive,
    addons,
    handleOpenAddAddonModal,
    handleOpenEditAddonModal,
    handleDeleteAddon,
    toggleAddonActive,
    photographers,
    handleOpenAddPhotographerModal,
    handleOpenEditPhotographerModal,
    handleDeletePhotographer,
    togglePhotographerActive
}: CatalogManagementProps) {
    const [activeTab, setActiveTab] = useState<TabType>('services');

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Tab Navigation */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/50">
                    <nav className="flex gap-2 p-3 overflow-x-auto scrollbar-thin" aria-label="Catalog tabs">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
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
                <div className="p-6 bg-slate-50/30">
                    {activeTab === 'services' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ServicesTable
                                services={services}
                                handleOpenAddModal={handleOpenAddServiceModal}
                                handleOpenEditModal={handleOpenEditServiceModal}
                                handleDeleteService={handleDeleteService}
                                toggleServiceActive={toggleServiceActive}
                            />
                        </div>
                    )}

                    {activeTab === 'addons' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AddonsTable
                                addons={addons}
                                services={services}
                                handleOpenAddAddonModal={handleOpenAddAddonModal}
                                handleOpenEditAddonModal={handleOpenEditAddonModal}
                                handleDeleteAddon={handleDeleteAddon}
                                toggleAddonActive={toggleAddonActive}
                            />
                        </div>
                    )}


                    {activeTab === 'photographers' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <PhotographersTable
                                photographers={photographers}
                                handleOpenAddPhotographerModal={handleOpenAddPhotographerModal}
                                handleOpenEditPhotographerModal={handleOpenEditPhotographerModal}
                                handleDeletePhotographer={handleDeletePhotographer}
                                togglePhotographerActive={togglePhotographerActive}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
