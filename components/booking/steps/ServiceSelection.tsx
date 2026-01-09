'use client';

import { useMultiStepForm } from '../MultiStepForm';
import { ValidationMessage } from '@/components/ui/ValidationMessage';
import { CheckCircle2, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
}

interface ServiceSelectionProps {
  services?: Service[];
  selectedService?: Service | null;
  handleServiceSelect?: (service: Service) => void;
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
  const fetchPortfolioImages = isContextMode ? context.fetchPortfolioImages : () => { };
  const openLightbox = isContextMode ? context.openLightbox : () => { };

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
            // Fetch portfolio images for the auto-selected service
            fetchPortfolioImages(firstService.id);
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch services", err);
        setFieldError('serviceId', 'Gagal memuat layanan');
      })
      .finally(() => setLoading(false));
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
      fetchPortfolioImages(service.id);
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

          return (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              className={`
                relative p-5 rounded-xl border-2 transition-all cursor-pointer
                h-full flex flex-col justify-between
                touch-target min-h-[44px]
                ${isSelected
                  ? 'border-gold-500 bg-cream-50/50 shadow-sm'
                  : 'border-olive-200 bg-white hover:border-gold-300 hover:shadow-md'
                }
              `}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${service.name}, harga Rp ${discountPrice.toLocaleString()}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2
                    size={20}
                    className="text-gold-500"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                </div>
              )}

              <div>
                <h3 className={`font-serif text-xl font-bold mb-1 ${isSelected ? 'text-olive-900' : 'text-olive-800'}`}>
                  {service.name}
                </h3>

                {service.badgeText && (
                  <span className="inline-block mt-2 bg-gold-100 text-olive-800 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
                    {service.badgeText}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {service.discountValue > 0 ? (
                  <>
                    <span className="text-xs text-olive-400 line-through font-serif">
                      Rp {service.basePrice.toLocaleString('id-ID')}
                    </span>
                    <span className="text-gold-600 font-bold font-serif text-lg">
                      Rp {discountPrice.toLocaleString('id-ID')}
                    </span>
                    <div className="text-xs text-olive-600 font-semibold">
                      Hemat Rp {service.discountValue.toLocaleString('id-ID')}
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-olive-800 font-serif">
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