import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { Service, Addon, PaymentSettings, CouponValidation, BookingFormData, BookingPayload, Coupon } from '@/lib/types';
import { generateWhatsAppMessage, generateWhatsAppLink } from '@/lib/whatsapp-template';
import { useSettings } from '@/lib/settings-context';

export const useBookingForm = () => {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');
    const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

    // Payment settings state
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [suggestedCoupons, setSuggestedCoupons] = useState<Coupon[]>([]);

    const [formData, setFormData] = useState<BookingFormData>({
        name: '',
        whatsapp: '',
        date: '',
        time: '',
        category: '',
        location_link: '',
        notes: '',
        dp_amount: ''
    });

    // Calculation functions
    const calculateServiceBasePrice = useCallback(() => {
        if (!selectedService) return 0;
        return selectedService.basePrice;
    }, [selectedService]);

    const calculateAddonsTotal = useCallback(() => {
        return Array.from(selectedAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = availableAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);
    }, [selectedAddons, availableAddons]);

    const calculateBaseDiscount = useCallback(() => {
        if (!selectedService) return 0;
        return selectedService.discountValue;
    }, [selectedService]);

    const calculateSubtotalForCoupon = useCallback(() => {
        return calculateServiceBasePrice() + calculateAddonsTotal() - calculateBaseDiscount();
    }, [calculateServiceBasePrice, calculateAddonsTotal, calculateBaseDiscount]);

    // Fetch initial data
    useEffect(() => {
        // Fetch services
        fetch('/api/services')
            .then(res => res.json())
            .then((data: Service[]) => {
                const active = data.filter(s => s.isActive);
                setServices(active);
                const firstService = active[0];
                if (firstService) {
                    setFormData(prev => ({ ...prev, category: firstService.name }));
                    setSelectedService(firstService);
                }
            })
            .catch(err => console.error("Failed to fetch services", err));

        // Fetch payment settings
        fetch('/api/payment-settings')
            .then(res => res.json())
            .then((data) => {
                if (data && data.length > 0) {
                    setPaymentSettings(data[0]);
                }
            })
            .catch(err => console.error("Failed to fetch payment settings", err));
    }, []);

    // Fetch coupon suggestions
    useEffect(() => {
        const fetchSuggestions = () => {
            const subtotal = calculateSubtotalForCoupon();
            if (subtotal > 0 && !appliedCoupon) {
                fetch('/api/coupons/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ totalAmount: subtotal })
                })
                    .then(res => res.json())
                    .then(data => setSuggestedCoupons(data))
                    .catch(err => console.error("Failed to fetch suggestions", err));
            } else if (subtotal === 0 || appliedCoupon) {
                setSuggestedCoupons([]);
            }
        };

        fetchSuggestions();
        const interval = setInterval(fetchSuggestions, 30000);
        return () => clearInterval(interval);
    }, [appliedCoupon, calculateSubtotalForCoupon]);


    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceSelect = (service: Service) => {
        setFormData(prev => ({ ...prev, category: service.name }));
        setSelectedService(service);
        setSelectedAddons(new Map());

        fetch(`/api/addons?active=true&category=${encodeURIComponent(service.name)}`)
            .then(res => res.json())
            .then((data: Addon[]) => setAvailableAddons(data))
            .catch(err => console.error("Failed to fetch add-ons", err));
    };

    const toggleAddon = (addonId: string) => {
        setSelectedAddons(prev => {
            const newMap = new Map(prev);
            if (newMap.has(addonId)) {
                newMap.delete(addonId);
            } else {
                newMap.set(addonId, 1);
            }
            return newMap;
        });
    };

    const updateAddonQuantity = (addonId: string, quantity: number) => {
        if (quantity < 1) {
            setSelectedAddons(prev => {
                const newMap = new Map(prev);
                newMap.delete(addonId);
                return newMap;
            });
        } else {
            setSelectedAddons(prev => new Map(prev).set(addonId, quantity));
        }
    };

    // Calculation functions
    const calculateCouponDiscount = () => {
        return appliedCoupon?.discount_amount || 0;
    };

    const calculateTotal = () => {
        const serviceBase = calculateServiceBasePrice();
        const addonsTotal = calculateAddonsTotal();
        const baseDiscount = calculateBaseDiscount();
        const couponDiscount = calculateCouponDiscount();

        const total = serviceBase + addonsTotal - baseDiscount - couponDiscount;
        return Math.max(0, total);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Masukkan kode kupon');
            return;
        }

        const subtotal = calculateSubtotalForCoupon();
        if (subtotal === 0) {
            setCouponError('Pilih layanan terlebih dahulu');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode,
                    totalAmount: subtotal
                })
            });

            const data = await res.json();

            if (data.valid) {
                setAppliedCoupon(data);
                setCouponError('');
            } else {
                setCouponError(data.error || 'Kupon tidak valid');
                setAppliedCoupon(null);
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponError('Terjadi kesalahan saat memvalidasi kupon');
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File too large (max 5MB)");
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.");
            return;
        }

        setProofFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Copy to clipboard handler
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Nomor rekening disalin ke clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedService) {
            alert("Silakan pilih kategori layanan terlebih dahulu.");
            return;
        }
        setLoading(true);

        try {
            const addonsData = Array.from(selectedAddons.entries()).map(([addonId, quantity]) => {
                const addon = availableAddons.find(a => a.id === addonId);
                return {
                    addon_id: addonId,
                    addon_name: addon?.name || '',
                    quantity,
                    price_at_booking: addon?.price || 0
                };
            });

            const jsonPayload: BookingPayload = {
                customer: {
                    name: formData.name,
                    whatsapp: formData.whatsapp,
                    category: formData.category,
                    serviceId: selectedService?.id
                },
                booking: {
                    date: `${formData.date}T${formData.time}`,
                    notes: formData.notes || '',
                    location_link: formData.category.toLowerCase().includes('outdoor') ? formData.location_link : ''
                },
                finance: {
                    total_price: calculateTotal(),
                    payments: [
                        {
                            date: new Date().toISOString().split('T')[0] ?? '',
                            amount: Number(formData.dp_amount) || 0,
                            note: 'DP Awal'
                        }
                    ],
                    service_base_price: calculateServiceBasePrice(),
                    base_discount: calculateBaseDiscount(),
                    addons_total: calculateAddonsTotal(),
                    coupon_discount: calculateCouponDiscount(),
                    coupon_code: appliedCoupon?.coupon?.code
                },
                addons: addonsData.length > 0 ? addonsData : undefined
            };

            const formPayload = new FormData();
            formPayload.append('data', JSON.stringify(jsonPayload));

            if (proofFile) {
                formPayload.append('proof', proofFile);
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                body: formPayload
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Booking failed');
            }

            const createdBooking = await res.json();

            // Generate WhatsApp message after successful booking
            try {
                if (settings && settings.whatsapp_admin_number && settings.whatsapp_message_template) {
                    const whatsappMessage = generateWhatsAppMessage(
                        settings.whatsapp_message_template,
                        {
                            customer_name: formData.name,
                            service: formData.category,
                            date: formData.date,
                            time: formData.time,
                            total_price: calculateTotal(),
                            booking_id: createdBooking.id
                        }
                    );

                    const whatsappLink = generateWhatsAppLink(
                        settings.whatsapp_admin_number,
                        whatsappMessage
                    );

                    // Show WhatsApp link to user
                    const message = `Booking berhasil! ID: ${createdBooking.id}\n\nKlik link WhatsApp berikut untuk konfirmasi:\n${whatsappLink}`;

                    // Copy to clipboard
                    await navigator.clipboard.writeText(whatsappLink);

                    alert(message + '\n\nLink WhatsApp sudah disalin ke clipboard!');

                    // Open WhatsApp in new tab
                    window.open(whatsappLink, '_blank');
                } else {
                    alert(`Booking berhasil! ID: ${createdBooking.id}\n\nAdmin akan menghubungi Anda.`);
                }
            } catch (whatsappError) {
                console.error('WhatsApp generation error:', whatsappError);
                alert(`Booking berhasil! ID: ${createdBooking.id}\n\nAdmin akan menghubungi Anda.`);
            }

            window.location.reload();

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat booking.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        loading,
        services,
        selectedService,
        proofFile,
        proofPreview,
        availableAddons,
        selectedAddons,
        paymentSettings,
        couponCode,
        appliedCoupon,
        couponError,
        couponLoading,
        suggestedCoupons,
        formData,

        // Setters
        setCouponCode,
        setFormData,

        // Handlers
        handleChange,
        handleServiceSelect,
        toggleAddon,
        updateAddonQuantity,
        handleApplyCoupon,
        handleRemoveCoupon,
        handleFileChange,
        copyToClipboard,
        handleSubmit,

        // Calculations
        calculateServiceBasePrice,
        calculateAddonsTotal,
        calculateBaseDiscount,
        calculateCouponDiscount,
        calculateSubtotalForCoupon,
        calculateTotal
    };
};
