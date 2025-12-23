'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { Upload, Calendar, MapPin, User, MessageSquare, Tag, CheckCircle2, Clock, ShoppingBag, Zap } from 'lucide-react';

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft('Berakhir');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Mark as urgent if less than 24 hours
            setIsUrgent(difference < 24 * 60 * 60 * 1000);

            if (days > 0) {
                setTimeLeft(`${days}h ${hours}j lagi`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}j ${minutes}m lagi`);
            } else {
                setTimeLeft(`${minutes}m ${seconds}d`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
            {isUrgent && <Zap size={10} className="inline mr-0.5" />}
            {timeLeft}
        </span>
    );
}

interface Service {
    id: string;
    name: string;
    basePrice: number;
    discountValue: number;
    isActive: boolean;
    badgeText?: string;
}

interface Addon {
    id: string;
    name: string;
    price: number;
    applicable_categories?: string[];
    is_active: boolean;
}

export default function BookingForm() {
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');
    const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
    const [selectedAddons, setSelectedAddons] = useState<Map<string, number>>(new Map());

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [suggestedCoupons, setSuggestedCoupons] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        date: '',
        time: '',
        category: '',
        location_link: '',
        notes: '',
        dp_amount: ''
    });

    useEffect(() => {
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
    }, []);

    // Fetch coupon suggestions when subtotal changes or periodically
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

        // Fetch immediately
        fetchSuggestions();

        // Refresh suggestions every 30 seconds to catch newly added coupons
        const interval = setInterval(fetchSuggestions, 30000);

        return () => clearInterval(interval);
    }, [selectedService, selectedAddons, appliedCoupon]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceSelect = (service: Service) => {
        setFormData(prev => ({ ...prev, category: service.name }));
        setSelectedService(service);
        setSelectedAddons(new Map()); // Reset add-ons when changing service

        // Fetch applicable add-ons for this service
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

    // Calculation functions following formula: Grand Total = (Service Base + Add-ons) - Base Discount - Coupon Discount

    const calculateServiceBasePrice = () => {
        if (!selectedService) return 0;
        return selectedService.basePrice;
    };

    const calculateAddonsTotal = () => {
        return Array.from(selectedAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = availableAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);
    };

    const calculateBaseDiscount = () => {
        if (!selectedService) return 0;
        return selectedService.discountValue;
    };

    const calculateCouponDiscount = () => {
        return appliedCoupon?.discount_amount || 0;
    };

    // For coupon validation, we need subtotal after base discount
    const calculateSubtotalForCoupon = () => {
        return calculateServiceBasePrice() + calculateAddonsTotal() - calculateBaseDiscount();
    };

    const calculateTotal = () => {
        const serviceBase = calculateServiceBasePrice();
        const addonsTotal = calculateAddonsTotal();
        const baseDiscount = calculateBaseDiscount();
        const couponDiscount = calculateCouponDiscount();

        // Grand Total = (Service Base + Add-ons) - Base Discount - Coupon Discount
        const total = serviceBase + addonsTotal - baseDiscount - couponDiscount;

        // Prevent negative totals
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

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            alert("File too large (max 5MB)");
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.");
            return;
        }

        // Store File object for upload
        setProofFile(file);

        // Generate preview for UI
        const reader = new FileReader();
        reader.onloadend = () => {
            setProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedService) {
            alert("Silakan pilih kategori layanan terlebih dahulu.");
            return;
        }
        setLoading(true);

        try {
            // Prepare add-ons data
            const addonsData = Array.from(selectedAddons.entries()).map(([addonId, quantity]) => {
                const addon = availableAddons.find(a => a.id === addonId);
                return {
                    addon_id: addonId,
                    addon_name: addon?.name || '',
                    quantity,
                    price_at_booking: addon?.price || 0
                };
            });

            // Construct JSON payload
            const jsonPayload = {
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
                            // proof_filename will be set by server after file upload
                        }
                    ],
                    // Include breakdown for backend validation and storage
                    service_base_price: calculateServiceBasePrice(),
                    base_discount: calculateBaseDiscount(),
                    addons_total: calculateAddonsTotal(),
                    coupon_discount: calculateCouponDiscount(),
                    coupon_code: appliedCoupon?.coupon?.code
                },
                addons: addonsData.length > 0 ? addonsData : undefined
            };

            // Use FormData for multipart upload
            const formPayload = new FormData();
            formPayload.append('data', JSON.stringify(jsonPayload));

            // Append file if selected
            if (proofFile) {
                formPayload.append('proof', proofFile);
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                // No Content-Type header - browser sets it with boundary for multipart
                body: formPayload
            });

            if (!res.ok) throw new Error('Booking failed');

            alert('Booking berhasil! Admin akan menghubungi Anda.');
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat booking.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Booking Sesi Foto</h1>
                <p className="text-gray-600">Pilih layanan dan tentukan jadwal sesi foto Anda bersama Cerita Kita.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: SERVICE SELECTION */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6 text-xl font-bold text-gray-800">
                            <Tag className="text-blue-600" size={24} />
                            <h2>Pilih Layanan</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.map(s => {
                                const isSelected = selectedService?.id === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => handleServiceSelect(s)}
                                        className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md h-full flex flex-col justify-between ${isSelected
                                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-blue-200'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 text-blue-600">
                                                <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                                            </div>
                                        )}

                                        <div>
                                            <h3 className={`font-bold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                                                {s.name}
                                            </h3>
                                        </div>

                                        {s.badgeText && (
                                            <div className="mt-3">
                                                <span className="bg-blue-100 text-blue-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
                                                    {s.badgeText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ADD-ONS SELECTION */}
                    {availableAddons.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                                <ShoppingBag className="text-blue-600" size={20} />
                                <h3>Tambahan (Opsional)</h3>
                            </div>
                            <div className="space-y-3">
                                {availableAddons.map(addon => {
                                    const isSelected = selectedAddons.has(addon.id);
                                    const quantity = selectedAddons.get(addon.id) || 1;
                                    return (
                                        <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 transition-colors">
                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleAddon(addon.id)}
                                                    className="w-5 h-5 text-blue-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{addon.name}</div>
                                                    <div className="text-sm text-green-600 font-bold">+Rp {addon.price.toLocaleString()}</div>
                                                </div>
                                            </label>
                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAddonQuantity(addon.id, quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-100 font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center font-bold">{quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAddonQuantity(addon.id, quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-100 font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedService && selectedService.name.toLowerCase().includes('outdoor') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold">
                                <MapPin className="text-blue-600" size={20} />
                                <h3>Lokasi Photoshoot</h3>
                            </div>
                            <input
                                required
                                type="url"
                                name="location_link"
                                value={formData.location_link}
                                onChange={handleChange}
                                placeholder="Masukkan link Google Maps lokasi"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: FORM DETAILS */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-8">

                        {/* Data Sesi */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <Calendar className="text-blue-600" size={20} />
                                <h3>Jadwal & Sesi</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-medium">Tanggal</label>
                                    <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-medium">Jam (interval 30 menit)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
                                        <select
                                            required
                                            name="time"
                                            value={formData.time}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                        >
                                            <option value="">Pilih waktu</option>
                                            {Array.from({ length: 48 }, (_, i) => {
                                                const hour = Math.floor(i / 2);
                                                const minute = i % 2 === 0 ? '00' : '30';
                                                const timeValue = `${hour.toString().padStart(2, '0')}:${minute}`;
                                                return (
                                                    <option key={timeValue} value={timeValue}>
                                                        {timeValue}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-400">Contoh: 09:00, 09:30, 10:00</p>
                                </div>
                            </div>
                        </div>

                        {/* Data Diri */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <User className="text-blue-600" size={20} />
                                <h3>Informasi Kontak</h3>
                            </div>
                            <div className="space-y-4">
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Lengkap" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Nomor WhatsApp" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Catatan tambahan (opsional)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"></textarea>
                            </div>
                        </div>

                        {/* Pembayaran DP */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <MessageSquare className="text-blue-600" size={20} />
                                <h3>Pembayaran DP</h3>
                            </div>
                            <input required type="number" name="dp_amount" value={formData.dp_amount} onChange={handleChange} placeholder="Masukkan Jumlah DP (Rp)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700" />

                            <div className="relative group overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 transition-all hover:bg-white hover:border-blue-300">
                                <input required={!proofPreview} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                {!proofPreview ? (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={32} strokeWidth={1.5} className="group-hover:text-blue-500 transition-colors" />
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
                                        <p className="text-xs text-blue-600 mt-2 font-bold italic">Bukti terpilih (klik untuk ganti)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ORDER SUMMARY */}
                    {selectedService && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border-2 border-blue-100">
                            <h3 className="font-black text-lg text-gray-800 mb-4">Ringkasan Pesanan</h3>

                            {/* Selected Service */}
                            <div className="space-y-3 mb-4">
                                <div className="bg-white p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{selectedService.name}</p>
                                            {selectedService.badgeText && (
                                                <span className="inline-block mt-1 bg-blue-100 text-blue-600 text-[9px] uppercase font-black px-2 py-0.5 rounded">
                                                    {selectedService.badgeText}
                                                </span>
                                            )}
                                            {selectedService.discountValue > 0 && (
                                                <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200">
                                                    <span>💰 Hemat Rp {selectedService.discountValue.toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Add-ons */}
                                {selectedAddons.size > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                                        <p className="font-bold text-gray-700 text-sm mb-2">Tambahan:</p>
                                        <div className="space-y-2">
                                            {Array.from(selectedAddons.entries()).map(([addonId, quantity]) => {
                                                const addon = availableAddons.find(a => a.id === addonId);
                                                if (!addon) return null;
                                                return (
                                                    <div key={addonId} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {addon.name} x{quantity}
                                                        </span>
                                                        <span className="font-semibold text-gray-800">
                                                            Rp {(addon.price * quantity).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Coupon Section */}
                            <div className="mb-4">
                                {!appliedCoupon ? (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-700">Punya Kode Kupon?</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Masukkan kode"
                                                className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading}
                                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-all"
                                            >
                                                {couponLoading ? '...' : 'Terapkan'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-600 font-medium">{couponError}</p>
                                        )}

                                        {/* Suggested Coupons */}
                                        {suggestedCoupons.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-gray-600">💡 Kupon yang Tersedia:</p>
                                                <div className="space-y-1.5">
                                                    {suggestedCoupons.map((coupon) => (
                                                        <button
                                                            key={coupon.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setCouponCode(coupon.code);
                                                                handleApplyCoupon();
                                                            }}
                                                            className="w-full text-left p-2.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-all group"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-black text-xs text-yellow-800 font-mono">{coupon.code}</p>
                                                                        {coupon.valid_until && (
                                                                            <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                                                🔥 FLASH SALE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {coupon.description && (
                                                                        <p className="text-[10px] text-gray-600 mt-0.5">{coupon.description}</p>
                                                                    )}
                                                                    <p className="text-xs text-green-600 font-bold mt-1">
                                                                        {coupon.discount_type === 'percentage'
                                                                            ? `Diskon ${coupon.discount_value}%`
                                                                            : `Potongan Rp ${coupon.discount_value.toLocaleString('id-ID')}`
                                                                        }
                                                                        {coupon.max_discount && coupon.discount_type === 'percentage' && (
                                                                            ` (maks. Rp ${coupon.max_discount.toLocaleString('id-ID')})`
                                                                        )}
                                                                    </p>
                                                                    {coupon.valid_until && (
                                                                        <div className="mt-1">
                                                                            <CountdownTimer targetDate={coupon.valid_until} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-yellow-700 font-bold group-hover:underline">Gunakan</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <p className="text-xs text-green-600 font-medium">Kupon Terapkan:</p>
                                                <p className="font-black text-green-700 font-mono">{appliedCoupon.coupon.code}</p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    {appliedCoupon.coupon.discount_type === 'percentage'
                                                        ? `Diskon ${appliedCoupon.coupon.discount_value}%`
                                                        : `Diskon Rp ${appliedCoupon.coupon.discount_value.toLocaleString('id-ID')}`
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveCoupon}
                                                className="text-red-600 hover:text-red-700 text-xs font-bold"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Price Summary - Detailed Breakdown */}
                            <div className="border-t-2 border-blue-200 pt-4 space-y-2">
                                {/* Service Base Price */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Harga Layanan:</span>
                                    <span className="font-semibold text-gray-800">
                                        Rp {calculateServiceBasePrice().toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Add-ons Total */}
                                {calculateAddonsTotal() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Tambahan:</span>
                                        <span className="font-semibold text-green-600">
                                            + Rp {calculateAddonsTotal().toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {/* Base Discount */}
                                {calculateBaseDiscount() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Diskon Paket:</span>
                                        <span className="font-semibold text-red-600">
                                            - Rp {calculateBaseDiscount().toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {/* Coupon Discount */}
                                {calculateCouponDiscount() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Diskon Kupon:</span>
                                        <span className="font-semibold text-red-600">
                                            - Rp {calculateCouponDiscount().toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}

                                {/* Grand Total */}
                                <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                                    <span className="font-black text-lg text-gray-900">TOTAL:</span>
                                    <span className="font-black text-2xl text-blue-600">
                                        Rp {calculateTotal().toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Down Payment & Remaining Balance */}
                                {formData.dp_amount && Number(formData.dp_amount) > 0 && (
                                    <div className="mt-4 pt-4 border-t-2 border-blue-200 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Down Payment (DP):</span>
                                            <span className="font-semibold text-green-600">
                                                Rp {Number(formData.dp_amount).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800">Sisa Pembayaran:</span>
                                            <span className="font-bold text-lg text-orange-600">
                                                Rp {(calculateTotal() - Number(formData.dp_amount)).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </span>
                            ) : (
                                'Konfirmasi & Kirim Pesanan'
                            )}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-2">Dengan menekan tombol di atas, Anda menyetujui jadwal yang telah dipilih.</p>
                    </div>
                </div>
            </form>
        </div>
    );
}
