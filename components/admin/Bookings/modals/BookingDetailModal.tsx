'use client';

import React from 'react';
import { formatDateTime } from '@/utils/dateFormatter';
import type { Booking } from '@/lib/storage';
import type { Photographer } from '@/lib/photographers';

interface BookingDetailModalProps {
  booking: Booking | null;
  photographers: Photographer[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Booking['status']) => void;
  onUpdate: (id: string, updates: Partial<Booking>) => void;
  onUpdateFinance: (id: string, finance: any) => void;
  onOpenRescheduleModal: (bookingId: string, currentDate: string) => void;
  calculateFinance: (booking: Booking) => { total: number; paid: number; balance: number; isPaidOff: boolean };
  getOrReconstructBreakdown: (booking: Booking | null) => {
    service_base_price: number;
    base_discount: number;
    addons_total: number;
    coupon_discount: number;
    coupon_code: string | undefined;
    isReconstructed: boolean;
  } | null;
}

export function BookingDetailModal({
  booking,
  photographers,
  onClose,
  onDelete,
  onUpdateStatus,
  onUpdate,
  onUpdateFinance,
  onOpenRescheduleModal,
  calculateFinance,
  getOrReconstructBreakdown,
}: BookingDetailModalProps) {
  if (!booking || !booking.booking) return null;

  const finance = calculateFinance(booking);
  const breakdown = getOrReconstructBreakdown(booking);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0">
          <h2 className="text-2xl font-bold">Booking Details</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(booking.id)}
              className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
              disabled={booking.status === 'Completed'}
            >
              Delete Booking
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500">
              <span style={{ fontSize: '24px' }}>✕</span>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: General Info */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-500 text-sm uppercase">Customer</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  booking.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                  booking.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-green-50 text-green-600 border-green-200'
                }`}>
                  {booking.status}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-bold text-lg">{booking.customer.name}</p>
                <p>WA: {booking.customer.whatsapp}</p>
                <p>Category: {booking.customer.category}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2">Session</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-bold">{formatDateTime(booking.booking.date)}</p>
                <p className="mt-2 text-sm text-gray-600">Notes: {booking.booking.notes || '-'}</p>
                {booking.booking.location_link && (
                  <a href={booking.booking.location_link} target="_blank" className="text-blue-600 hover:underline block mt-2">
                    Open Maps
                  </a>
                )}
              </div>
            </div>

            {/* Immutability Warning for Completed Bookings */}
            {booking.status === 'Completed' && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold text-lg">ℹ️</span>
                  <div>
                    <h4 className="font-bold text-blue-800 text-sm mb-1">Booking Completed</h4>
                    <p className="text-blue-700 text-xs">
                      This booking is marked as completed and cannot be modified or deleted.
                      Contact a system administrator if changes are required.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-50 p-4 rounded border border-orange-100">
              <h4 className="font-bold text-orange-800 text-sm mb-2">Manage Status</h4>
              {booking.status === 'Completed' ? (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                  <span className="text-blue-600 font-bold text-sm">
                    Status: Completed ✓ (Immutable)
                  </span>
                </div>
              ) : (
                <select
                  value={booking.status}
                  onChange={(e) => onUpdateStatus(booking.id, e.target.value as Booking['status'])}
                  className="w-full p-2 border rounded"
                >
                  <option value="Active">Active (Confirmed)</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Canceled">Canceled</option>
                  <option value="Completed">Completed</option>
                </select>
              )}
              <button
                onClick={() => onOpenRescheduleModal(booking.id, booking.booking.date)}
                disabled={booking.status === 'Completed'}
                className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                  booking.status === 'Completed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>📅</span>
                Reschedule Date/Time
              </button>
            </div>

            {booking.reschedule_history && booking.reschedule_history.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
                <h4 className="font-bold text-yellow-800 text-sm mb-2">Reschedule History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {booking.reschedule_history.map((history, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-600">Changed on: {formatDateTime(history.rescheduled_at)}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="line-through text-red-600">{formatDateTime(history.old_date)}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{formatDateTime(history.new_date)}</span>
                      </div>
                      {history.reason && (
                        <div className="mt-1 text-gray-500">
                          Reason: {history.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-purple-50 p-4 rounded border border-purple-100">
              <h4 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-2">
                <span>📷</span> Assign Photographer
              </h4>
              <select
                value={booking.photographer_id || ''}
                onChange={(e) => onUpdate(booking.id, { photographer_id: e.target.value || undefined })}
                disabled={booking.status === 'Completed'}
                className={`w-full p-2 border rounded ${
                  booking.status === 'Completed'
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-white'
                }`}
              >
                <option value="">-- Not Assigned --</option>
                {photographers.filter(p => p.is_active).map(photographer => (
                  <option key={photographer.id} value={photographer.id}>
                    {photographer.name} {photographer.specialty ? `(${photographer.specialty})` : ''}
                  </option>
                ))}
              </select>
              {booking.photographer_id && (
                <p className="text-xs text-purple-600 mt-1">
                  Assigned to: {photographers.find(p => p.id === booking.photographer_id)?.name || 'Unknown'}
                </p>
              )}
            </div>
          </div>

          {/* Right: Finance */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-500 text-sm uppercase mb-2">
              Financials
            </h3>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
              <h4 className="font-bold text-sm mb-3 text-gray-700">Price Breakdown</h4>

              {breakdown && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Base Price:</span>
                    <span className="font-semibold">Rp {breakdown?.service_base_price?.toLocaleString('id-ID') ?? '0'}</span>
                  </div>

                  {breakdown.addons_total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Add-ons Total:</span>
                      <span className="font-semibold text-green-600">+ Rp {breakdown?.addons_total?.toLocaleString('id-ID') ?? '0'}</span>
                    </div>
                  )}

                  {breakdown.base_discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Discount:</span>
                      <span className="font-semibold text-red-600">- Rp {breakdown?.base_discount?.toLocaleString('id-ID') ?? '0'}</span>
                    </div>
                  )}

                  {breakdown.coupon_discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Coupon Discount
                        {breakdown.coupon_code && (
                          <span className="ml-1 text-xs font-mono bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                            {breakdown.coupon_code}
                          </span>
                        )}:
                      </span>
                      <span className="font-semibold text-red-600">- Rp {breakdown?.coupon_discount?.toLocaleString('id-ID') ?? '0'}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-blue-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-bold text-base text-gray-900">Grand Total:</span>
                    <span className="font-bold text-xl text-blue-600">Rp {booking.finance.total_price.toLocaleString('id-ID')}</span>
                  </div>

                  {breakdown.isReconstructed && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded mt-2">
                      ℹ️ Breakdown reconstructed from booking data
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t-2 border-blue-300 space-y-3">
                {(() => {
                  const firstPayment = booking.finance.payments[0];

                  return (
                    <>
                      {firstPayment && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Down Payment (DP):</span>
                          <span className="font-semibold text-green-600">
                            Rp {firstPayment.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Total Dibayar:</span>
                        <span className="font-bold text-lg text-green-600">
                          Rp {finance.paid.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {finance.balance > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-700">Sisa Pembayaran:</span>
                          <span className="font-bold text-lg text-orange-600">
                            Rp {finance.balance.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}

                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                            style={{ width: `${(finance.paid / finance.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {((finance.paid / finance.total) * 100).toFixed(0)}% terbayar
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Status:</span>
                <span className={`font-bold text-base ${finance.isPaidOff ? 'text-green-600' : 'text-red-600'}`}>
                  {finance.isPaidOff ? 'LUNAS ✓' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>

            {booking.addons && booking.addons.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <span>🛍️</span> Selected Add-ons
                </h4>
                <div className="space-y-2">
                  {booking.addons.map((addon, idx) => (
                    <div key={idx} className="text-sm">
                      <span>
                        {addon.addon_name}
                        {addon.quantity > 1 && <span className="text-gray-500"> x{addon.quantity}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-sm mb-3">Payment History</h4>
              <div className="space-y-3">
                {booking.finance.payments.map((p, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border flex flex-col gap-2">
                    <div className="flex justify-between font-medium">
                      <span>Rp {p.amount.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">{p.date}</span>
                    </div>
                    <div className="text-xs text-gray-500">{p.note}</div>
                    {(p.proof_filename || p.proof_base64) && (
                      <div className="flex flex-col gap-2">
                        <img
                          src={p.proof_filename ? `/api/uploads/payment-proofs/${p.proof_filename}` : p.proof_base64 ?? ''}
                          alt="Payment Proof"
                          className="h-32 object-contain self-start border rounded bg-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Payment Form - Disabled for Completed Bookings */}
            {booking.status === 'Completed' ? (
              <div className="border-t pt-4 mt-4 bg-gray-50 p-3 rounded text-center">
                <p className="text-xs text-gray-600">
                  Payment editing disabled for completed bookings
                </p>
              </div>
            ) : (
              <form
                className="border-t pt-4 mt-4"
                onSubmit={(e) => {
                  e.preventDefault();

                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const amount = Number(formData.get('amount'));
                  const note = formData.get('note') ?? '';
                  if (!amount) return;

                  const newPayment = {
                    date: new Date().toISOString().split('T')[0] ?? '',
                    amount,
                    note: String(note),
                    proof_base64: ''
                  };

                  onUpdateFinance(booking.id, {
                    ...booking.finance,
                    payments: [...booking.finance.payments, newPayment]
                  });
                  form.reset();
                }}
              >
                <h4 className="font-bold text-sm mb-2">Add Payment (Pelunasan)</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input name="amount" type="number" placeholder="Amount" className="border rounded p-2 text-sm" required />
                  <input name="note" type="text" placeholder="Note (e.g. Cash)" className="border rounded p-2 text-sm" required />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded hover:bg-green-700">
                  Add Payment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
