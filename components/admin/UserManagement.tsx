'use client';

import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { User, UserPermissions } from '@/lib/types';
import { DEFAULT_STAFF_PERMISSIONS, getDefaultPermissions } from '@/lib/permissions-types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';
import { UserTable } from './user/UserTable';
import { UserModals, UserFormData } from './user/UserModals';

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
      const data = await apiGet<User[]>('/api/users');
      setUsers(data);
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
        await apiPut('/api/users', payload);
      } else {
        payload.password = formData.password;
        await apiPost('/api/users', payload);
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
      await apiPut('/api/users', { id: user.id, is_active: user.is_active ? 0 : 1 });
      await fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user:', err);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) return;

    try {
      await apiDelete(`/api/users?id=${user.id}`);
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

      {/* Users Table Presenter */}
      <UserTable
        users={users}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {/* Add/Edit Modal Presenter */}
      <UserModals
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingUser={editingUser}
        formData={formData}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        onPermissionChange={handlePermissionChange}
        onSimplePermissionChange={handleSimplePermissionChange}
        loading={loading}
        error={error}
        permissionsExpanded={permissionsExpanded}
        setPermissionsExpanded={setPermissionsExpanded}
      />
    </div>
  );
}
