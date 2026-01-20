'use client';

import { useMultiStepForm } from '../MultiStepForm';
import { ValidationMessage } from '@/components/ui/ValidationMessage';
import { CheckCircle2, Tag, Crown, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
  benefits?: string[];
}

interface ServiceSelectionProps {
  services?: Service[];
  selectedService?: Service | null;
  handleServiceSelect?: (service: Service) => void;
}

// Price tier thresholds
const PRICE_TIERS = {
  BASIC: 200000,    // < 200k
  STANDARD: 500000, // < 500k
  // >= 500k is PREMIUM
} as const;

type PriceTier = 'basic' | 'standard' | 'premium';

function getPriceTier(price: number): PriceTier {
  if (price < PRICE_TIERS.BASIC) return 'basic';
  if (price < PRICE_TIERS.STANDARD) return 'standard';
  return 'premium';
}

function getTierStyles(tier: PriceTier, isSelected: boolean): string {
  const baseStyles = 'relative p-5 rounded-xl transition-all cursor-pointer h-full flex flex-col justify-between touch-target min-h-[44px]';

  if (isSelected) {
    switch (tier) {
      case 'basic':
        return `${baseStyles} border-2 border-gold-500 bg-white shadow-md`;
      case 'standard':
        return `${baseStyles} border-2 border-gold-500 bg-gradient-to-br from-cream-50 to-white shadow-lg`;
      case 'premium':
        return `${baseStyles} service-card-premium shadow-xl`;
    }
  }

  switch (tier) {
    case 'basic':
      return `${baseStyles} service-card-basic`;
    case 'standard':
      return `${baseStyles} service-card-standard`;
    case 'premium':
      return `${baseStyles} service-card-premium`;
  }
}

export function ServiceSelection({
  services: propServices,
  selectedService: propSelectedService,
  handleServiceSelect: propHandleServiceSelect
}: ServiceSelectionProps = {}) {
  // Use context if no props provided (for MultiStepBookingForm)
  const context = useMultiStepForm();
  const isContextMode = !propServices;

  const formData = isContextMode ? context.formData : { serviceId: propSelectedService?.id || '', portfolioImages: [] };
  const updateFormData = isContextMode ? context.updateFormData : () => { };
  const errors = isContextMode ? context.errors : {};
  const setFieldError = isContextMode ? context.setFieldError : () => { };
  const clearFieldError = isContextMode ? context.clearFieldError : () => { };

  const [services, setServices] = useState<Service[]>(propServices || []);
  const [loading, setLoading] = useState(!propServices);

  // Only fetch services if in context mode and no services provided
  useEffect(() => {
    if (propServices) {
      setServices(propServices);
      setLoading(false);
      return;
    }

    fetch('/api/services')
      .then(res => res.json())
      .then((data: Service[]) => {
        const active = data.filter(s => s.isActive);
        setServices(active);

        // Auto-select first service if none selected
        if (!formData.serviceId && active.length > 0) {
          const firstService = active[0];
          if (firstService) {
            updateFormData({
              serviceId: firstService.id,
              serviceName: firstService.name,
              serviceBasePrice: firstService.basePrice,
              baseDiscount: firstService.discountValue,
            });
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch services", err);
        setFieldError('serviceId', 'Gagal memuat layanan');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propServices]);

  const handleServiceSelect = (service: Service) => {
    if (propHandleServiceSelect) {
      propHandleServiceSelect(service);
    } else {
      updateFormData({
        serviceId: service.id,
        serviceName: service.name,
        serviceBasePrice: service.basePrice,
        baseDiscount: service.discountValue,
        addons: [],
        addonsTotal: 0,
        couponDiscount: 0,
        couponCode: '',
      });
      clearFieldError('serviceId');
    }
  };

  const serviceError = isContextMode ? errors[1]?.find((e: { field: string, message: string }) => e.field === 'serviceId') : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-bold text-olive-800">
          <Tag className="text-olive-600" size={24} />
          <h2>Pilih Layanan</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-olive-200">
      {/* Header */}
      <div className="flex items-center gap-2 text-lg font-bold text-olive-800">
        <Tag className="text-olive-600" size={24} />
        <h2 className="font-display text-xl">Pilih Layanan</h2>
      </div>

      {/* Service Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
        role="radiogroup"
        aria-label="Pilihan layanan"
      >
        {services.map(service => {
          const isSelected = (isContextMode ? formData.serviceId : propSelectedService?.id) === service.id;
          const discountPrice = service.basePrice - service.discountValue;
          const tier = getPriceTier(discountPrice);

          return (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              className={getTierStyles(tier, isSelected)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${service.name}, harga Rp ${discountPrice.toLocaleString()}`}
            >
              {/* Tier Icon */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                {tier === 'premium' && (
                  <Crown
                    size={20}
                    className="text-amber-500 premium-icon"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                )}
                {tier === 'standard' && (
                  <Star
                    size={18}
                    className="text-gold-500"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                )}
                {isSelected && (
                  <CheckCircle2
                    size={20}
                    className={tier === 'premium' ? 'text-amber-600' : 'text-gold-500'}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-serif text-xl font-bold mb-1 ${tier === 'premium'
                    ? 'text-amber-900'
                    : tier === 'standard'
                      ? 'text-olive-900'
                      : isSelected ? 'text-olive-900' : 'text-olive-800'
                    }`}>
                    {service.name}
                  </h3>
                  {tier === 'premium' && (
                    <Sparkles size={16} className="text-amber-500 mb-1" />
                  )}
                </div>

                {service.badgeText && (
                  <span className={`inline-block mt-2 text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${tier === 'premium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gold-100 text-olive-800'
                    }`}>
                    {service.badgeText}
                  </span>
                )}

                {/* Benefits List */}
                {service.benefits && service.benefits.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-dashed border-olive-200 pt-4">
                    {service.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-olive-700">
                        <CheckCircle2
                          size={14}
                          className={`mt-0.5 shrink-0 ${tier === 'premium' ? 'text-amber-500' : 'text-success-600'
                            }`}
                        />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {service.discountValue > 0 ? (
                  <>
                    <span className={`text-xs line-through font-serif ${tier === 'premium' ? 'text-amber-400' : 'text-olive-400'
                      }`}>
                      Rp {service.basePrice.toLocaleString('id-ID')}
                    </span>
                    <span className={`font-bold font-serif text-lg block ${tier === 'premium'
                      ? 'text-amber-700'
                      : tier === 'standard'
                        ? 'text-gold-700'
                        : 'text-gold-600'
                      }`}>
                      Rp {discountPrice.toLocaleString('id-ID')}
                    </span>
                    <div className={`text-xs font-semibold ${tier === 'premium' ? 'text-amber-600' : 'text-olive-600'
                      }`}>
                      Hemat Rp {service.discountValue.toLocaleString('id-ID')}
                    </div>
                  </>
                ) : (
                  <div className={`text-lg font-bold font-serif ${tier === 'premium'
                    ? 'text-amber-700'
                    : tier === 'standard'
                      ? 'text-gold-700'
                      : 'text-olive-800'
                    }`}>
                    Rp {service.basePrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Error */}
      {serviceError && (
        <ValidationMessage
          message={serviceError.message}
          type="error"
          showIcon={true}
        />
      )}

      {/* Help Text */}
      <div className="bg-cream-100 border border-olive-200 rounded-lg p-3 text-sm text-olive-700 mt-4">
        <strong className="text-gold-600">Petunjuk:</strong> Pilih layanan yang sesuai dengan kebutuhan Anda.
        Anda dapat menambahkan layanan tambahan di langkah berikutnya.
      </div>
    </div>
  );
}