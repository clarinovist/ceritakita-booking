'use client';

import { useMultiStepForm } from './MultiStepForm';
import { ValidationMessage } from '@/components/ui/ValidationMessage';
import { CheckCircle2, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
}

export function StepServiceSelection() {
  const { formData, updateFormData, errors, setFieldError, clearFieldError } = useMultiStepForm();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
              // totalPrice will be auto-calculated by useEffect in MultiStepForm
            });
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch services", err);
        setFieldError('serviceId', 'Gagal memuat layanan');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleServiceSelect = (service: Service) => {
    updateFormData({
      serviceId: service.id,
      serviceName: service.name,
      serviceBasePrice: service.basePrice,
      baseDiscount: service.discountValue,
      // Reset addons when changing service
      addons: [],
      addonsTotal: 0,
      // Reset coupon/discount state when switching services
      couponDiscount: 0,
      couponCode: '',
      // totalPrice will be auto-calculated by useEffect in MultiStepForm
    });

    clearFieldError('serviceId');
  };

  const serviceError = errors[1]?.find(e => e.field === 'serviceId');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Tag className="text-primary-600" size={24} />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <Tag className="text-primary-600" size={24} />
        <h2>Pilih Layanan</h2>
      </div>

      {/* Service Cards */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        role="radiogroup"
        aria-label="Pilihan layanan"
      >
        {services.map(service => {
          const isSelected = formData.serviceId === service.id;
          const discountPrice = service.basePrice - service.discountValue;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleServiceSelect(service)}
              className={`
                relative p-5 rounded-xl border-2 transition-all cursor-pointer
                h-full flex flex-col justify-between
                touch-target min-h-[44px]
                ${isSelected
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
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
                    className="text-primary-600" 
                    fill="currentColor"
                    aria-hidden="true"
                  />
                </div>
              )}

              <div>
                <h3 className={`font-bold mb-1 ${isSelected ? 'text-primary-900' : 'text-gray-800'}`}>
                  {service.name}
                </h3>
                
                {service.badgeText && (
                  <span className="inline-block mt-2 bg-primary-100 text-primary-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
                    {service.badgeText}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {service.discountValue > 0 ? (
                  <>
                    <div className="text-sm text-gray-500 line-through">
                      Rp {service.basePrice.toLocaleString('id-ID')}
                    </div>
                    <div className="text-lg font-bold text-primary-700">
                      Rp {discountPrice.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-success-600 font-semibold">
                      Hemat Rp {service.discountValue.toLocaleString('id-ID')}
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-gray-800">
                    Rp {service.basePrice.toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </button>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Petunjuk:</strong> Pilih layanan yang sesuai dengan kebutuhan Anda. 
        Anda dapat menambahkan layanan tambahan di langkah berikutnya.
      </div>
    </div>
  );
}