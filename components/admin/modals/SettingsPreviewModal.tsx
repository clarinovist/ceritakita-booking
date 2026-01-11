import { XCircle, Home, DollarSign, Calendar } from 'lucide-react';
import Image from 'next/image';
import { SystemSettings } from '@/lib/types/settings';

interface SettingsPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SystemSettings;
}

export const SettingsPreviewModal = ({
    isOpen,
    onClose,
    settings
}: SettingsPreviewModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                    <div>
                        <h2 className="text-xl font-display font-bold text-slate-900">Settings Preview</h2>
                        <p className="text-sm text-slate-500">Preview how your settings affect the system</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XCircle size={28} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Branding Preview */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Home size={16} className="text-blue-500" />
                            Branding
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                {settings.site_logo && (
                                    <div className="relative h-12 w-24">
                                        <Image
                                            src={settings.site_logo}
                                            alt="Logo"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{settings.site_name}</div>
                                    <div className="text-xs text-slate-500 mt-1">Logo & Name as seen by users</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finance Preview */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={16} className="text-green-500" />
                            Finance Details
                        </h4>
                        <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-sm">
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Bank Name</span>
                                <span className="font-medium text-slate-900">{settings.bank_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Account Number</span>
                                <span className="font-family-mono font-medium text-slate-900">{settings.bank_number}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Account Holder</span>
                                <span className="font-medium text-slate-900">{settings.bank_holder}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Deposit Required</span>
                                <span className={`font-medium px-2 py-0.5 rounded text-xs ${settings.requires_deposit ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {settings.requires_deposit ? `${settings.deposit_amount}%` : 'No'}
                                </span>
                            </div>
                            {settings.tax_rate > 0 && (
                                <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                    <span className="text-slate-500">Tax Rate</span>
                                    <span className="font-medium text-slate-900">{settings.tax_rate}%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rules Preview */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={16} className="text-purple-500" />
                            Booking Rules
                        </h4>
                        <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-sm">
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Min Notice</span>
                                <span className="font-medium text-slate-900">{settings.min_booking_notice} Day(s)</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-slate-500">Max Booking Ahead</span>
                                <span className="font-medium text-slate-900">{settings.max_booking_ahead} Days</span>
                            </div>
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mt-2">
                                Clients can book dates between <strong>today + {settings.min_booking_notice} days</strong> and <strong>today + {settings.max_booking_ahead} days</strong>.
                            </div>
                        </div>
                    </div>

                    {/* Contact (Invoice) Preview */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="text-orange-500">📄</span>
                            Invoice Footer Info
                        </h4>
                        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-sm space-y-2">
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Business Phone</div>
                                <div className="font-medium text-slate-900">{settings.business_phone}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Business Address</div>
                                <div className="font-medium text-slate-900 whitespace-pre-line">{settings.business_address}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};
