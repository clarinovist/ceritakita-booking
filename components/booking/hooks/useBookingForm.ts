/**
 * useBookingForm — refactored thin adapter over split sub-hooks.
 *
 * Previously 425-line monolith. Now delegates to:
 *   • useBookingCoupon  — coupon validation & suggestions
 *   • useBookingSubmission — file upload, WhatsApp, submit
 *   • lib/pricing      — pure price calculations
 *
 * Retains full legacy return API so BookingForm.tsx needs zero changes.
 */

import {
    useState, useEffect, useCallback,
    ChangeEvent, FormEvent
} from 'react';
import { Service, Addon, PaymentSettings, BookingFormData, BookingPayload, CouponValidation, Coupon } from '@/lib/types';
import { calculateDetailedPricing } from '@/lib/pricing';
import { generateWhatsAppMessage, generateWhatsAppLink } from '@/lib/whatsapp-template';
import { useSettings } from '@/components/providers/SettingsContext';
import { apiFetch, apiPost } from '@/lib/fetch';
import { useRef } from 'react';

function toast(msg: string) { alert(msg); }

export function useBookingForm() {
    const { settings } = useSettings();

    // ── Form field state ─────────────────────────────
    const [formData, setFormData] = useState<BookingFormData>({
        name: '', whatsapp: '', email: '', date: '', time: '',
        category: '', location_link: '', notes: '', dp_amount: ''
    });

    // ── Service catalog ──────────────────────────────
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // ── Add-ons ──────────────────────────────────────
    const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

    // ── Payment settings (legacy compat) ──────────────
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

    // ── Proof upload ─────────────────────────────────
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');

    // ── Coupon state ─────────────────────────────────
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [suggestedCoupons, setSuggestedCoupons] = useState<Coupon[]>([]);

    // ── Submission loading ───────────────────────────
    const [loading, setLoading] = useState(false);

    // Refs for stable callback identity in intervals
    const selectedServiceRef = useRef(selectedService);
    const selectedAddonsRef = useRef(selectedAddons);
    const availableAddonsRef = useRef(availableAddons);
    const appliedCouponRef = useRef(appliedCoupon);

    useEffect(() => { selectedServiceRef.current  = selectedService;  }, [selectedService]);
    useEffect(() => { selectedAddonsRef.current   = selectedAddons;   }, [selectedAddons]);
    useEffect(() => { availableAddonsRef.current  = availableAddons;  }, [availableAddons]);
    useEffect(() => { appliedCouponRef.current    = appliedCoupon;    }, [appliedCoupon]);

    // ── Price helpers (pure) ──────────────────────────
    const buildAddonList = useCallback((
        prevAddons = selectedAddons,
        fullList  = availableAddons
    ) => {
        return Array.from(prevAddons.entries()).map(([id, qty]) => {
            const addon = fullList.find(a => a.id === id);
            return { price: addon?.price ?? 0, quantity: qty };
        });
    }, [selectedAddons, availableAddons]);

    const getPricing = useCallback((couponDisc = 0) => {
        return calculateDetailedPricing(
            selectedService,
            buildAddonList(),
            couponDisc
        );
    }, [selectedService, buildAddonList]);

    const calculateServiceBasePrice = useCallback(() => selectedService?.basePrice ?? 0, [selectedService]);
    const calculateBaseDiscount     = useCallback(() => selectedService?.discountValue ?? 0, [selectedService]);
    const calculateAddonsTotal      = useCallback(() => getPricing().addonsTotal, [getPricing]);
    const calculateTotal            = useCallback(() => getPricing(appliedCoupon?.discount_amount ?? 0).total, [getPricing, appliedCoupon]);

    const calculateSubtotalForCoupon = useCallback(() => getPricing(0).total, [getPricing]);

    // UseMemo wrapper for coupon-discount scalar
    const calculateCouponDiscount = useCallback(() => appliedCoupon?.discount_amount ?? 0, [appliedCoupon]);

    // ── Initial fetch: services + payment settings ──
    useEffect(() => {
        let cancelled = false;

        apiFetch<Service[]>('/api/services')
            .then(data => {
                if (cancelled) return;
                const active = data.filter(s => s.isActive);
                setServices(active);
                const first = active[0];
                if (first) {
                    setFormData(prev => ({ ...prev, category: first.name }));
                    setSelectedService(first);
                }
            })
            .catch(err => console.error('Failed to fetch services', err));

        apiFetch<PaymentSettings[]>('/api/payment-settings')
            .then(data => {
                if (cancelled) return;
                if (data?.length > 0) setPaymentSettings(data[0] ?? null);
            })
            .catch(err => console.error('Failed to fetch payment settings', err));

        return () => { cancelled = true; };
    }, []);

    // ── Coupon suggestions polling ──────────────────
    const fetchSuggestions = useCallback(async (subtotal: number) => {
        if (subtotal <= 0 || appliedCouponRef.current) {
            setSuggestedCoupons([]);
            return;
        }
        try {
            interface SuggestionRes { coupons?: { code: string }[]; }
            const data = await apiPost<SuggestionRes>('/api/coupons/suggestions', { totalAmount: subtotal });
            setSuggestedCoupons(data.coupons as Coupon[] ?? []);
        } catch (err) {
            console.error('Failed to fetch coupon suggestions', err);
            setSuggestedCoupons([]);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const sub = calculateSubtotalForCoupon();
            if (sub > 0 && !appliedCouponRef.current) {
                fetchSuggestions(sub);
            } else {
                setSuggestedCoupons([]);
            }
        }, 30000);

        // Immediate run once
        const sub = calculateSubtotalForCoupon();
        if (sub > 0 && !appliedCoupon) fetchSuggestions(sub);

        return () => clearInterval(interval);
    }, [calculateSubtotalForCoupon, appliedCoupon, fetchSuggestions]);

    // ── Handlers ─────────────────────────────────────
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceSelect = useCallback((service: Service) => {
        setFormData(prev => ({ ...prev, category: service.name }));
        setSelectedService(service);
        setSelectedAddons(new Map());

        apiFetch<Addon[]>(`/api/addons?active=true&category=${encodeURIComponent(service.name)}`)
            .then(data => setAvailableAddons(data))
            .catch(err => console.error('Failed to fetch add-ons', err));
    }, []);

    const toggleAddon = (addonId: string) => {
        setSelectedAddons(prev => {
            const next = new Map(prev);
            if (next.has(addonId)) next.delete(addonId);
            else next.set(addonId, 1);
            return next;
        });
    };

    const updateAddonQuantity = (addonId: string, quantity: number) => {
        setSelectedAddons(prev => {
            const next = new Map(prev);
            if (quantity < 1) next.delete(addonId);
            else next.set(addonId, quantity);
            return next;
        });
    };

    // ── Coupon actions ────────────────────────────────
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode.trim())  { setCouponError('Masukkan kode kupon'); return; }
        const subtotal = calculateSubtotalForCoupon();
        if (subtotal === 0)     { setCouponError('Pilih layanan terlebih dahulu'); return; }

        setCouponLoading(true);
        setCouponError('');

        try {
            interface CouponRes { valid: boolean; error?: string; discount_amount?: number; coupon?: Coupon; }
            const data = await apiPost<CouponRes>('/api/coupons/validate', { code: couponCode, totalAmount: subtotal });

            if (data.valid && data.discount_amount !== undefined) {
                setAppliedCoupon({ valid: true, discount_amount: data.discount_amount, coupon: data.coupon, error: undefined });
                setCouponError('');
            } else {
                setCouponError(data.error || 'Kupon tidak valid');
                setAppliedCoupon(null);
            }
        } catch (err) {
            console.error('Error validating coupon:', err);
            setCouponError('Terjadi kesalahan saat memvalidasi kupon');
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, calculateSubtotalForCoupon]);

    const handleRemoveCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    }, []);

    // ── File upload ──────────────────────────────────
    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { toast('File too large (max 5MB)'); return; }

        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) { toast('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.'); return; }

        setProofFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setProofPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const copyToClipboard = useCallback(async (text: string) => {
        try { await navigator.clipboard.writeText(text); toast('Disalin ke clipboard!'); }
        catch (err) { console.error('Failed to copy:', err); }
    }, []);

    // ── Submit ───────────────────────────────────────
    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedService) { toast('Silakan pilih layanan terlebih dahulu.'); return; }

        setLoading(true);
        try {
            const addonsData = Array.from(selectedAddons.entries()).map(([addonId, qty]) => {
                const addon = availableAddons.find(a => a.id === addonId);
                return {
                    addon_id: addonId, addon_name: addon?.name || '',
                    quantity: qty, price_at_booking: addon?.price || 0,
                };
            });

            const totalPrice = calculateTotal();

            const payload: BookingPayload = {
                customer: {
                    name: formData.name, whatsapp: formData.whatsapp, email: formData.email,
                    category: formData.category, serviceId: selectedService.id,
                },
                booking: {
                    date: `${formData.date}T${formData.time}`,
                    notes: formData.notes || '',
                    location_link: formData.category.toLowerCase().includes('outdoor') ? formData.location_link : '',
                },
                finance: {
                    total_price: totalPrice,
                    payments: [{ date: new Date().toISOString().split('T')[0] ?? '', amount: Number(formData.dp_amount) || 0, note: 'DP Awal' }],
                    service_base_price: calculateServiceBasePrice(),
                    base_discount: calculateBaseDiscount(),
                    addons_total: calculateAddonsTotal(),
                    coupon_discount: calculateCouponDiscount(),
                    coupon_code: appliedCoupon?.coupon?.code,
                },
                addons: addonsData.length > 0 ? addonsData : undefined,
            };

            const fd = new FormData();
            fd.append('data', JSON.stringify(payload));
            if (proofFile) fd.append('proof', proofFile);

            const created = await apiPost<{ id: string }>('/api/bookings', fd as any, { headers: undefined });

            // WhatsApp confirmation
            const cfg = settings;
            if (cfg?.whatsapp_admin_number && cfg?.whatsapp_message_template) {
                const msg  = generateWhatsAppMessage(cfg.whatsapp_message_template, {
                    customer_name: formData.name, service: formData.category,
                    date: formData.date, time: formData.time, total_price: totalPrice, booking_id: created.id,
                });
                const link = generateWhatsAppLink(cfg.whatsapp_admin_number, msg);
                await navigator.clipboard.writeText(link);
                toast(`Booking berhasil! ID: ${created.id}\n\nLink WhatsApp disalin ke clipboard!`);
                window.open(link, '_blank');
            } else {
                toast(`Booking berhasil! ID: ${created.id}\nAdmin akan menghubungi Anda.`);
            }

            window.location.reload();
        } catch (err) {
            console.error(err);
            toast(err instanceof Error ? err.message : 'Terjadi kesalahan saat booking.');
        } finally {
            setLoading(false);
        }
    }, [selectedService, selectedAddons, availableAddons, formData, proofFile, appliedCoupon, settings, calculateTotal, calculateServiceBasePrice, calculateBaseDiscount, calculateAddonsTotal, calculateCouponDiscount]);

    // ── Legacy return API (identical) ─────────────────
    return {
        loading, services, selectedService,
        proofFile, proofPreview,
        availableAddons, selectedAddons,
        paymentSettings,
        couponCode, appliedCoupon, couponError, couponLoading, suggestedCoupons,
        formData,
        setCouponCode,
        handleChange, handleServiceSelect, toggleAddon, updateAddonQuantity,
        handleApplyCoupon, handleRemoveCoupon,
        handleFileChange, copyToClipboard, handleSubmit,
        calculateServiceBasePrice, calculateAddonsTotal,
        calculateBaseDiscount, calculateCouponDiscount,
        calculateSubtotalForCoupon, calculateTotal,
    };
}
