'use client';

import React from 'react';
import type { Lead, LeadFormData, LeadStatus, LeadSource } from '@/lib/types';
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/types/leads';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  editingLead: Lead | null;
}

export function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingLead
}: LeadModalProps) {
  if (!isOpen) return null;

  const isEditing = !!editingLead;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <span style={{ fontSize: '24px' }}>✕</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
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
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
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
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
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
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if not assigning to anyone</p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center justify-center gap-2"
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