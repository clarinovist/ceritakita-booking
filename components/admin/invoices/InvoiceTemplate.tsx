import React from 'react';
import Image from 'next/image';
import { SystemSettings } from '@/lib/types/settings';
import { Booking } from '@/lib/types';

interface InvoiceTemplateProps {
    settings: SystemSettings;
    data?: Booking | null;
    previewMode?: boolean;
}

const DUMMY_DATA = {
    id: 'PREVIEW-001',
    created_at: new Date().toISOString(),
    status: 'Active',
    customer: {
        name: 'John Doe',
        whatsapp: '+62 812 3456 7890',
        category: 'Family Photo'
    },
    booking: {
        date: new Date().toISOString(),
        notes: 'This is a sample invoice note for preview purposes.',
        location_link: ''
    },
    finance: {
        total_price: 1500000,
        payments: [],
        service_base_price: 1500000,
        base_discount: 0,
        addons_total: 0,
        coupon_discount: 0
    },
    addons: []
} as unknown as Booking;

export const InvoiceTemplate = ({ settings, data, previewMode = false }: InvoiceTemplateProps) => {
    // Use dummy data if previewMode is true or if data is missing
    const booking = (previewMode || !data) ? DUMMY_DATA : data;

    // Fallback usage of invoices settings, allow overriding specific fields
    const companyName = settings.invoice?.companyName || settings.site_name || 'Company Name';
    const companyAddress = settings.invoice?.companyAddress || settings.business_address || 'Company Address';
    const companyPhone = settings.invoice?.companyPhone || settings.business_phone || 'Phone Number';
    const companyEmail = settings.invoice?.companyEmail || settings.business_email || '';
    const footerNote = settings.invoice?.footerNote || settings.invoice_notes || '';
    const logoUrl = settings.invoice?.logoUrl || settings.site_logo;

    // Calculate finance details
    const finance = {
        total: booking.finance.total_price,
        paid: booking.finance.payments.reduce((sum, p) => sum + p.amount, 0),
        balance: booking.finance.total_price - booking.finance.payments.reduce((sum, p) => sum + p.amount, 0)
    };

    // Calculate breakdown for dummy/real
    const breakdown = {
        service_base_price: booking.finance.service_base_price || 0,
        base_discount: booking.finance.base_discount || 0,
        addons_total: booking.finance.addons_total || 0,
        coupon_discount: booking.finance.coupon_discount || 0,
        coupon_code: booking.finance.coupon_code
    };

    const subtotal = breakdown.service_base_price - breakdown.base_discount + breakdown.addons_total - breakdown.coupon_discount;

    // Calculate tax if configured
    const taxRate = settings.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalWithTax = subtotal + taxAmount;

    return (
        <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900 print:p-0 print:mx-0 print:w-full">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div className="flex gap-4 items-start">
                    {/* Logo */}
                    {logoUrl && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                                src={logoUrl}
                                alt="Company Logo"
                                fill
                                className="object-contain object-left-top"
                            />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 mb-2">
                            {companyName}
                        </h1>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p className="whitespace-pre-line">{companyAddress}</p>
                            <p>Phone: {companyPhone}</p>
                            {companyEmail && <p>Email: {companyEmail}</p>}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-light text-slate-300 tracking-widest mb-4">INVOICE</div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500 font-medium">Invoice No:</span>
                            <span className="font-mono font-bold">#{booking.id ? booking.id.toString().slice(0, 8).toUpperCase() : 'INV-001'}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500 font-medium">Date:</span>
                            <span>{new Date().toLocaleDateString('en-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-slate-500 font-medium">Status:</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase
                                ${finance.balance <= 0 ? 'bg-green-100 text-green-700' :
                                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                }
                            `}>
                                {finance.balance <= 0 ? 'PAID' : booking.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="font-bold text-lg text-slate-800 mb-1">{booking.customer.name}</p>
                        <p className="text-sm text-slate-600 mb-1">{booking.customer.whatsapp}</p>
                        <p className="text-sm text-slate-500">{booking.customer.category}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Details</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Service Category</span>
                            <span className="font-medium">{booking.customer.category}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Session Date</span>
                            <span className="font-medium">
                                {new Date(booking.booking.date).toLocaleDateString('en-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500">Session Time</span>
                            <span className="font-medium">
                                {new Date(booking.booking.date).toLocaleTimeString('en-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="py-3 px-4 text-left font-semibold rounded-l-lg">Description</th>
                            <th className="py-3 px-4 text-right font-semibold rounded-r-lg w-40">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Base Price */}
                        <tr>
                            <td className="py-3 px-4">
                                <p className="font-medium text-slate-800">Service Base Price</p>
                                <p className="text-xs text-slate-500">Base rate for {booking.customer.category} category</p>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                                Rp {breakdown.service_base_price.toLocaleString('id-ID')}
                            </td>
                        </tr>

                        {/* Discounts */}
                        {breakdown.base_discount > 0 && (
                            <tr>
                                <td className="py-3 px-4 text-red-600">
                                    Discount
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-red-600">
                                    - Rp {breakdown.base_discount.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        )}

                        {/* Addons */}
                        {booking.addons && booking.addons.length > 0 && booking.addons.map((addon, idx) => (
                            <tr key={`addon-${idx}`}>
                                <td className="py-3 px-4">
                                    <p className="font-medium text-slate-800">{addon.addon_name}</p>
                                    {addon.quantity > 1 && <span className="text-xs text-slate-500">Qty: {addon.quantity}</span>}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">
                                    Rp {(addon.price_at_booking * addon.quantity).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}

                        {/* Coupon */}
                        {breakdown.coupon_discount > 0 && (
                            <tr>
                                <td className="py-3 px-4 text-red-600">
                                    Coupon Applied {breakdown.coupon_code && <span className="bg-red-50 px-1 py-0.5 rounded text-xs font-mono ml-1">{breakdown.coupon_code}</span>}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-red-600">
                                    - Rp {breakdown.coupon_discount.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-80 space-y-3">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>

                    {taxRate > 0 && (
                        <div className="flex justify-between text-slate-600">
                            <span>Tax ({taxRate}%)</span>
                            <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                    )}

                    <div className="flex justify-between py-3 border-t-2 border-slate-800 text-lg font-bold text-slate-900">
                        <span>Total</span>
                        <span>Rp {(taxRate > 0 ? totalWithTax : booking.finance.total_price).toLocaleString('id-ID')}</span>
                    </div>

                    {/* Amount Due / Paid Badge */}
                    <div className={`mt-4 p-3 rounded-lg flex justify-between items-center font-bold border ${finance.balance > 0
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        <span>{finance.balance > 0 ? 'AMOUNT DUE' : 'FULLY PAID'}</span>
                        <span>Rp {finance.balance > 0 ? finance.balance.toLocaleString('id-ID') : '0'}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-8 pb-4">
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <h4 className="font-bold text-slate-900 mb-2">Payment Details</h4>
                        <div className="text-slate-600 space-y-1">
                            <p>Bank: <span className="font-medium text-slate-900">{settings.bank_name}</span></p>
                            <p>Account: <span className="font-font-mono font-medium text-slate-900">{settings.bank_number}</span></p>
                            <p>A/N: <span className="font-medium text-slate-900">{settings.bank_holder}</span></p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-2">Notes</h4>
                        <p className="text-slate-600 whitespace-pre-wrap text-xs leading-relaxed">
                            {footerNote}
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>Thank you for choosing {companyName}!</p>
                </div>
            </div>
        </div>
    );
};
