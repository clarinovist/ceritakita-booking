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
    const updateFormData = isContextMode ? context.updateFormData : () => { };
    const errors = isContextMode ? context.errors : {};
    const setFieldError = isContextMode ? context.setFieldError : () => { };
    const clearFieldError = isContextMode ? context.clearFieldError : () => { };

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [settings, setSettings] = useState<{
        min_booking_notice: number;
        max_booking_ahead: number;
    } | null>(null);

    // Fetch booking rules settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        min_booking_notice: parseInt(data.min_booking_notice) || 1,
                        max_booking_ahead: parseInt(data.max_booking_ahead) || 90
                    });
                } else {
                    // Default values if fetch fails
                    setSettings({ min_booking_notice: 1, max_booking_ahead: 90 });
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                // Default values on error
                setSettings({ min_booking_notice: 1, max_booking_ahead: 90 });
            }
        };

        fetchSettings();
    }, []);

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
        const newDate = e.target.value;

        // Validate against booking rules
        if (settings && isContextMode) {
            const validationError = validateBookingDate(newDate);
            if (validationError) {
                setFieldError('date', validationError);
                return; // Don't update if invalid
            }
        }

        if (isContextMode) {
            updateFormData({ date: newDate });
            if (!touched.date) setTouched(prev => ({ ...prev, date: true }));
            clearFieldError('date'); // Clear error if validation passes
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

    // Validate booking date against rules
    const validateBookingDate = (date: string): string | null => {
        if (!settings) return null;

        const selectedDate = new Date(date);
        const today = new Date();

        // Reset time to midnight for accurate date comparison
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check minimum booking notice
        if (daysDiff < settings.min_booking_notice) {
            return `Booking must be made at least ${settings.min_booking_notice} day(s) in advance`;
        }

        // Check maximum booking ahead
        if (daysDiff > settings.max_booking_ahead) {
            return `Cannot book more than ${settings.max_booking_ahead} days in advance`;
        }

        return null;
    };

    // Check if date is disabled based on rules
    const isDateDisabled = (dateString: string): boolean => {
        if (!settings) return false;

        const checkDate = new Date(dateString);
        const today = new Date();

        checkDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return daysDiff < settings.min_booking_notice || daysDiff > settings.max_booking_ahead;
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
        if (!isContextMode || !settings) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + settings.min_booking_notice);

        const dateString = tomorrow.toISOString().split('T')[0] || '';
        if (!isDateDisabled(dateString)) {
            updateFormData({ date: dateString });
            setTouched(prev => ({ ...prev, date: true }));
        }
    };

    const setNextWeek = () => {
        if (!isContextMode || !settings) return;
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const dateString = nextWeek.toISOString().split('T')[0] || '';
        if (!isDateDisabled(dateString)) {
            updateFormData({ date: dateString });
            setTouched(prev => ({ ...prev, date: true }));
        }
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

    // Get min and max dates for the date input
    const getMinDate = () => {
        if (!settings) return '';
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + settings.min_booking_notice);
        return minDate.toISOString().split('T')[0] || '';
    };

    const getMaxDate = () => {
        if (!settings) return '';
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + settings.max_booking_ahead);
        return maxDate.toISOString().split('T')[0] || '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 text-lg font-bold text-olive-800">
                <Calendar className="text-olive-600" size={24} />
                <h2 className="font-display text-xl">Jadwal & Lokasi</h2>
            </div>

            {/* Booking Rules Info */}
            {settings && (
                <div className="bg-cream-100 border border-olive-200 rounded-lg p-3 text-sm text-olive-700">
                    <strong className="text-gold-600">Petunjuk Pemesanan:</strong> Minimal {settings.min_booking_notice} hari sebelumnya, maksimal {settings.max_booking_ahead} hari ke depan.
                </div>
            )}

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
                            min={getMinDate()}
                            max={getMaxDate()}
                            aria-invalid={!!dateError}
                            className="w-full p-3 bg-white border border-olive-200 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 transition-all touch-target"
                        />
                    </FieldValidationWrapper>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs text-olive-500 font-medium">Tanggal</label>
                        <input
                            required
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleDateChange}
                            min={getMinDate()}
                            max={getMaxDate()}
                            className="w-full p-2.5 bg-cream-50 border border-olive-200 rounded-lg outline-none focus:ring-2 focus:ring-gold-500"
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
                                className="w-full pl-10 pr-3 p-3 bg-white border border-olive-200 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 appearance-none cursor-pointer touch-target"
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
                        <label className="text-xs text-olive-500 font-medium">Jam (interval 30 menit)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400 pointer-events-none z-10" size={16} />
                            <select
                                required
                                name="time"
                                value={formData.time}
                                onChange={handleTimeChange}
                                className="w-full pl-10 pr-3 p-2.5 bg-cream-50 border border-olive-200 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 appearance-none cursor-pointer"
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
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400 pointer-events-none z-10" size={16} />
                            <input
                                required
                                type="url"
                                name="location_link"
                                value={formData.location_link}
                                onChange={handleLocationChange}
                                onBlur={() => setTouched(prev => ({ ...prev, location_link: true }))}
                                placeholder="Masukkan link Google Maps lokasi"
                                className="w-full pl-10 pr-3 p-3 bg-white border border-olive-200 rounded-lg outline-none focus:ring-2 focus:ring-gold-500 touch-target"
                                aria-describedby={locationError ? 'location-error' : undefined}
                                aria-invalid={!!locationError}
                            />
                        </div>
                    </FieldValidationWrapper>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs text-olive-500 font-medium flex items-center gap-1">
                            <MapPin size={12} /> Lokasi Photoshoot
                        </label>
                        <input
                            required
                            type="url"
                            name="location_link"
                            value={formData.location_link}
                            onChange={handleLocationChange}
                            placeholder="Masukkan link Google Maps lokasi"
                            className="w-full p-3 bg-cream-50 border border-olive-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none"
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
            <div className="bg-cream-100 border border-olive-200 rounded-lg p-3 text-sm text-olive-700">
                <strong className="text-gold-600">Petunjuk:</strong>
                {isOutdoorService
                    ? 'Untuk layanan outdoor, lokasi wajib diisi dengan link Google Maps yang valid.'
                    : 'Pilih tanggal dan jam yang sesuai untuk sesi foto Anda.'}
            </div>

            {/* Quick Actions (context mode only) */}
            {isContextMode && settings && (
                <div className="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={setTomorrow}
                        disabled={isDateDisabled(new Date(Date.now() + settings.min_booking_notice * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '')}
                        className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-olive-800 rounded-lg text-sm font-medium transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {settings.min_booking_notice === 0 ? 'Hari Ini' : `Besok (+${settings.min_booking_notice} hari)`}
                    </button>

                    <button
                        type="button"
                        onClick={setNextWeek}
                        disabled={isDateDisabled(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '')}
                        className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-olive-800 rounded-lg text-sm font-medium transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        1 Minggu Lagi
                    </button>

                    <button
                        type="button"
                        onClick={setMorning}
                        className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-olive-800 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        Pagi (09:00)
                    </button>

                    <button
                        type="button"
                        onClick={setAfternoon}
                        className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-olive-800 rounded-lg text-sm font-medium transition-colors touch-target"
                    >
                        Siang (14:00)
                    </button>
                </div>
            )}
        </div>
    );
};
