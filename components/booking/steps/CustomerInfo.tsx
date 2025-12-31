'use client';

import { User, MessageSquare } from 'lucide-react';
import { useMultiStepForm } from '../MultiStepForm';
import { useState, useEffect } from 'react';
import { ValidationMessage, FieldValidationWrapper } from '@/components/ui/ValidationMessage';
import { fieldValidators } from '@/lib/validation/schemas';

interface CustomerInfoProps {
    formData?: {
        name: string;
        whatsapp: string;
        notes: string;
    };
    handleChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const CustomerInfo = ({ formData: propFormData, handleChange: propHandleChange }: CustomerInfoProps = {}) => {
    // Use context if no props provided (for MultiStepBookingForm)
    const context = useMultiStepForm();
    const isContextMode = !propFormData;
    
    const formData = isContextMode ? context.formData : propFormData!;
    const updateFormData = isContextMode ? context.updateFormData : () => {};
    const errors = isContextMode ? context.errors : {};
    const setFieldError = isContextMode ? context.setFieldError : () => {};
    const clearFieldError = isContextMode ? context.clearFieldError : () => {};

    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Real-time validation (only in context mode)
    useEffect(() => {
        if (!isContextMode) return;
        
        if (touched.name && formData.name) {
            const error = fieldValidators.name(formData.name);
            if (error) {
                setFieldError('name', error);
            } else {
                clearFieldError('name');
            }
        }
    }, [formData.name, touched.name, isContextMode]);

    useEffect(() => {
        if (!isContextMode) return;
        
        if (touched.whatsapp && formData.whatsapp) {
            const error = fieldValidators.whatsapp(formData.whatsapp);
            if (error) {
                setFieldError('whatsapp', error);
            } else {
                clearFieldError('whatsapp');
            }
        }
    }, [formData.whatsapp, touched.whatsapp, isContextMode]);

    useEffect(() => {
        if (!isContextMode) return;
        
        if (touched.notes && formData.notes) {
            const error = fieldValidators.notes(formData.notes);
            if (error) {
                setFieldError('notes', error);
            } else {
                clearFieldError('notes');
            }
        }
    }, [formData.notes, touched.notes, isContextMode]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            updateFormData({ name: e.target.value });
            if (!touched.name) setTouched(prev => ({ ...prev, name: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            // Format input: allow only numbers
            const value = e.target.value.replace(/\D/g, '');
            updateFormData({ whatsapp: value });
            if (!touched.whatsapp) setTouched(prev => ({ ...prev, whatsapp: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isContextMode) {
            updateFormData({ notes: e.target.value });
            if (!touched.notes) setTouched(prev => ({ ...prev, notes: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const nameError = isContextMode ? errors[4]?.find(e => e.field === 'name') : null;
    const whatsappError = isContextMode ? errors[4]?.find(e => e.field === 'whatsapp') : null;
    const notesError = isContextMode ? errors[4]?.find(e => e.field === 'notes') : null;

    // Format WhatsApp number for display (context mode only)
    const formatWhatsAppDisplay = (value: string) => {
        if (!value) return '';
        // Add spaces for readability
        return value.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <User className="text-primary-600" size={24} />
                <h2>Informasi Kontak</h2>
            </div>

            {/* Name */}
            {isContextMode ? (
                <FieldValidationWrapper
                    error={nameError?.message || null}
                    label="Nama Lengkap"
                >
                    <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleNameChange}
                        onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                        placeholder="Masukkan nama lengkap Anda"
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all touch-target"
                        aria-describedby={nameError ? 'name-error' : undefined}
                        aria-invalid={!!nameError}
                        autoComplete="name"
                    />
                </FieldValidationWrapper>
            ) : (
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Nama Lengkap</label>
                    <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleNameChange}
                        placeholder="Nama Lengkap"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            {/* WhatsApp */}
            {isContextMode ? (
                <FieldValidationWrapper
                    error={whatsappError?.message || null}
                    label="Nomor WhatsApp"
                >
                    <input
                        required
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleWhatsappChange}
                        onBlur={() => setTouched(prev => ({ ...prev, whatsapp: true }))}
                        placeholder="Contoh: 081234567890"
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 touch-target font-mono"
                        aria-describedby={whatsappError ? 'whatsapp-error' : undefined}
                        aria-invalid={!!whatsappError}
                        autoComplete="tel"
                        inputMode="tel"
                    />
                    {formData.whatsapp && (
                        <p className="text-xs text-gray-500 mt-1">
                            Format: {formatWhatsAppDisplay(formData.whatsapp)}
                        </p>
                    )}
                </FieldValidationWrapper>
            ) : (
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Nomor WhatsApp</label>
                    <input
                        required
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleWhatsappChange}
                        placeholder="Nomor WhatsApp"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            {/* Notes */}
            {isContextMode ? (
                <FieldValidationWrapper
                    error={notesError?.message || null}
                    label="Catatan Tambahan (Opsional)"
                >
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleNotesChange}
                        onBlur={() => setTouched(prev => ({ ...prev, notes: true }))}
                        placeholder="Tambahkan catatan atau permintaan khusus..."
                        rows={4}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-none touch-target"
                        aria-describedby={notesError ? 'notes-error' : undefined}
                        aria-invalid={!!notesError}
                        maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Opsional, maksimal 500 karakter</p>
                        {formData.notes && (
                            <span className="text-xs text-gray-500 font-mono">
                                {formData.notes.length}/500
                            </span>
                        )}
                    </div>
                </FieldValidationWrapper>
            ) : (
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Catatan Tambahan (Opsional)</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleNotesChange}
                        placeholder="Catatan tambahan (opsional)"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                    />
                </div>
            )}

            {/* Validation Summary (context mode only) */}
            {isContextMode && (nameError || whatsappError || notesError) && (
                <div className="space-y-2">
                    {nameError && <ValidationMessage message={nameError.message} type="error" />}
                    {whatsappError && <ValidationMessage message={whatsappError.message} type="error" />}
                    {notesError && <ValidationMessage message={notesError.message} type="error" />}
                </div>
            )}

            {/* Help Text (context mode only) */}
            {isContextMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Petunjuk:</strong> Nomor WhatsApp akan digunakan admin untuk menghubungi Anda.
                    Pastikan nomor aktif dan dapat dihubungi.
                </div>
            )}

            {/* Privacy Notice (context mode only) */}
            {isContextMode && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                    <strong>Privasi:</strong> Data Anda aman dan hanya digunakan untuk keperluan booking.
                    Kami tidak membagikan informasi pihak ketiga.
                </div>
            )}
        </div>
    );
};
