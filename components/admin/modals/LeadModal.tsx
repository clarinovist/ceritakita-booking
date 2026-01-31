'use client';

import React from 'react';
import { Lead, LeadFormData, LeadStatus, LeadSource, Service } from '@/lib/types';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/types/leads';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  editingLead: Lead | null;
  services: Service[]; // Added services prop
}

export function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingLead,
  services // Destructure services
}: LeadModalProps) {
  if (!isOpen) return null;

  const isEditing = !!editingLead;

  const toggleInterest = (category: string) => {
    const currentInterests = formData.interest || [];
    if (currentInterests.includes(category)) {
      setFormData({
        ...formData,
        interest: currentInterests.filter(i => i !== category)
      });
    } else {
      setFormData({
        ...formData,
        interest: [...currentInterests, category]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-gray-50 flex-none sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-bold">
            {isEditing ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Lead Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>👤</span> Lead Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp *</label>
                <input
                  required
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="e.g. 081234567890"
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Lead Tracking */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span>🎯</span> Lead Tracking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Source *</label>
                <select
                  required
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value as LeadSource })}
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-base md:text-sm min-h-[44px] bg-white cursor-pointer"
                >
                  {LEAD_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-base md:text-sm min-h-[44px] bg-white cursor-pointer"
                >
                  {LEAD_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Next Follow-up</label>
                <input
                  type="date"
                  value={formData.next_follow_up || ''}
                  onChange={e => setFormData({ ...formData, next_follow_up: e.target.value })}
                  className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-base md:text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Interest</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-white shadow-inner">
                {services.map(service => (
                  <label key={service.id} className="flex items-center gap-3 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={(formData.interest || []).includes(service.name)}
                      onChange={() => toggleInterest(service.name)}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                    />
                    <span className="font-medium text-gray-700">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
              <span>📝</span> Notes
            </h3>
            <textarea
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this lead..."
              rows={4}
              className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none text-base md:text-sm min-h-[100px]"
            />
          </div>

          {/* Assignment */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span>👥</span> Assignment (Optional)
            </h3>
            <input
              type="text"
              value={formData.assigned_to || ''}
              onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
              placeholder="User ID to assign to"
              className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base md:text-sm min-h-[44px]"
            />
            <p className="text-[10px] text-indigo-500 mt-1 font-medium pl-1">Leave empty if not assigning to anyone</p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex gap-3 border-t flex-none sticky bottom-0 bg-white md:bg-transparent pb-2 md:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>💾</span>
              {isEditing ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}