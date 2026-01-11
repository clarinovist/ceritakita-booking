'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { fieldValidators } from '@/lib/validation/schemas';
import { generateWhatsAppLink, renderTemplate } from '@/lib/whatsapp-template';

// Form data interface
interface FormData {
  // Step 1: Service Selection
  serviceId: string;
  serviceName: string;
  addons: Array<{
    addonId: string;
    addonName: string;
    quantity: number;
    priceAtBooking: number;
  }>;

  // Step 3: Schedule & Location
  date: string;
  time: string;
  location_link: string;

  // Step 4: Customer Information
  name: string;
  whatsapp: string;
  notes: string;

  // Step 5: Payment
  dp_amount: string;
  proofFile: File | null;
  proofPreview: string;

  // Financial data
  totalPrice: number;
  serviceBasePrice: number;
  baseDiscount: number;
  addonsTotal: number;
  couponDiscount: number;
  couponCode: string;

  // Payment settings
  paymentSettings: {
    bank_name: string;
    account_name: string;
    account_number: string;
    qris_image_url?: string;
  } | null;

  // WhatsApp settings
  whatsapp_message_template: string;
  whatsapp_admin_number: string;
}

interface StepError {
  field: string;
  message: string;
}

interface MultiStepFormContextType {
  currentStep: number;
  totalSteps: number;
  formData: FormData;
  errors: Record<number, StepError[]>;
  isSubmitting: boolean;
  isMobile: boolean;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updateFormData: (data: Partial<FormData>) => void;
  setFieldError: (field: string, message: string, step?: number) => void;
  clearFieldError: (field: string, step?: number) => void;
  validateCurrentStep: () => boolean;
  submitForm: () => Promise<void>;
  resetForm: () => void;

  // UI State
  setIsSubmitting: (value: boolean) => void;

  // Lightbox
  selectedPortfolioImage: string | null;
  setSelectedPortfolioImage: (url: string | null) => void;
  closeLightbox: () => void;
}

const MultiStepFormContext = createContext<MultiStepFormContextType | undefined>(undefined);

interface MultiStepFormProviderProps {
  children: ReactNode;
  initialData?: Partial<FormData>;
}

