'use client';

import React from 'react';
import type { Service, Photographer, Addon } from '@/lib/types';

interface BookingFormData {
  customer_name: string;
  customer_whatsapp: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  booking_notes: string;
  location_link: string;
  photographer_id: string;
  dp_amount: number;
  payment_note: string;
}

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  services: Service[];
  photographers: Photographer[];
  availableAddons: Addon[];
  selectedAddons: Map<string, number>;
  onServiceChange: (serviceId: string) => void;
  onToggleAddon: (addonId: string) => void;
  onUpdateAddonQuantity: (addonId: string, quantity: number) => void;
  calculateTotal: () => number;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  services,
  photographers,
  availableAddons,
  selectedAddons,
  onServiceChange,
  onToggleAddon,
  onUpdateAddonQuantity,
  calculateTotal,
}: CreateBookingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
          <h2 className="text-xl font-bold">Create New Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <span style={{ fontSize: '24px' }}>✕</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>👤</span> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                <input
                  required
                  type="text"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label>
                <input
                  required
                  type="text"
                  value={formData.customer_whatsapp}
                  onChange={e => setFormData({ ...formData, customer_whatsapp: e.target.value })}
                  placeholder="e.g. 081234567890"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <span>🏷️</span> Service Selection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Service Category *</label>
                <select
                  required
                  value={formData.service_id}
                  onChange={e => onServiceChange(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Select Service --</option>
                  {services.filter(s => s.isActive).map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - Rp {(service.basePrice - service.discountValue).toLocaleString()}
                      {service.badgeText && ` (${service.badgeText})`}
                    </option>
                  ))}
                </select>
              </div>

              {availableAddons.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span>🛍️</span> Available Add-ons
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                    {availableAddons.map(addon => {
                      const isSelected = selectedAddons.has(addon.id);
                      const quantity = selectedAddons.get(addon.id) || 1;
                      return (
                        <div key={addon.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleAddon(addon.id)}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{addon.name}</div>
                              <div className="text-sm text-green-600 font-bold">+Rp {addon.price.toLocaleString()}</div>
                            </div>
                          </label>
                          {isSelected && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => onUpdateAddonQuantity(addon.id, quantity - 1)}
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateAddonQuantity(addon.id, quantity + 1)}
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.service_id && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Price:</span>
                    <span className="text-xl font-black text-green-600">Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
              <span>📅</span> Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Session Date *</label>
                <input
                  required
                  type="date"
                  value={formData.booking_date}
                  onChange={e => setFormData({ ...formData, booking_date: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Session Time * (30-min intervals)</label>
                <input
                  required
                  type="time"
                  step="1800"
                  value={formData.booking_time}
                  onChange={e => setFormData({ ...formData, booking_time: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">e.g., 09:00, 09:30, 10:00</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Location Link</label>
                <input
                  type="url"
                  value={formData.location_link}
                  onChange={e => setFormData({ ...formData, location_link: e.target.value })}
                  placeholder="e.g. Google Maps link"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.booking_notes}
                  onChange={e => setFormData({ ...formData, booking_notes: e.target.value })}
                  placeholder="Special requests, instructions, etc."
                  rows={3}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Photographer Assignment */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span>📷</span> Photographer Assignment (Optional)
            </h3>
            <select
              value={formData.photographer_id}
              onChange={e => setFormData({ ...formData, photographer_id: e.target.value })}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Not Assigned --</option>
              {photographers.filter(p => p.is_active).map(photographer => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Information */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <span>💶</span> Initial Payment (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">DP Amount (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.dp_amount}
                  onChange={e => setFormData({ ...formData, dp_amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Payment Note</label>
                <input
                  type="text"
                  value={formData.payment_note}
                  onChange={e => setFormData({ ...formData, payment_note: e.target.value })}
                  placeholder="e.g. DP Awal, Cash, Transfer"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Leave DP amount as 0 if no payment is made yet</p>
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
              className="flex-1 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>💾</span>
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
