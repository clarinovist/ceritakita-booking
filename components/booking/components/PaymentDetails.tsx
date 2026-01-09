import Image from 'next/image';

interface PaymentDetailsProps {
    paymentSettings: {
        bank_name: string;
        account_name: string;
        account_number: string;
        qris_image_url?: string;
    } | null;
    copyToClipboard: (text: string) => void;
}

export const PaymentDetails = ({ paymentSettings, copyToClipboard }: PaymentDetailsProps) => {
    if (!paymentSettings) return null;

    return (
        <div className="bg-cream-50 p-4 rounded-xl border border-olive-200 space-y-3">
            <h4 className="font-bold text-olive-900 text-sm font-display">Informasi Pembayaran:</h4>

            {/* Bank Transfer */}
            <div className="bg-white p-3 rounded-lg border border-olive-100">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="font-bold text-olive-800 font-serif text-lg">{paymentSettings.bank_name}</p>
                        <p className="text-sm text-olive-600">{paymentSettings.account_name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => copyToClipboard(paymentSettings.account_number)}
                        className="bg-gold-500 hover:bg-gold-600 text-olive-900 text-xs font-bold px-3 py-1 rounded transition-colors shadow-sm"
                    >
                        Copy
                    </button>
                </div>
                <p className="font-serif text-2xl font-bold text-olive-900 tracking-wide">{paymentSettings.account_number}</p>
            </div>

            {/* QRIS */}
            {paymentSettings.qris_image_url && (
                <div className="bg-white p-3 rounded-lg border border-olive-100 text-center">
                    <p className="text-xs font-bold text-olive-600 mb-2">Atau scan QRIS:</p>
                    <div className="inline-block border-2 border-olive-200 rounded-lg overflow-hidden">
                        <Image
                            src={paymentSettings.qris_image_url}
                            alt="QRIS Payment"
                            width={200}
                            height={200}
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
