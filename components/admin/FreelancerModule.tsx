'use client';

import React, { useState } from 'react';
import { Users, Briefcase, BarChart2 } from 'lucide-react';
import { FreelancerList } from './freelancers/FreelancerList';
import { FreelancerJobInput } from './freelancers/FreelancerJobInput';
import { MonthlyRecap } from './freelancers/MonthlyRecap';

export const FreelancerModule = () => {
    const [activeTab, setActiveTab] = useState<'freelancers' | 'input' | 'recap'>('freelancers');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Freelancer Management</h2>
                    <p className="text-gray-500 text-sm">Manage freelancers, record jobs, and view monthly fees.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('freelancers')}
                    className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'freelancers'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Users size={16} />
                    Freelancers
                </button>
                <button
                    onClick={() => setActiveTab('input')}
                    className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'input'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <Briefcase size={16} />
                    Input Job
                </button>
                <button
                    onClick={() => setActiveTab('recap')}
                    className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'recap'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <BarChart2 size={16} />
                    Monthly Recap
                </button>
            </div>

            {/* Tab content */}
            <div className="mt-6">
                {activeTab === 'freelancers' && <FreelancerList />}
                {activeTab === 'input' && <FreelancerJobInput />}
                {activeTab === 'recap' && <MonthlyRecap />}
            </div>
        </div>
    );
};
