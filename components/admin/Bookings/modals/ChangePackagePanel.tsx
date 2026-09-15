'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib';
import { apiGet, apiPost } from '@/lib/fetch';
import type { Booking, Service, PackageChangePreview, PackageChangeHistory } from '@/lib/types';

const money = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

export function ChangePackagePanel({ booking, services, onChanged }: {
  booking: Booking; services: Service[]; onChanged: (booking: Booking) => void;
}) {
  const { data: session } = useSession();
  const user = session?.user as { role?: string; permissions?: unknown } | undefined;
  const canEdit = user?.role === 'admin' || hasPermission(user?.permissions, 'booking.update');
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<PackageChangePreview | null>(null);
  const [history, setHistory] = useState<PackageChangeHistory[]>([]);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    const id = ++generation.current;
    setOpen(false); setPreview(null); setReason(''); setServiceId(''); setError(''); setBusy(false);
    setHistory([]); setHistoryError('');
    apiGet<PackageChangeHistory[]>(`/api/bookings/change-package?bookingId=${booking.id}`)
      .then(data => { if (generation.current === id) setHistory(data); })
      .catch(() => { if (generation.current === id) setHistoryError('Riwayat pergantian paket gagal dimuat. Buka ulang detail untuk mencoba lagi.'); });
    return () => { generation.current += 1; };
  }, [booking]);

  async function submit(commit: boolean) {
    const id = generation.current;
    setBusy(true); setError('');
    try {
      const result = await apiPost<{ preview: PackageChangePreview; booking?: Booking; history?: PackageChangeHistory[] }>(
        '/api/bookings/change-package', { bookingId: booking.id, serviceId, reason, ...(commit && preview ? { previewToken: preview.token } : {}) },
      );
      if (generation.current !== id) return;
      if (result.booking) {
        onChanged(result.booking);
        setOpen(false); setPreview(null);
      } else setPreview(result.preview);
    } catch (err) {
      if (generation.current === id) { setPreview(null); setError(err instanceof Error ? err.message : 'Gagal mengganti paket'); }
    } finally { if (generation.current === id) setBusy(false); }
  }

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
      <h4 className="font-semibold text-indigo-900">Paket Booking</h4>
      <p className="text-sm">{booking.customer.category}</p>
      {booking.status === 'Active' && canEdit ? (
        <button type="button" disabled={busy} onClick={() => { setOpen(!open); setPreview(null); setError(''); }}
          className="rounded bg-indigo-700 px-3 py-2 text-sm text-white disabled:opacity-50">{open ? 'Tutup' : 'Ganti Paket'}</button>
      ) : <p className="text-xs text-gray-600">Ganti paket memerlukan izin edit dan status Active. Booking Completed tetap dikunci.</p>}
      {open && <div className="space-y-3">
        <label className="block text-sm">Paket baru
          <select aria-label="Paket baru" value={serviceId} disabled={busy} onChange={e => { setServiceId(e.target.value); setPreview(null); }} className="mt-1 w-full rounded border p-2">
            <option value="">Pilih paket…</option>
            {services.filter(s => s.isActive && s.id !== booking.customer.serviceId).map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.basePrice - s.discountValue)}</option>)}
          </select>
        </label>
        <label className="block text-sm">Alasan perubahan
          <textarea aria-label="Alasan perubahan" value={reason} maxLength={500} disabled={busy}
            onChange={e => { setReason(e.target.value); setPreview(null); }} className="mt-1 w-full rounded border p-2" placeholder="Contoh: customer upgrade saat datang" />
        </label>
        <p className="text-xs text-gray-600">Harga katalog terbaru digunakan. Promo lama dilepas; tambahan yang tidak sesuai dan penyesuaian upgrade/downgrade juga dilepas. DP dan bukti pembayaran tetap tersimpan.</p>
        <button type="button" onClick={() => submit(false)} disabled={busy || !serviceId || !reason.trim()}
          className="rounded border border-indigo-600 px-3 py-2 text-sm text-indigo-800 disabled:opacity-50">{busy ? 'Memproses…' : 'Lihat Preview'}</button>
        {preview && <div className="rounded border bg-white p-3 space-y-2 text-sm" role="status">
          <p className="font-semibold">{preview.before.serviceName} → {preview.after.serviceName}</p>
          <p>Total lama: {money(preview.before.finance.total_price)}</p>
          <p>Harga paket baru: {money(preview.after.finance.service_base_price || 0)}</p>
          <p>Diskon paket: {money(preview.after.finance.base_discount || 0)}</p>
          <p>Tambahan dipertahankan: {money(preview.after.finance.addons_total || 0)}</p>
          <p className="font-bold">Total baru: {money(preview.after.finance.total_price)} (selisih {money(preview.difference)})</p>
          <p>Sudah dibayar: {money(preview.paid)} · Sisa: {money(preview.balance)}</p>
          {preview.before.finance.coupon_code && <p className="text-amber-800">Promo {preview.before.finance.coupon_code} dilepas.</p>}
          {preview.removedAddons.length > 0 && <p className="text-amber-800">Item dilepas: {preview.removedAddons.map(a => a.addon_name).join(', ')}</p>}
          {preview.overpaid > 0 && <p className="font-semibold text-amber-800">Kelebihan bayar {money(preview.overpaid)}. Tindak lanjut refund/kredit secara manual; tidak diproses otomatis.</p>}
          <button type="button" onClick={() => submit(true)} disabled={busy} className="rounded bg-indigo-700 px-3 py-2 text-white disabled:opacity-50">Konfirmasi Ganti Paket</button>
        </div>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>}
      {historyError && <p role="alert" className="text-xs text-red-700">{historyError}</p>}
      {history.length > 0 && <details>
        <summary className="cursor-pointer text-sm font-semibold">Riwayat ganti paket ({history.length})</summary>
        <div className="mt-2 max-h-64 overflow-auto space-y-2">{history.map(item => <div key={item.id} className="rounded bg-white p-2 text-xs space-y-1">
          <p className="font-semibold">{item.before.serviceName} → {item.after.serviceName}</p>
          <p>{money(item.before.finance.total_price)} → {money(item.after.finance.total_price)}</p>
          <p>{item.reason}</p>
          <p className="text-gray-500">{new Date(item.changed_at).toLocaleString('id-ID')} · {item.actor}</p>
        </div>)}</div>
      </details>}
    </section>
  );
}
