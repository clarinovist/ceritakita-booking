'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, List, Tag, Camera, ShoppingBag,
  Users, Image as ImageIcon, CreditCard, LogOut, Menu, X, Target, Settings
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { getFilteredMenuItems } from '@/lib/permissions-types';

interface AdminSidebarProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

export default function AdminSidebar({ viewMode, setViewMode }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get filtered menu items based on user permissions
  const userPermissions = (session?.user as any)?.permissions;
  const userRole = (session?.user as any)?.role;
  const menuItems = getFilteredMenuItems(userPermissions, userRole);

  // Map icon strings to actual icon components
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      LayoutDashboard,
      Target,
      Calendar,
      List,
      Tag,
      ImageIcon,
      ShoppingBag,
      Camera,
      Users,
      CreditCard,
      Settings
    };
    return icons[iconName] || LayoutDashboard;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const Icon = getIconComponent(item.icon);
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setViewMode(item.id);
                if (isMobile) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={async () => {
            await signOut({ callbackUrl: '/login', redirect: true });
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-[100] p-2 bg-gray-900 text-white rounded-lg shadow-lg"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[90]" 
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-64 z-[95] transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent />
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="fixed left-0 top-0 h-screen w-64 z-50">
      <SidebarContent />
    </div>
  );
}