import { SystemSettings } from '@/lib/types/settings';

interface Props {
    settings: SystemSettings | null;
    onChange: (key: keyof SystemSettings, value: string | boolean) => void;
}

export function EmailReportsSettings({ settings, onChange }: Props) {
    if (!settings) return null;

    return (
        <div className="space-y-8">
            {/* Customer Email Notifications Section */}
            <div>
                <div>
                    <h3 className="text-lg font-medium">Customer Booking Notifications</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure automated confirmation emails sent to your customers when they complete a booking.
                    </p>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Email Toggle */}
                        <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between col-span-1 md:col-span-2">
                            <div>
                                <label className="text-sm font-medium text-slate-900 block" htmlFor="customer_email_enabled">
                                    Send Booking Confirmation Emails
                                </label>
                                <p className="text-xs text-slate-500 mt-1">Automatically send an email invoice & confirmation to customers upon booking.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="customer_email_enabled"
                                    className="sr-only peer"
                                    checked={settings.customer_email_enabled === true || String(settings.customer_email_enabled) === 'true'}
                                    onChange={(e) => onChange('customer_email_enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Sender Name */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-1" htmlFor="customer_email_sender_name">
                                Sender Name
                            </label>
                            <input
                                type="text"
                                id="customer_email_sender_name"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={settings.customer_email_sender_name || ''}
                                onChange={(e) => onChange('customer_email_sender_name', e.target.value)}
                                placeholder="e.g. Ceritakita Studio"
                            />
                            <p className="text-xs text-slate-500 mt-1">The name your customers will see as the sender of the email.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
