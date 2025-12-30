// Centralized type definitions for User module

export interface UserPermissions {
  booking: {
    view: boolean;
    create: boolean;
    update: boolean;
    reschedule: boolean;
    delete: boolean;
  };
  services: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  photographers: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  addons: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  portfolio: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  coupons: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  export: {
    bookings: boolean;
    financial: boolean;
  };
  dashboard: boolean;
  ads: boolean;
  settings: boolean;
  payment: boolean;
  users: boolean;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at: string;
  updated_at: string;
  password_hash?: string;
  permissions?: UserPermissions;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role?: 'admin' | 'staff';
  permissions?: UserPermissions;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  is_active?: number;
  permissions?: UserPermissions;
}

export interface UserApiResponse {
  success: boolean;
  data?: User | User[];
  error?: string;
  code?: string;
}

export interface UserValidationError {
  field: string;
  message: string;
}