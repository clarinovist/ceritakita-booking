'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, List, Tag, Camera, ShoppingBag,
  Users, Image as ImageIcon, CreditCard, LogOut, Menu, X, Target, Settings, Home,
  ChevronRight
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { getFilteredMenuItems } from '@/lib/permissions-types';
import { useSettings } from '@/lib/settings-context';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  permission: string;
  isLink?: boolean;
  href?: string;
}

interface AdminSidebarProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

export default function AdminSidebar({ viewMode, setViewMode }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const { settings, loading } = useSettings();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get filtered menu items based on user permissions
  const user = session?.user as { permissions?: unknown; role?: string } | undefined;
  const userPermissions = user?.permissions;
  const userRole = user?.role || '';

  // Filter out Users and Payment Methods as they are now consolidated into Settings
  // Note: We filter by checking for standard ID names like 'users', 'payment-methods', etc.
  const menuItems = getFilteredMenuItems(userPermissions, userRole)
    .filter(item => !['users', 'payment-methods', 'payment_methods', 'payment-settings'].includes(item.id));

  // Map icon strings to actual icon components
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
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
      Settings,
      Home
    };
    return icons[iconName] || LayoutDashboard;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Logo/Header */}
      <div className="p-8 pb-6 relative z-10">
        <div className="flex items-center gap-3 mb-1">
          {settings?.site_logo ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-blue-900/50 bg-white">
              <Image
                src={settings.site_logo}
                alt="Logo"
                fill
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
              <Camera size={20} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-wide truncate max-w-[160px]">
              {loading ? 'Loading...' : (settings?.site_name || 'CeritaKita')}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">Studio Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {(menuItems as MenuItem[]).map((item) => {
          const Icon = getIconComponent(item.icon);
          const isActive = viewMode === item.id;

          const content = (
            <div className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="opacity-80" />}
            </div>
          );

          if (item.isLink && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className="block"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                setViewMode(item.id);
                if (isMobile) setIsOpen(false);
              }}
              className="w-full block text-left"
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/50 relative z-10 bg-slate-900/50 backdrop-blur-sm">
        <button
          onClick={async () => {
            await signOut({ callbackUrl: '/login', redirect: true });
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          <span>Keluar</span>
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
          className="fixed top-4 left-4 z-[100] p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700/50 active:scale-95 transition-transform"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-72 z-[95] transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <SidebarContent />
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="fixed left-0 top-0 h-screen w-72 z-50 hidden md:block border-r border-slate-800">
      <SidebarContent />
    </div>
  );
}