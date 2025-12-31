'use client';

import React from 'react';

interface RescheduleFormData {
  newDate: string;
  newTime: string;
  reason: string;
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: RescheduleFormData;
  setFormData: React.Dispatch<React.SetStateAction<RescheduleFormData>>;
}

export function RescheduleModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
}: RescheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">Reschedule Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <span style={{ fontSize: '24px' }}>✕</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800">
            <p className="font-bold mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>The system will check for slot availability</li>
              <li>Previous schedule will be saved in history</li>
              <li>Booking status will be set to "Rescheduled"</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Date *</label>
            <input
              required
              type="date"
              value={formData.newDate}
              onChange={e => setFormData({ ...formData, newDate: e.target.value })}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Time * (30-minute intervals)</label>
            <input
              required
              type="time"
              step="1800"
              value={formData.newTime}
              onChange={e => setFormData({ ...formData, newTime: e.target.value })}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Only 00:00, 00:30 minutes allowed (e.g., 09:00, 09:30, 10:00)</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Customer request, Weather conditions, etc."
              rows={3}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>💾</span>
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
