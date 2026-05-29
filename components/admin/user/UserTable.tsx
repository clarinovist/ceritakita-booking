'use client';

import { Shield, Users, Check, X, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { type User } from '@/lib/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleActive: (user: User) => void;
}

export function UserTable({ users, onEdit, onDelete, onToggleActive }: UserTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-left">Username</th>
              <th className="px-6 py-4 font-semibold text-left">Role</th>
              <th className="px-6 py-4 font-semibold text-left">Status</th>
              <th className="px-6 py-4 font-semibold text-left">Created</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Users size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No users found</p>
                  <p className="text-xs mt-1">Click &quot;Add User&quot; to create one</p>
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-6 py-5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' && (
                        <Shield size={16} className="text-purple-600" />
                      )}
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => onToggleActive(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${user.is_active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      title="Click to toggle status"
                    >
                      {user.is_active ? <Check size={12} /> : <X size={12} />}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-slate-600 font-medium">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
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
