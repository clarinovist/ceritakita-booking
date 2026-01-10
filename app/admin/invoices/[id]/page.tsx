'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Booking } from '@/lib/storage';

interface Settings {
    site_name: string;
    site_logo: string;
    business_phone: string;
    business_address: string;
    business_email: string;
    bank_name: string;
    bank_number: string;
    bank_holder: string;
    invoice_notes: string;
    tax_rate: number;
}

export default function InvoicePage({ params }: { params: { id: string } }) {
    const { data: session, status } = useSession();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        // Check authentication - ensure user is logged in
        if (!session) {
            redirect('/login');
        }

        // Fetch booking data and settings
        const fetchData = async () => {
            try {
                // Fetch booking
                const bookingRes = await fetch(`/api/bookings/${params.id}`);
                if (!bookingRes.ok) {
                    throw new Error('Booking not found or access denied');
                }
                const bookingData = await bookingRes.json();
                setBooking(bookingData);

                // Fetch settings
                const settingsRes = await fetch('/api/settings');
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);
                }

                // SECURITY: Log invoice access for audit trail
                console.info('[INVOICE_ACCESS]', {
                    bookingId: params.id,
                    accessedBy: session.user?.email || session.user?.name || 'unknown',
                    accessedAt: new Date().toISOString(),
                    customer: bookingData.customer.name
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load booking');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session, status, params.id]);

    // Auto-trigger print when page loads (after data is loaded)
    useEffect(() => {
        if (!loading && booking && !error) {
            // Small delay to ensure everything is rendered before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, booking, error]);

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Invoice</h2>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.close()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-gray-800 font-bold text-lg mb-2">Invoice Not Found</h2>
                    <p className="text-gray-600">The requested booking could not be found.</p>
                    <button
                        onClick={() => window.close()}
                        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    // Calculate finance details
    const finance = {
        total: booking.finance.total_price,
        paid: booking.finance.payments.reduce((sum, p) => sum + p.amount, 0),
        balance: booking.finance.total_price - booking.finance.payments.reduce((sum, p) => sum + p.amount, 0)
    };

    // Calculate breakdown
    const breakdown = {
        service_base_price: booking.finance.service_base_price || 0,
        base_discount: booking.finance.base_discount || 0,
        addons_total: booking.finance.addons_total || 0,
        coupon_discount: booking.finance.coupon_discount || 0,
        coupon_code: booking.finance.coupon_code
    };

    const subtotal = breakdown.service_base_price - breakdown.base_discount + breakdown.addons_total - breakdown.coupon_discount;

    // Calculate tax if configured
    const taxRate = settings?.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalWithTax = subtotal + taxAmount;

    return (
        <div className="min-h-screen bg-white p-4 print:p-0">
            {/* Screen-only Header with Print Button */}
            <div className="print:hidden bg-white border-b pb-3 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
                        <p className="text-sm text-gray-600">Booking #{booking.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                            Print / Save PDF
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Content - Compact Layout */}
            <div className="max-w-4xl mx-auto space-y-3">
                {/* Studio Header - Compact */}
                <div className="border-2 border-gray-900 p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            {settings?.site_logo && (
                                <img
                                    src={settings.site_logo}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/default-logo.png';
                                    }}
                                />
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                                    {(settings?.site_name || 'CERITAKITA STUDIO').toUpperCase()}
                                </h2>
                                <p className="text-gray-600 text-xs">Professional Photography Services</p>
                                <p className="text-gray-500 text-xs mt-0.5">{settings?.business_address || 'Jl. Raya No. 123, Jakarta'}</p>
                                <p className="text-gray-500 text-xs">Ph: {settings?.business_phone || '+62 812 3456 7890'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold">Invoice Date</p>
                            <p className="text-gray-700 text-xs">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs font-semibold mt-1">Invoice No.</p>
                            <p className="text-gray-700 text-xs font-mono">INV-{booking.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Combined Customer & Booking Details - 2 Column Layout */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Customer Details */}
                    <div className="border rounded p-3">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm">BILL TO</h3>
                        <div className="space-y-1.5 text-xs">
                            <div>
                                <p className="text-gray-500">Customer Name</p>
                                <p className="font-semibold text-gray-900">{booking.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">WhatsApp</p>
                                <p className="font-semibold text-gray-900">{booking.customer.whatsapp}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Service Category</p>
                                <p className="font-semibold text-gray-900">{booking.customer.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="border rounded p-3">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm">BOOKING DETAILS</h3>
                        <div className="space-y-1.5 text-xs">
                            <div>
                                <p className="text-gray-500">Session Date & Time</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(booking.booking.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {' at '}
                                    {new Date(booking.booking.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Status</p>
                                <p className={`font-bold text-xs ${booking.status === 'Completed' ? 'text-blue-600' : 'text-green-600'}`}>
                                    {booking.status.toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Booking Date</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(booking.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes - Only if exists */}
                {booking.booking.notes && (
                    <div className="border rounded p-2">
                        <p className="text-gray-500 text-xs font-semibold">Notes:</p>
                        <p className="text-gray-700 text-xs italic">{booking.booking.notes}</p>
                    </div>
                )}

                {/* Itemized Charges - Compact Table */}
                <div className="border rounded overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                                <th className="text-right p-2 font-semibold text-gray-700">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {/* Service Base Price */}
                            {breakdown.service_base_price > 0 && (
                                <tr>
                                    <td className="p-2 text-gray-700">Service Base Price</td>
                                    <td className="p-2 text-right font-semibold">Rp {breakdown.service_base_price.toLocaleString('id-ID')}</td>
                                </tr>
                            )}

                            {/* Base Discount */}
                            {breakdown.base_discount > 0 && (
                                <tr>
                                    <td className="p-2 text-red-600">Service Discount</td>
                                    <td className="p-2 text-right font-semibold text-red-600">- Rp {breakdown.base_discount.toLocaleString('id-ID')}</td>
                                </tr>
                            )}

                            {/* Add-ons */}
                            {booking.addons && booking.addons.length > 0 && booking.addons.map((addon, idx) => (
                                <tr key={idx}>
                                    <td className="p-2 text-gray-700">
                                        {addon.addon_name}
                                        {addon.quantity > 1 && ` (x${addon.quantity})`}
                                    </td>
                                    <td className="p-2 text-right font-semibold">
                                        Rp {(addon.price_at_booking * addon.quantity).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}

                            {/* Coupon Discount */}
                            {breakdown.coupon_discount > 0 && (
                                <tr>
                                    <td className="p-2 text-red-600">
                                        Coupon Discount
                                        {breakdown.coupon_code && (
                                            <span className="ml-1 text-xs font-mono bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                                {breakdown.coupon_code}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-red-600">
                                        - Rp {breakdown.coupon_discount.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            )}

                            {/* Subtotal Row */}
                            <tr className="bg-gray-50 border-t-2 border-gray-300">
                                <td className="p-2 font-bold text-gray-900">SUBTOTAL</td>
                                <td className="p-2 text-right font-bold text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</td>
                            </tr>

                            {/* Tax */}
                            {taxRate > 0 && (
                                <tr>
                                    <td className="p-2 text-gray-700">Tax ({taxRate}%)</td>
                                    <td className="p-2 text-right font-semibold">Rp {taxAmount.toLocaleString('id-ID')}</td>
                                </tr>
                            )}

                            {/* Total */}
                            <tr className="bg-blue-50 border-t-2 border-blue-300">
                                <td className="p-2 font-bold text-sm text-blue-900">TOTAL</td>
                                <td className="p-2 text-right font-bold text-sm text-blue-900">
                                    Rp {(taxRate > 0 ? totalWithTax : booking.finance.total_price).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment History - Compact */}
                {booking.finance.payments.length > 0 && (
                    <div className="border rounded p-3">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm">PAYMENT HISTORY</h3>
                        <div className="space-y-1">
                            {booking.finance.payments.map((payment, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
                                    <div>
                                        <span className="font-semibold text-gray-700">{payment.note}</span>
                                        <span className="text-gray-500 ml-2 text-xs">
                                            {new Date(payment.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <span className="font-bold text-green-600">Rp {payment.amount.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Payment Summary */}
                        <div className="mt-2 pt-2 border-t-2 border-gray-200 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="font-semibold">Rp {finance.total.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Total Paid:</span>
                                <span className="font-semibold text-green-600">Rp {finance.paid.toLocaleString('id-ID')}</span>
                            </div>
                            {finance.balance > 0 && (
                                <div className="flex justify-between text-xs font-bold bg-red-50 p-1.5 rounded">
                                    <span className="text-red-700">Balance Due:</span>
                                    <span className="text-red-700">Rp {finance.balance.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {finance.balance === 0 && (
                                <div className="flex justify-between text-xs font-bold bg-green-50 p-1.5 rounded">
                                    <span className="text-green-700">Payment Status:</span>
                                    <span className="text-green-700">FULLY PAID</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bank Details & Social Links - 2 Column */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Bank Details */}
                    {settings?.bank_name && settings.bank_number && settings.bank_holder && (
                        <div className="border rounded p-3">
                            <h3 className="font-bold text-gray-900 mb-2 text-xs">PAYMENT DETAILS</h3>
                            <div className="space-y-1 text-xs">
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 w-16">Bank:</span>
                                    <span className="text-gray-900">{settings.bank_name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 w-16">Account:</span>
                                    <span className="text-gray-900 font-mono">{settings.bank_number}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 w-16">Holder:</span>
                                    <span className="text-gray-900">{settings.bank_holder}</span>
                                </div>
                            </div>
                        </div>
                    )}


                </div>

                {/* Footer - Compact */}
                <div className="border-t-2 border-gray-300 pt-3 text-center text-xs text-gray-600">
                    <p className="font-semibold mb-1">THANK YOU FOR YOUR BUSINESS!</p>
                    <p className="text-xs mb-0.5">Contact: WhatsApp {settings?.business_phone || '+62 812 3456 7890'}
                        {settings?.business_email && ` | ${settings.business_email}`}
                    </p>
                    {settings?.invoice_notes && (
                        <div className="mt-1 text-xs text-gray-500 italic">
                            {settings.invoice_notes}
                        </div>
                    )}
                    <p className="text-xs mt-1 text-gray-500">
                        Computer-generated invoice. No signature required.
                    </p>
                </div>
            </div>

            {/* Screen-only Print Reminder */}
            <div className="print:hidden mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-800 text-xs">
                    <strong>Tip:</strong> Click "Print / Save PDF" to save this invoice as a PDF file
                </p>
            </div>

            {/* Print Styles - Optimized for Compact Layout */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4;
                    }

                    body {
                        background: white !important;
                        padding: 0 !important;
                        font-size: 11px !important;
                    }

                    .print\:hidden {
                        display: none !important;
                    }

                    .print\:block {
                        display: block !important;
                    }

                    /* Prevent page breaks inside elements */
                    .border, .p-3, .p-2, table {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    /* Optimize spacing for print */
                    .space-y-3 > * + * {
                        margin-top: 0.5rem !important;
                    }

                    /* Ensure colors print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Crisp text rendering */
                    body {
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }

                    /* Reduce overall spacing for compact fit */
                    .max-w-4xl {
                        max-width: 100% !important;
                    }

                    /* Ensure grid columns print correctly */
                    .grid-cols-2 {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 0.5rem !important;
                    }

                    /* Make text slightly smaller in print */
                    .text-xs {
                        font-size: 9px !important;
                    }

                    .text-sm {
                        font-size: 10px !important;
                    }
                }
            `}</style>
        </div>
    );
}
