'use client';

import { useMultiStepForm } from './MultiStepForm';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Addon {
  id: string;
  name: string;
  price: number;
  applicable_categories?: string[];
  is_active: boolean;
}

export function StepAddons() {
  const { formData, updateFormData, isMobile } = useMultiStepForm();
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formData.serviceId) {
      setLoading(false);
      return;
    }

    fetch(`/api/addons?active=true&category=${encodeURIComponent(formData.serviceName)}`)
      .then(res => res.json())
      .then((data: Addon[]) => {
        const active = data.filter(a => a.is_active);
        setAvailableAddons(active);
      })
      .catch(err => {
        console.error("Failed to fetch add-ons", err);
      })
      .finally(() => setLoading(false));
  }, [formData.serviceId, formData.serviceName]);

  const toggleAddon = (addonId: string) => {
    const addon = availableAddons.find(a => a.id === addonId);
    if (!addon) return;

    const currentAddons = [...formData.addons];
    const existingIndex = currentAddons.findIndex(a => a.addonId === addonId);

    if (existingIndex >= 0) {
      // Remove addon
      currentAddons.splice(existingIndex, 1);
    } else {
      // Add addon
      currentAddons.push({
        addonId: addon.id,
        addonName: addon.name,
        quantity: 1,
        priceAtBooking: addon.price,
      });
    }

    updateAddons(currentAddons);
  };

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    if (quantity < 1) {
      // Remove addon
      const currentAddons = formData.addons.filter(a => a.addonId !== addonId);
      updateAddons(currentAddons);
    } else {
      // Update quantity
      const currentAddons = formData.addons.map(a => 
        a.addonId === addonId ? { ...a, quantity } : a
      );
      updateAddons(currentAddons);
    }
  };

  const updateAddons = (addons: typeof formData.addons) => {
    const addonsTotal = addons.reduce((sum, addon) =>
      sum + (addon.priceAtBooking * addon.quantity), 0
    );

    updateFormData({
      addons,
      addonsTotal,
      // Clear coupon when addons change - user must re-apply at payment step
      couponDiscount: 0,
      couponCode: '',
      // totalPrice will be auto-calculated by useEffect in MultiStepForm
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <ShoppingBag className="text-primary-600" size={24} />
          <h2>Tambahan (Opsional)</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (availableAddons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <ShoppingBag className="text-primary-600" size={24} />
          <h2>Tambahan (Opsional)</h2>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
          Tidak ada tambahan yang tersedia untuk layanan ini.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <ShoppingBag className="text-primary-600" size={24} />
        <h2>Tambahan (Opsional)</h2>
      </div>

      {/* Add-ons List */}
      <div className="space-y-3" role="list" aria-label="Pilihan tambahan layanan">
        {availableAddons.map(addon => {
          const isSelected = formData.addons.some(a => a.addonId === addon.id);
          const currentAddon = formData.addons.find(a => a.addonId === addon.id);
          const quantity = currentAddon?.quantity || 1;

          return (
            <div 
              key={addon.id}
              className={`
                border-2 rounded-xl p-4 transition-all
                ${isSelected 
                  ? 'border-primary-600 bg-primary-50' 
                  : 'border-gray-200 bg-white hover:border-primary-300'
                }
              `}
              role="listitem"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Checkbox & Info */}
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAddon(addon.id)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 touch-target"
                    aria-label={`Pilih ${addon.name}, harga Rp ${addon.price.toLocaleString()}`}
                  />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{addon.name}</div>
                    <div className="text-sm text-success-600 font-bold">
                      +Rp {addon.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </label>

                {/* Quantity Controls */}
                {isSelected && (
                  <div className="flex items-center gap- gap-2 bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => updateAddonQuantity(addon.id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700 transition-colors touch-target"
                      aria-label={`Kurangi ${addon.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    
                    <span 
                      className="w-8 text-center font-bold text-sm"
                      aria-live="polite"
                      aria-label={`Jumlah ${addon.name}: ${quantity}`}
                    >
                      {quantity}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => updateAddonQuantity(addon.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors touch-target"
                      aria-label={`Tambah ${addon.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {formData.addons.length > 0 && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-success-800">Total Tambahan:</span>
            <span className="font-bold text-success-900 text-lg">
              Rp {formData.addonsTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Petunjuk:</strong> Pilih tambahan yang Anda butuhkan. Anda dapat mengubah jumlah dengan tombol +/-
      </div>
    </div>
  );
}