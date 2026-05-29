'use client';

import { Edit, Trash2, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';
import Image from 'next/image';

export interface PaymentMethod {
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

interface PaymentMethodListProps {
  methods: PaymentMethod[];
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
  onToggleActive: (method: PaymentMethod) => void;
  onMoveOrder: (method: PaymentMethod, direction: 'up' | 'down') => void;
}

export function PaymentMethodList({
  methods,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveOrder
}: PaymentMethodListProps) {
  return (
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
                  No payment methods found. Click &quot;Add Method&quot; to create one.
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
                            onClick={() => onMoveOrder(method, 'up')}
                            className="text-gray-400 hover:text-blue-600 p-0.5"
                            title="Move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                        )}
                        {index < methods.length - 1 && (
                          <button
                            onClick={() => onMoveOrder(method, 'down')}
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
                      onClick={() => onToggleActive(method)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors ${method.is_active
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
                        onClick={() => onEdit(method)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit method"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(method)}
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
  );
}
