import { SystemSettings } from '@/lib/types/settings';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    settings: SystemSettings | null;
    onChange: (key: keyof SystemSettings, value: string | boolean) => void;
}

export function EmailReportsSettings({ settings, onChange }: Props) {
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    if (!settings) return null;

    const handleTestEmail = async (type: string) => {
        setIsSendingTest(true);
        setTestStatus(null);
        try {
            const res = await fetch(`/api/reports/email?type=${type}`, {
                method: 'POST',
                headers: {
                    'x-cron-secret': process.env.NEXT_PUBLIC_REPORT_CRON_SECRET || 'ck_report_cron_5e8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b' // fallback for client testing
                }
            });
            const data = await res.json();
            if (data.success) {
                setTestStatus({ type: 'success', msg: `Test ${type} report sent successfully.` });
            } else {
                setTestStatus({ type: 'error', msg: data.error || 'Failed to send test report' });
            }
        } catch (error) {
            setTestStatus({ type: 'error', msg: 'Something went wrong while sending test email.' });
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Customer Email Notifications Section */}
            <div className="pb-8 border-b border-slate-200">
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

            {/* Admin Reports Section */}
            <div>
                <h3 className="text-lg font-medium">Automated Admin Reports</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Configure automated business reports sent to your email. Ensure cron jobs are set up on your server to trigger these reports automatically.
                </p>
            </div>

            <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-lg flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium">Cron Job Setup Required</p>
                    <p className="text-sm text-blue-700 mt-1">
                        Enabling reports here only activates the configuration. You still need to configure the server CRON to hit the API route <code>/api/reports/email?type=daily</code>.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Toggle */}
                    <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between col-span-1 md:col-span-2">
                        <div>
                            <label className="text-sm font-medium text-slate-900 block" htmlFor="email_reports_enabled">
                                Enable All Automated Reports
                            </label>
                            <p className="text-xs text-slate-500 mt-1">Master switch to turn all automated reports on or off.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                id="email_reports_enabled"
                                className="sr-only peer"
                                checked={settings.email_reports_enabled === true || String(settings.email_reports_enabled) === 'true'}
                                onChange={(e) => onChange('email_reports_enabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium mb-1" htmlFor="email_reports_target_email">
                            Target Email Address
                        </label>
                        <input
                            type="email"
                            id="email_reports_target_email"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={settings.email_reports_target_email || ''}
                            onChange={(e) => onChange('email_reports_target_email', e.target.value)}
                            placeholder="e.g. admin@ceritakita.studio"
                        />
                        <p className="text-xs text-slate-500 mt-1">The email address that will receive the reports.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-900 border-b pb-2">Active Reports</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Daily Digest</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.email_reports_daily === true || String(settings.email_reports_daily) === 'true'}
                                        onChange={(e) => onChange('email_reports_daily', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                </label>
                                <p className="text-xs text-slate-500 mb-4">Summary of today&apos;s new bookings, payments, and upcoming sessions.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleTestEmail('daily')}
                                disabled={isSendingTest}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-md transition-colors w-full"
                            >
                                Send Test
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Weekly Summary</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.email_reports_weekly === true || String(settings.email_reports_weekly) === 'true'}
                                        onChange={(e) => onChange('email_reports_weekly', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                </label>
                                <p className="text-xs text-slate-500 mb-4">Weekly performance metrics, KPI trends, and top services.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleTestEmail('weekly')}
                                disabled={isSendingTest}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-md transition-colors w-full"
                            >
                                Send Test
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Monthly P&L</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.email_reports_monthly === true || String(settings.email_reports_monthly) === 'true'}
                                        onChange={(e) => onChange('email_reports_monthly', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                </label>
                                <p className="text-xs text-slate-500 mb-4">Comprehensive monthly profit and loss report and cash position.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleTestEmail('monthly')}
                                disabled={isSendingTest}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-md transition-colors w-full"
                            >
                                Send Test
                            </button>
                        </div>
                    </div>
                </div>

                {testStatus && (
                    <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${testStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {testStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {testStatus.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
