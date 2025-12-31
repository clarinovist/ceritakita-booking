'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import { useMultiStepForm } from '../MultiStepForm';
import { useState, useEffect } from 'react';
import { ValidationMessage, FieldValidationWrapper } from '@/components/ui/ValidationMessage';
import { fieldValidators } from '@/lib/validation/schemas';

interface ScheduleInfoProps {
    formData?: {
        date: string;
        time: string;
        location_link: string;
        category: string;
    };
    handleChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ScheduleInfo = ({ formData: propFormData, handleChange: propHandleChange }: ScheduleInfoProps = {}) => {
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
        
        if (touched.date && formData.date) {
            const error = fieldValidators.date(formData.date);
            if (error) {
                setFieldError('date', error);
            } else {
                clearFieldError('date');
            }
        }
    }, [formData.date, touched.date, isContextMode]);

    useEffect(() => {
        if (!isContextMode) return;
        
        if (touched.time && formData.time) {
            const error = fieldValidators.time(formData.time);
            if (error) {
                setFieldError('time', error);
            } else {
                clearFieldError('time');
            }
        }
    }, [formData.time, touched.time, isContextMode]);

    useEffect(() => {
        if (!isContextMode) return;
        
        if (touched.location_link && formData.location_link) {
            const error = fieldValidators.location_link(formData.location_link);
            if (error) {
                setFieldError('location_link', error);
            } else {
                clearFieldError('location_link');
            }
        }
    }, [formData.location_link, touched.location_link, isContextMode]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            updateFormData({ date: e.target.value });
            if (!touched.date) setTouched(prev => ({ ...prev, date: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isContextMode) {
            updateFormData({ time: e.target.value });
            if (!touched.time) setTouched(prev => ({ ...prev, time: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isContextMode) {
            updateFormData({ location_link: e.target.value });
            if (!touched.location_link) setTouched(prev => ({ ...prev, location_link: true }));
        } else if (propHandleChange) {
            propHandleChange(e);
        }
    };

    const dateError = isContextMode ? errors[3]?.find(e => e.field === 'date') : null;
    const timeError = isContextMode ? errors[3]?.find(e => e.field === 'time') : null;
    const locationError = isContextMode ? errors[3]?.find(e => e.field === 'location_link') : null;

    const category = isContextMode ? context.formData.serviceName : (propFormData?.category || '');
    const isOutdoorService = category.toLowerCase().includes('outdoor');
    // Generate time slots (30-minute intervals)
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    // Quick action handlers (only for context mode)
    const setTomorrow = () => {
        if (!isContextMode) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateFormData({ date: tomorrow.toISOString().split('T')[0] || '' });
        setTouched(prev => ({ ...prev, date: true }));
    };

    const setNextWeek = () => {
        if (!isContextMode) return;
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        updateFormData({ date: nextWeek.toISOString().split('T')[0] || '' });
        setTouched(prev => ({ ...prev, date: true }));
    };

    const setMorning = () => {
        if (!isContextMode) return;
        updateFormData({ time: '09:00' });
        setTouched(prev => ({ ...prev, time: true }));
    };

    const setAfternoon = () => {
        if (!isContextMode) return;
        updateFormData({ time: '14:00' });
        setTouched(prev => ({ ...prev, time: true }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Calendar className="text-primary-600" size={24} />
                <h2>Jadwal & Lokasi</h2>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                {isContextMode ? (
                    <FieldValidationWrapper
                        error={dateError?.message || null}
                        label="Tanggal"
                    >
                        <input
                            required
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleDateChange}
                            onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all touch-target"
                            aria-describedby={dateError ? 'date-error' : undefined}
                            aria-invalid={!!dateError}
                        />
                    </FieldValidationWrapper>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Tanggal</label>
                        <input
                            required
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleDateChange}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Time */}
                {isContextMode ? (
                    <FieldValidationWrapper
                        error={timeError?.message || null}
                        label="Jam (interval 30 menit)"
                    >
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                            <select
                                required
                                name="time"
                                value={formData.time}
                                onChange={handleTimeChange}
                                onBlur={() => setTouched(prev => ({ ...prev, time: true }))}
                                className="w-full pl-10 pr-3 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer touch-target"
                                aria-describedby={timeError ? 'time-error' : undefined}
                                aria-invalid={!!timeError}
                            >
                                <option value="">Pilih waktu</option>
                                {timeSlots.map(timeValue => (
                                    <option key={timeValue} value={timeValue}>
                                        {timeValue}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Contoh: 09:00, 09:30, 10:00</p>
                    </FieldValidationWrapper>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Jam (interval 30 menit)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                            <select
                                required
                                name="time"
                                value={formData.time}
                                onChange={handleTimeChange}
                                className="w-full pl-10 pr-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="">Pilih waktu</option>
                                {timeSlots.map(timeValue => (
                                    <option key={timeValue} value={timeValue}>
                                        {timeValue}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-gray-400">Contoh: 09:00, 09:30, 10:00</p>
                    </div>
                )}
            </div>

            {/* Location (for outdoor services) */}
            {isOutdoorService && (
                isContextMode ? (
                    <FieldValidationWrapper
                        error={locationError?.message || null}
                        label="Lokasi Photoshoot"
                    >
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                            <input
                                required
                                type="url"
                                name="location_link"
                                value={formData.location_link}
                                onChange={handleLocationChange}
                                onBlur={() => setTouched(prev => ({ ...prev, location_link: true }))}
                                placeholder="Masukkan link Google Maps lokasi"
                                className="w-full pl-10 pr-3 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 touch-target"
                                aria-describedby={locationError ? 'location-error' : undefined}
                                aria-invalid={!!locationError}
                            />
                        </div>
                    </FieldValidationWrapper>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <MapPin size={12} /> Lokasi Photoshoot
                        </label>
                        <input
                            required
                            type="url"
                            name="location_link"
                            value={formData.location_link}
                            onChange={handleLocationChange}
                            placeholder="Masukkan link Google Maps lokasi"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>
                )
            )}

            {/* Validation Summary (context mode only) */}
            {isContextMode && (dateError || timeError || locationError) && (
                <div className="space-y-2">
                    {dateError && <ValidationMessage message={dateError.message} type="error" />}
                    {timeError && <ValidationMessage message={timeError.message} type="error" />}
                    {locationError && <ValidationMessage message={locationError.message} type="error" />}
                </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Petunjuk:</strong> 
                {isOutdoorService 
                    ? 'Untuk layanan outdoor, lokasi wajib diisi dengan link Google Maps yang valid.'
                    : 'Pilih tanggal dan jam yang sesuai untuk sesi foto Anda.'}
            </div>

            {/* Quick Actions (context mode only) */}
            {isContextMode && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={setTomorrow}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        Besok
                    </button>
                    
                    <button
                        type="button"
                        onClick={setNextWeek}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        1 Minggu Lagi
                    </button>

                    <button
                        type="button"
                        onClick={setMorning}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        Pagi (09:00)
                    </button>

                    <button
                        type="button"
                        onClick={setAfternoon}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        Siang (14:00)
                    </button>
                </div>
            )}
        </div>
    );
};
