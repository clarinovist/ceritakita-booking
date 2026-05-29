'use client';

import { X, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { type User, type UserPermissions } from '@/lib/types';

export interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'staff';
  permissions: UserPermissions;
}

interface UserModalsProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  formData: UserFormData;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPermissionChange: (category: string, field: string, value: boolean) => void;
  onSimplePermissionChange: (field: keyof UserPermissions, value: boolean) => void;
  loading: boolean;
  error: string;
  permissionsExpanded: boolean;
  setPermissionsExpanded: (val: boolean) => void;
}

export function UserModals({
  isOpen,
  onClose,
  editingUser,
  formData,
  onSubmit,
  onChange,
  onPermissionChange,
  onSimplePermissionChange,
  loading,
  error,
  permissionsExpanded,
  setPermissionsExpanded
}: UserModalsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h3 className="text-xl font-display font-bold text-slate-900">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto">
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
                onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
                <div className="space-y-6">
                  {/* Dashboard & Access */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">General Access</h5>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.dashboard}
                          onChange={(e) => onSimplePermissionChange('dashboard', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Access Dashboard
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.ads}
                          onChange={(e) => onSimplePermissionChange('ads', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Access Ads Performance
                      </label>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  {/* Catalog */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Catalog Management</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Services */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.services.view}
                            onChange={(e) => onPermissionChange('services', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Services
                        </label>
                        <div className="ml-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.services.create}
                              onChange={(e) => onPermissionChange('services', 'create', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Create
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.services.update}
                              onChange={(e) => onPermissionChange('services', 'update', e.target.checked)}
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
                            onChange={(e) => onPermissionChange('addons', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Add-ons
                        </label>
                        <div className="ml-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.addons.create}
                              onChange={(e) => onPermissionChange('addons', 'create', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Create
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.addons.update}
                              onChange={(e) => onPermissionChange('addons', 'update', e.target.checked)}
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
                            onChange={(e) => onPermissionChange('portfolio', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Portfolio
                        </label>
                        <div className="ml-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.portfolio.create}
                              onChange={(e) => onPermissionChange('portfolio', 'create', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Create
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.portfolio.update}
                              onChange={(e) => onPermissionChange('portfolio', 'update', e.target.checked)}
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
                            onChange={(e) => onPermissionChange('photographers', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Photographers
                        </label>
                        <div className="ml-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.photographers.create}
                              onChange={(e) => onPermissionChange('photographers', 'create', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Create
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.photographers.update}
                              onChange={(e) => onPermissionChange('photographers', 'update', e.target.checked)}
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
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-855 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.booking.view}
                          onChange={(e) => onPermissionChange('booking', 'view', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        View Bookings & Calendar
                      </label>
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.booking.create}
                            onChange={(e) => onPermissionChange('booking', 'create', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Create
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.booking.update}
                            onChange={(e) => onPermissionChange('booking', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Update
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.booking.reschedule}
                            onChange={(e) => onPermissionChange('booking', 'reschedule', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Reschedule
                        </label>
                        <label className="flex items-center gap-2 text-xs text-red-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.booking.delete}
                            onChange={(e) => onPermissionChange('booking', 'delete', e.target.checked)}
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
                          onChange={(e) => onPermissionChange('leads', 'view', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        View Leads
                      </label>
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.leads.create}
                            onChange={(e) => onPermissionChange('leads', 'create', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Create
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.leads.update}
                            onChange={(e) => onPermissionChange('leads', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Update
                        </label>
                        <label className="flex items-center gap-2 text-xs text-red-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.leads.delete}
                            onChange={(e) => onPermissionChange('leads', 'delete', e.target.checked)}
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
                            onChange={(e) => onPermissionChange('coupons', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Coupons
                        </label>
                        <div className="ml-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.coupons.create}
                              onChange={(e) => onPermissionChange('coupons', 'create', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Create
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.coupons.update}
                              onChange={(e) => onPermissionChange('coupons', 'update', e.target.checked)}
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
                            onChange={(e) => onSimplePermissionChange('homepage_cms', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Homepage CMS
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  {/* Administrative */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Administrative</h5>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.settings}
                          onChange={(e) => onSimplePermissionChange('settings', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Settings (General)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.payment}
                          onChange={(e) => onSimplePermissionChange('payment', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Payment Methods
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.users}
                          onChange={(e) => onSimplePermissionChange('users', e.target.checked)}
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
              onClick={onClose}
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
  );
}
