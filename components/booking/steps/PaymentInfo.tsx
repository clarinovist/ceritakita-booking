'use client';

import { MessageSquare, Upload } from 'lucide-react';
import Image from 'next/image';
import { PaymentDetails } from '../components/PaymentDetails';
import { useMultiStepForm } from '../MultiStepForm';
import { useEffect, useState } from 'react';
import { fieldValidators } from '@/lib/validation/schemas';

interface PaymentInfoProps {
    formData?: {
        dp_amount: string;
    };
    handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    proofPreview?: string;
    handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paymentSettings?: any;
    copyToClipboard?: (text: string) => void;
}

export const PaymentInfo = ({
    formData: propFormData,
    handleChange: propHandleChange,
    proofPreview: propProofPreview,
    handleFileChange: propHandleFileChange,
    paymentSettings: propPaymentSettings,
    copyToClipboard: propCopyToClipboard
}: PaymentInfoProps = {}) => {
    // Use context if no props provided (for MultiStepBookingForm)
    const context = useMultiStepForm();
    const isContextMode = !propFormData;

    const formData = isContextMode ? context.formData : propFormData!;
    const updateFormData = isContextMode ? context.updateFormData : () => { };
    const errors = isContextMode ? context.errors : {};
    const setFieldError = isContextMode ? context.setFieldError : () => { };
    const clearFieldError = isContextMode ? context.clearFieldError : () => { };
    const paymentSettings = isContextMode ? context.formData.paymentSettings : propPaymentSettings;
    const copyToClipboard = isContextMode ? (text: string) => {
        navigator.clipboard.writeText(text);
    } : propCopyToClipboard!;

    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // File handling for context mode
    const [proofPreview, setProofPreview] = useState(isContextMode ? context.formData.proofPreview : propProofPreview || '');
    const [proofFile, setProofFile] = useState(isContextMode ? context.formData.proofFile : null);

    // Real-time validation (only in context mode)
    useEffect(() => {
        if (!isContextMode) return;

        if (touched.dp_amount && formData.dp_amount) {
            const error = fieldValidators.dp_amount(formData.dp_amount, context.formData.totalPrice);
            if (error) {
                setFieldError('dp_amount', error);
            } else {
                clearFieldError('dp_amount');
            }
        }
    }, [formData.dp_amount, touched.dp_amount, isContextMode, context.formData.totalPrice]);

    const handleDpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            updateFormData({ dp_amount: e.target.value });
            if (!touched.dp_amount) setTouched(prev => ({ ...prev, dp_amount: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            const file = e.target.files?.[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    setFieldError('proofFile', 'File terlalu besar (maksimal 5MB)');
                    return;
                }

                setProofFile(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setProofPreview(result);
                    updateFormData({
                        proofFile: file,
                        proofPreview: result
                    });
                };
                reader.readAsDataURL(file);
                clearFieldError('proofFile');
            }
        } else if (propHandleFileChange) {
            propHandleFileChange(e);
        }
    };

    const proofError = isContextMode ? errors[5]?.find(e => e.field === 'proofFile') : null;
    const dpError = isContextMode ? errors[5]?.find(e => e.field === 'dp_amount') : null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-olive-200 space-y-6">
            <div className="flex items-center gap-2 font-bold text-olive-800">
                <MessageSquare className="text-gold-600" size={20} />
                <h3 className="font-display text-xl">Pembayaran DP</h3>
            </div>

            {/* Payment Methods Display */}
            <PaymentDetails
                paymentSettings={paymentSettings}
                copyToClipboard={copyToClipboard}
            />

            {/* DP Amount Input */}
            {isContextMode ? (
                <div className="space-y-1">
                    <label className="text-xs text-olive-500 font-medium font-serif">Jumlah DP (Rp)</label>
                    <input
                        required
                        type="number"
                        name="dp_amount"
                        value={formData.dp_amount}
                        onChange={handleDpAmountChange}
                        onBlur={() => setTouched(prev => ({ ...prev, dp_amount: true }))}
                        placeholder="Masukkan Jumlah DP (Rp)"
                        className="w-full p-3 bg-white border border-olive-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none font-bold text-olive-800"
                        aria-describedby={dpError ? 'dp_amount-error' : undefined}
                        aria-invalid={!!dpError}
                    />
                    {dpError && <p className="text-xs text-red-600" id="dp_amount-error">{dpError.message}</p>}
                </div>
            ) : (
                <input
                    required
                    type="number"
                    name="dp_amount"
                    value={formData.dp_amount}
                    onChange={handleDpAmountChange}
                    placeholder="Masukkan Jumlah DP (Rp)"
                    className="w-full p-3 bg-cream-50 border border-olive-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none font-bold text-olive-800"
                />
            )}

            {/* File Upload */}
            <div className="relative group overflow-hidden bg-cream-50 border-2 border-dashed border-olive-200 rounded-xl p-4 transition-all hover:bg-white hover:border-gold-300">
                <input
                    required={!proofPreview}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {!proofPreview ? (
                    <div className="flex flex-col items-center gap-2 text-olive-500">
                        <Upload size={32} strokeWidth={1.5} className="group-hover:text-gold-500 transition-colors" />
                        <p className="text-sm">Klik untuk upload bukti transfer</p>
                        <p className="text-[10px]">JPG, PNG, GIF, WEBP max 5MB</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <Image
                            src={proofPreview}
                            alt="Preview"
                            width={300}
                            height={128}
                            className="h-32 mx-auto rounded-lg object-contain shadow-sm border bg-white"
                            unoptimized
                        />
                        <p className="text-xs text-gold-600 mt-2 font-bold italic">Bukti terpilih (klik untuk ganti)</p>
                    </div>
                )}
            </div>

            {/* Validation Error */}
            {isContextMode && proofError && (
                <p className="text-xs text-red-600">{proofError.message}</p>
            )}
        </div>
    );
};
