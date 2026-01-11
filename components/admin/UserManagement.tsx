'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Check, X, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { User, UserPermissions } from '@/lib/types';
import { DEFAULT_STAFF_PERMISSIONS, getDefaultPermissions } from '@/lib/permissions-types';

interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'staff';
  permissions: UserPermissions;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'staff',
    permissions: DEFAULT_STAFF_PERMISSIONS
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        permissions: user.permissions || getDefaultPermissions('staff')
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'staff',
        permissions: getDefaultPermissions('staff')
      });
    }
    setError('');
    setPermissionsExpanded(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setError('');
    setPermissionsExpanded(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // If role changes, reset permissions to default for that role
      if (name === 'role') {
        const roleValue = value as 'admin' | 'staff';
        return {
          ...prev,
          [name]: roleValue,
          permissions: getDefaultPermissions(roleValue)
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handlePermissionChange = (category: string, field: string, value: boolean) => {
    setFormData(prev => {
      const categoryPermissions = prev.permissions[category as keyof UserPermissions];
      if (typeof categoryPermissions === 'object' && categoryPermissions !== null) {
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [category]: {
              ...categoryPermissions,
              [field]: value
            }
          }
        };
      }
      return prev;
    });
  };

  const handleSimplePermissionChange = (field: keyof UserPermissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!editingUser && !formData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }

      // Use the permissions from the form data
      const permissions = formData.permissions;

      const payload: {
        username: string;
        role: string;
        permissions: UserPermissions;
        id?: string;
        password?: string;
      } = {
        username: formData.username,
        role: formData.role,
        permissions
      };

      if (editingUser) {
        payload.id = editingUser.id;
        if (formData.password) {
          payload.password = formData.password;
        }
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update user');
        }
      } else {
        payload.password = formData.password;
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create user');
        }
      }

      await fetchUsers();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_active: user.is_active ? 0 : 1 })
      });
      if (!res.ok) {
        throw new Error('Failed to toggle user');
      }
      await fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user:', err);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={24} />
            </div>
            User Management
          </h3>
          <p className="text-sm text-slate-600 mt-2 ml-14">
            Manage staff and admin accounts for the booking system
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Users Table */}
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
                        onClick={() => handleToggleActive(user)}
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
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-display font-bold text-slate-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Basic Information</h4>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    minLength={3}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                    {!editingUser && <Key size={14} className="text-slate-400" />}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    minLength={6}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={editingUser ? 'Enter new password to change' : 'Minimum 6 characters'}
                  />
                  {editingUser && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      Leave empty if you don&apos;t want to change the password
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Permissions Section - Collapsible */}
              <div className="border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => setPermissionsExpanded(!permissionsExpanded)}
                  className="w-full flex items-center justify-between text-sm font-bold text-slate-700 uppercase tracking-wider hover:text-indigo-600 transition-colors"
                >
                  <span>Permissions (Customize Staff Access)</span>
                  {permissionsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {permissionsExpanded && (
                  <div className="mt-4 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* Permissions content (same as before but styled) */}
                    {/* Permissions content */}
                    <div className="space-y-6">
                      {/* Dashboard & Access */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">General Access</h5>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.dashboard}
                              onChange={(e) => handleSimplePermissionChange('dashboard', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Access Dashboard
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.ads}
                              onChange={(e) => handleSimplePermissionChange('ads', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Access Ads Performance
                          </label>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Catalog (Consolidated) */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Catalog Management</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Services */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.services.view}
                                onChange={(e) => handlePermissionChange('services', 'view', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Services
                            </label>
                            <div className="ml-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.services.create}
                                  onChange={(e) => handlePermissionChange('services', 'create', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Create
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.services.update}
                                  onChange={(e) => handlePermissionChange('services', 'update', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Update
                              </label>
                            </div>
                          </div>

                          {/* Add-ons */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.addons.view}
                                onChange={(e) => handlePermissionChange('addons', 'view', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Add-ons
                            </label>
                            <div className="ml-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.addons.create}
                                  onChange={(e) => handlePermissionChange('addons', 'create', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Create
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.addons.update}
                                  onChange={(e) => handlePermissionChange('addons', 'update', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Update
                              </label>
                            </div>
                          </div>

                          {/* Portfolio */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.portfolio.view}
                                onChange={(e) => handlePermissionChange('portfolio', 'view', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Portfolio
                            </label>
                            <div className="ml-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.portfolio.create}
                                  onChange={(e) => handlePermissionChange('portfolio', 'create', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Create
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.portfolio.update}
                                  onChange={(e) => handlePermissionChange('portfolio', 'update', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Update
                              </label>
                            </div>
                          </div>

                          {/* Photographers */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.photographers.view}
                                onChange={(e) => handlePermissionChange('photographers', 'view', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Photographers
                            </label>
                            <div className="ml-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.photographers.create}
                                  onChange={(e) => handlePermissionChange('photographers', 'create', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Create
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.photographers.update}
                                  onChange={(e) => handlePermissionChange('photographers', 'update', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Update
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Booking Management */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Booking Management</h5>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.booking.view}
                              onChange={(e) => handlePermissionChange('booking', 'view', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            View Bookings & Calendar
                          </label>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.booking.create}
                                onChange={(e) => handlePermissionChange('booking', 'create', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Create
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.booking.update}
                                onChange={(e) => handlePermissionChange('booking', 'update', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Update
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.booking.reschedule}
                                onChange={(e) => handlePermissionChange('booking', 'reschedule', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Reschedule
                            </label>
                            <label className="flex items-center gap-2 text-xs text-red-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.booking.delete}
                                onChange={(e) => handlePermissionChange('booking', 'delete', e.target.checked)}
                                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              Delete
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Leads */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Leads Management</h5>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.leads.view}
                              onChange={(e) => handlePermissionChange('leads', 'view', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            View Leads
                          </label>
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.leads.create}
                                onChange={(e) => handlePermissionChange('leads', 'create', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Create
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.leads.update}
                                onChange={(e) => handlePermissionChange('leads', 'update', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Update
                            </label>
                            <label className="flex items-center gap-2 text-xs text-red-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.leads.delete}
                                onChange={(e) => handlePermissionChange('leads', 'delete', e.target.checked)}
                                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              Delete
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Other Modules */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other Modules</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Coupons */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.coupons.view}
                                onChange={(e) => handlePermissionChange('coupons', 'view', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Coupons
                            </label>
                            <div className="ml-6 space-y-1.5">
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.coupons.create}
                                  onChange={(e) => handlePermissionChange('coupons', 'create', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Create
                              </label>
                              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.coupons.update}
                                  onChange={(e) => handlePermissionChange('coupons', 'update', e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Update
                              </label>
                            </div>
                          </div>

                          {/* Homepage CMS */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.homepage_cms}
                                onChange={(e) => handleSimplePermissionChange('homepage_cms', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Homepage CMS
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Admin Only */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Administrative</h5>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.settings}
                              onChange={(e) => handleSimplePermissionChange('settings', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Settings (General)
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.payment}
                              onChange={(e) => handleSimplePermissionChange('payment', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Payment Methods
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.users}
                              onChange={(e) => handleSimplePermissionChange('users', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            User Management
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
                >
                  {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
