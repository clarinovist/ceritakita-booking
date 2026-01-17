import { XCircle, Printer } from 'lucide-react';
import { SystemSettings } from '@/lib/types/settings';
import { InvoiceTemplate } from '../invoices/InvoiceTemplate';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SystemSettings;
}

export const InvoicePreviewModal = ({
    isOpen,
    onClose,
    settings
}: InvoicePreviewModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:block print:relative">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 print:shadow-none print:w-full print:h-auto print:rounded-none">
                {/* Header - Hidden on Print */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-2xl print:hidden">
                    <div>
                        <h2 className="text-xl font-display font-bold text-slate-900">Invoice Template Preview</h2>
                        <p className="text-sm text-slate-500">This is how your invoices will look to customers</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Test Print
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                            <XCircle size={28} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible text-left">
                    {/* Centered Paper Look */}
                    <div className="shadow-lg mx-auto print:shadow-none">
                        <InvoiceTemplate settings={settings} previewMode={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};
