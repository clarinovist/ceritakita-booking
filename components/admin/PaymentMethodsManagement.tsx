'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, Image as ImageIcon, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PaymentMethod {
  id: string;
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url?: string;
  is_active: number;
  display_order: number;
  created_at: string;
}

interface PaymentMethodFormData {
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url?: string;
  is_active: number;
  display_order: number;
}

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
      const res = await fetch('/api/payment-methods');
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
      }
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

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: uploadFormData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await res.json();
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

      const payload = {
        ...formData,
        qris_image_url: qrImageUrl
      };

      const url = '/api/payment-methods';
      const method = editingMethod ? 'PUT' : 'POST';
      
      if (editingMethod) {
        (payload as any).id = editingMethod.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save payment method');
      }

      await fetchMethods();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to ${method.is_active ? 'deactivate' : 'activate'} this payment method?`)) return;

    try {
      const res = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.id,
          is_active: method.is_active ? 0 : 1
        })
      });

      if (res.ok) {
        await fetchMethods();
      }
    } catch (err) {
      console.error('Failed to toggle payment method:', err);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/payment-methods?id=${method.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchMethods();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete payment method');
      }
    } catch (err) {
      console.error('Failed to delete payment method:', err);
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
      const res1 = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.id,
          display_order: targetMethod.display_order
        })
      });

      const res2 = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetMethod.id,
          display_order: method.display_order
        })
      });

      if (res1.ok && res2.ok) {
        await fetchMethods();
      }
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

      {/* Payment Methods List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Order</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Provider</th>
                <th className="px-6 py-3 font-semibold">Account</th>
                <th className="px-6 py-3 font-semibold">QRIS</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {methods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No payment methods found. Click "Add Method" to create one.
                  </td>
                </tr>
              ) : (
                methods.map((method, index) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-gray-700">
                          {method.display_order}
                        </span>
                        <div className="flex flex-col gap-0.5 ml-1">
                          {index > 0 && (
                            <button
                              onClick={() => moveOrder(method, 'up')}
                              className="text-gray-400 hover:text-blue-600 p-0.5"
                              title="Move up"
                            >
                              <ArrowUp size={12} />
                            </button>
                          )}
                          {index < methods.length - 1 && (
                            <button
                              onClick={() => moveOrder(method, 'down')}
                              className="text-gray-400 hover:text-blue-600 p-0.5"
                              title="Move down"
                            >
                              <ArrowDown size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {method.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {method.provider_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{method.account_name}</div>
                      <div className="text-gray-600 font-mono text-xs">{method.account_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      {method.qris_image_url ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={method.qris_image_url}
                            alt={`QRIS ${method.name}`}
                            fill
                            className="object-cover rounded border border-gray-200"
                            sizes="48px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<span class="text-red-500 text-xs">Error</span>';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No QRIS</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors ${
                          method.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {method.is_active ? (
                          <>
                            <ToggleLeft size={14} />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleRight size={14} />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(method)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit method"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(method)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete method"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., BCA Transfer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    name="provider_name"
                    value={formData.provider_name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., BCA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    QRIS Image
                  </label>
                  <label className="flex items-center justify-center w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <ImageIcon size={14} />
                      {qrFile || qrPreview ? 'Change' : 'Upload'}
                    </span>
                  </label>
                </div>
              </div>

              {/* QRIS Preview */}
              {(qrPreview || formData.qris_image_url) && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-600 mb-2">QRIS Preview:</p>
                  <div className="relative w-24 h-24">
                    <Image
                      src={qrPreview || formData.qris_image_url!}
                      alt="QRIS Preview"
                      fill
                      className="object-contain rounded border border-gray-300 bg-white"
                      sizes="96px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-red-500 text-xs p-2 text-center">Image failed to load</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Uploading QRIS image...
                </div>
              )}

              {/* Error Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingMethod ? 'Update Method' : 'Create Method')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