export function MultiStepFormProvider({
  children,
  initialData
}: MultiStepFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormData>({
    // Step 1
    serviceId: initialData?.serviceId || '',
    serviceName: initialData?.serviceName || '',
    addons: initialData?.addons || [],

    // Step 3
    date: initialData?.date || '',
    time: initialData?.time || '',
    location_link: initialData?.location_link || '',

    // Step 4
    name: initialData?.name || '',
    whatsapp: initialData?.whatsapp || '',
    notes: initialData?.notes || '',

    // Step 5
    dp_amount: initialData?.dp_amount || '',
    proofFile: initialData?.proofFile || null,
    proofPreview: initialData?.proofPreview || '',

    // Financial
    totalPrice: initialData?.totalPrice || 0,
    serviceBasePrice: initialData?.serviceBasePrice || 0,
    baseDiscount: initialData?.baseDiscount || 0,
    addonsTotal: initialData?.addonsTotal || 0,
    couponDiscount: initialData?.couponDiscount || 0,
    couponCode: initialData?.couponCode || '',

    // Payment settings
    paymentSettings: initialData?.paymentSettings || null,

    // WhatsApp settings
    whatsapp_message_template: initialData?.whatsapp_message_template || '',
    whatsapp_admin_number: initialData?.whatsapp_admin_number || '',
  });

  const [errors, setErrors] = useState<Record<number, StepError[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPortfolioImage, setSelectedPortfolioImage] = useState<string | null>(null);

  const closeLightbox = useCallback(() => {
    setSelectedPortfolioImage(null);
  }, []);

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const setFieldError = useCallback((field: string, message: string, step?: number) => {
    const targetStep = step || currentStep;
    setErrors(prev => ({
      ...prev,
      [targetStep]: [
        ...(prev[targetStep] || []).filter(e => e.field !== field),
        { field, message }
      ]
    }));
  }, [currentStep]);

  const clearFieldError = useCallback((field: string, step?: number) => {
    const targetStep = step || currentStep;
    setErrors(prev => ({
      ...prev,
      [targetStep]: (prev[targetStep] || []).filter(e => e.field !== field)
    }));
  }, [currentStep]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch settings on mount (payment settings + WhatsApp settings)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch payment settings
        const paymentRes = await fetch('/api/payment-settings');
        if (paymentRes.ok) {
          const paymentSettings = await paymentRes.json();
          updateFormData({ paymentSettings });
        }

        // Fetch system settings for WhatsApp template and admin number
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          updateFormData({
            whatsapp_message_template: settings.whatsapp_message_template || '',
            whatsapp_admin_number: settings.whatsapp_admin_number || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, [updateFormData]);

  // Persist form data to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bookingFormProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude all calculated/financial fields from restored data
        // These will be recalculated fresh based on service selection
        const {
          totalPrice: _totalPrice,
          couponDiscount: _couponDiscount,
          couponCode: _couponCode,
          addonsTotal: _addonsTotal,
          ...safeRestoreData
        } = parsed;
        setFormData(prev => ({ ...prev, ...safeRestoreData }));
      } catch {
        console.error('Failed to load saved form data');
      }
    }
  }, []);

  useEffect(() => {
    // Save only non-sensitive data
    const { proofFile: _proofFile, proofPreview: _proofPreview, ...safeData } = formData;
    localStorage.setItem('bookingFormProgress', JSON.stringify(safeData));
  }, [formData]);

  // Auto-recalculate total price when components change
  useEffect(() => {
    const calculatedTotal = formData.serviceBasePrice - formData.baseDiscount + formData.addonsTotal - formData.couponDiscount;

    // Only update if the calculated total is different from current totalPrice
    if (calculatedTotal !== formData.totalPrice && !isNaN(calculatedTotal)) {
      setFormData(prev => ({ ...prev, totalPrice: Math.max(0, calculatedTotal) }));
    }
  }, [formData.serviceBasePrice, formData.baseDiscount, formData.addonsTotal, formData.couponDiscount, formData.totalPrice]);



  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors: StepError[] = [];

    // Step 1: Service Selection
    if (currentStep === 1) {
      if (!formData.serviceId) {
        newErrors.push({ field: 'serviceId', message: 'Silakan pilih layanan' });
        isValid = false;
      }
    }

    // Step 3: Schedule & Location
    if (currentStep === 3) {
      const dateError = fieldValidators.date(formData.date);
      const timeError = fieldValidators.time(formData.time);
      const locationError = formData.serviceName.toLowerCase().includes('outdoor')
        ? fieldValidators.location_link(formData.location_link)
        : null;

      if (dateError) {
        newErrors.push({ field: 'date', message: dateError });
        isValid = false;
      }
      if (timeError) {
        newErrors.push({ field: 'time', message: timeError });
        isValid = false;
      }
      if (locationError) {
        newErrors.push({ field: 'location_link', message: locationError });
        isValid = false;
      }
    }

    // Step 4: Customer Information
    if (currentStep === 4) {
      const nameError = fieldValidators.name(formData.name);
      const whatsappError = fieldValidators.whatsapp(formData.whatsapp);

      if (nameError) {
        newErrors.push({ field: 'name', message: nameError });
        isValid = false;
      }
      if (whatsappError) {
        newErrors.push({ field: 'whatsapp', message: whatsappError });
        isValid = false;
      }

      const notesError = fieldValidators.notes(formData.notes);
      if (notesError) {
        newErrors.push({ field: 'notes', message: notesError });
        isValid = false;
      }
    }

    // Step 5: Payment
    if (currentStep === 5) {
      const dpError = fieldValidators.dp_amount(formData.dp_amount, formData.totalPrice);
      const proofError = !formData.proofFile ? 'Bukti transfer wajib diupload' : null;

      if (dpError) {
        newErrors.push({ field: 'dp_amount', message: dpError });
        isValid = false;
      }
      if (proofError) {
        newErrors.push({ field: 'proofFile', message: proofError });
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, [currentStep]: newErrors }));
    return isValid;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const resetForm = () => {
    // Preserve payment settings and WhatsApp settings during reset
    const preservedSettings = {
      paymentSettings: formData.paymentSettings,
      whatsapp_message_template: formData.whatsapp_message_template,
      whatsapp_admin_number: formData.whatsapp_admin_number,
    };

    setFormData({
      serviceId: '',
      serviceName: '',
      addons: [],
      date: '',
      time: '',
      location_link: '',
      name: '',
      whatsapp: '',
      notes: '',
      dp_amount: '',
      proofFile: null,
      proofPreview: '',
      totalPrice: 0,
      serviceBasePrice: 0,
      baseDiscount: 0,
      addonsTotal: 0,
      couponDiscount: 0,
      couponCode: '',
      ...preservedSettings,
    });
    setErrors({});
    setCurrentStep(1);
    localStorage.removeItem('bookingFormProgress');
  };

  const submitForm = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare add-ons data
      const addonsData = formData.addons.map(addon => ({
        addon_id: addon.addonId,
        addon_name: addon.addonName,
        quantity: addon.quantity,
        price_at_booking: addon.priceAtBooking,
      }));

      // Construct JSON payload
      const jsonPayload = {
        customer: {
          name: formData.name,
          whatsapp: formData.whatsapp,
          category: formData.serviceName,
          serviceId: formData.serviceId,
        },
        booking: {
          date: `${formData.date}T${formData.time}`,
          notes: formData.notes || '',
          location_link: formData.serviceName.toLowerCase().includes('outdoor')
            ? formData.location_link
            : '',
        },
        finance: {
          total_price: formData.totalPrice,
          payments: [
            {
              date: new Date().toISOString().split('T')[0] ?? '',
              amount: Number(formData.dp_amount) || 0,
              note: 'DP Awal',
            },
          ],
          service_base_price: formData.serviceBasePrice,
          base_discount: formData.baseDiscount,
          addons_total: formData.addonsTotal,
          coupon_discount: formData.couponDiscount,
          coupon_code: formData.couponCode,
        },
        addons: addonsData.length > 0 ? addonsData : undefined,
      };

      // Use FormData for multipart upload
      const formPayload = new FormData();
      formPayload.append('data', JSON.stringify(jsonPayload));

      if (formData.proofFile) {
        formPayload.append('proof', formData.proofFile);
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        body: formPayload,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Booking failed');
      }

      const result = await res.json();
      const bookingId = result.id || 'NEW';

      // Success - clear saved data
      localStorage.removeItem('bookingFormProgress');

      // Generate WhatsApp message using template from settings
      let message = '';

      if (formData.whatsapp_message_template) {
        // Use the template from settings
        const variables = {
          customer_name: formData.name,
          service: formData.serviceName,
          date: new Date(formData.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
          time: formData.time,
          total_price: formData.totalPrice.toLocaleString('id-ID'),
          booking_id: bookingId,
        };

        try {
          message = renderTemplate(formData.whatsapp_message_template, variables, { escapeHtml: false });
        } catch (error) {
          console.error('Failed to render WhatsApp template:', error);
          // Fallback to default message
          message = `Halo! Saya baru saja melakukan booking dengan detail:\n\n` +
            `📋 Booking ID: ${bookingId}\n` +
            `👤 Nama: ${formData.name}\n` +
            `📸 Layanan: ${formData.serviceName}\n` +
            `📅 Tanggal: ${variables.date}\n` +
            `⏰ Waktu: ${formData.time}\n` +
            `💰 Total: Rp ${variables.total_price}\n\n` +
            `Mohon konfirmasinya ya! 🙏`;
        }
      } else {
        // Fallback if no template is set
        message = `Halo! Saya baru saja melakukan booking dengan detail:\n\n` +
          `📋 Booking ID: ${bookingId}\n` +
          `👤 Nama: ${formData.name}\n` +
          `📸 Layanan: ${formData.serviceName}\n` +
          `📅 Tanggal: ${new Date(formData.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}\n` +
          `⏰ Waktu: ${formData.time}\n` +
          `💰 Total: Rp ${formData.totalPrice.toLocaleString('id-ID')}\n\n` +
          `Mohon konfirmasinya ya! 🙏`;
      }

      // Get admin WhatsApp number from settings or fallback to default
      const adminWhatsApp = formData.whatsapp_admin_number || '6281234567890';

      // Generate WhatsApp URL
      const whatsappUrl = generateWhatsAppLink(adminWhatsApp, message);

      // Show success message
      alert('Booking berhasil! Anda akan diarahkan ke WhatsApp untuk konfirmasi.');

      // Reset form
      resetForm();

      // Redirect to WhatsApp
      window.location.href = whatsappUrl;

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat booking.';
      alert(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const contextValue: MultiStepFormContextType = {
    currentStep,
    totalSteps,
    formData,
    errors,
    isSubmitting,
    isMobile,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    setFieldError,
    clearFieldError,
    validateCurrentStep,
    submitForm,
    resetForm,
    setIsSubmitting,
    selectedPortfolioImage,
    setSelectedPortfolioImage,
    closeLightbox,
  };

  return (
    <MultiStepFormContext.Provider value={contextValue}>
      {children}
    </MultiStepFormContext.Provider>
  );
}

export function useMultiStepForm() {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error('useMultiStepForm must be used within MultiStepFormProvider');
  }
  return context;
}