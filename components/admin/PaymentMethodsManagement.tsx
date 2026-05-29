'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from '@/lib/fetch';
import { PaymentMethodList, PaymentMethod } from './payment/PaymentMethodList';
import { PaymentMethodFormModal, PaymentMethodFormData } from './payment/PaymentMethodFormModal';

export default function PaymentMethodsManagement() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    provider_name: '',
    account_name: '',
    account_number: '',
    qris_image_url: '',
    is_active: 1,
    display_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>('');

  const fetchMethods = async () => {
    try {
      const data = await apiGet<PaymentMethod[]>('/api/payment-methods');
      setMethods(data);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpenModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        provider_name: method.provider_name,
        account_name: method.account_name,
        account_number: method.account_number,
        qris_image_url: method.qris_image_url || '',
        is_active: method.is_active,
        display_order: method.display_order
      });
      setQrPreview(method.qris_image_url || '');
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        provider_name: '',
        account_name: '',
        account_number: '',
        qris_image_url: '',
        is_active: 1,
        display_order: methods.length
      });
      setQrPreview('');
    }
    setError('');
    setQrFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setError('');
    setQrFile(null);
    setQrPreview('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'is_active' || name === 'display_order' ? Number(value) : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large (max 5MB)');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Use JPG, PNG, GIF, or WEBP');
        return;
      }
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const uploadQrImage = async (): Promise<string | undefined> => {
    if (!qrFile) return undefined;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', qrFile);
      uploadFormData.append('folder', 'qris');

      const data = await apiFetch<{ url: string }>('/api/uploads', {
        method: 'POST',
        body: uploadFormData
      });

      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let qrImageUrl: string | undefined = formData.qris_image_url || undefined;

      // Upload QR image if new file selected
      if (qrFile) {
        qrImageUrl = await uploadQrImage();
      }

      const payload: PaymentMethodFormData & { id?: string } = {
        ...formData,
        qris_image_url: qrImageUrl
      };

      if (editingMethod) {
        payload.id = editingMethod.id;
        await apiPut('/api/payment-methods', payload);
      } else {
        await apiPost('/api/payment-methods', payload);
      }

      await fetchMethods();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to ${method.is_active ? 'deactivate' : 'activate'} this payment method?`)) return;

    try {
      await apiPut('/api/payment-methods', {
        id: method.id,
        is_active: method.is_active ? 0 : 1
      });
      await fetchMethods();
    } catch (err) {
      console.error('Failed to toggle payment method:', err);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This action cannot be undone.`)) return;

    try {
      await apiDelete(`/api/payment-methods?id=${method.id}`);
      await fetchMethods();
    } catch (err) {
      console.error('Failed to delete payment method:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  const moveOrder = async (method: PaymentMethod, direction: 'up' | 'down') => {
    const targetMethod = methods.find(m =>
      direction === 'up'
        ? m.display_order === method.display_order - 1
        : m.display_order === method.display_order + 1
    );

    if (!targetMethod) return;

    try {
      await apiPut('/api/payment-methods', {
        id: method.id,
        display_order: targetMethod.display_order
      });

      await apiPut('/api/payment-methods', {
        id: targetMethod.id,
        display_order: method.display_order
      });

      await fetchMethods();
    } catch (err) {
      console.error('Failed to reorder payment method:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={28} className="text-blue-600" />
              Payment Methods
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage multiple payment options for customers
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Method
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Payment Methods List Presenter */}
      <PaymentMethodList
        methods={methods}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onMoveOrder={moveOrder}
      />

      {/* Add/Edit Modal Presenter */}
      <PaymentMethodFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingMethod={editingMethod}
        formData={formData}
        onChange={handleInputChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        loading={loading}
        uploading={uploading}
        error={error}
        qrFile={qrFile}
        qrPreview={qrPreview}
      />
    </div>
  );
}
