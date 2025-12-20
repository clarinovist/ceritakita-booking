'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { Upload, Calendar, MapPin, User, MessageSquare, Tag, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';

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

    const calculateTotal = () => {
        if (!selectedService) return 0;
        const basePrice = selectedService.basePrice - selectedService.discountValue;
        const addonsTotal = Array.from(selectedAddons.entries()).reduce((total, [addonId, quantity]) => {
            const addon = availableAddons.find(a => a.id === addonId);
            return total + (addon ? addon.price * quantity : 0);
        }, 0);
        return basePrice + addonsTotal;
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
                    ]
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
                                    <label className="text-xs text-gray-500 font-medium">Jam</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full pl-10 pr-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
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

                        {/* Submit */}
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
                        <p className="text-center text-[10px] text-gray-400">Dengan menekan tombol di atas, Anda menyetujui jadwal yang telah dipilih.</p>
                    </div>
                </div>
            </form>
        </div>
    );
}
