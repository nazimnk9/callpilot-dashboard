'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Zap,
  Volume2,
  ImageIcon,
  Video,
  Bot,
  BarChart3,
  Key,
  LayoutGrid,
  FileText,
  Database,
  Layers,
  Compass,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  X,
  BookOpen,
  Users,
  Settings,
  Package,
  Sparkles,
  Code,
  Globe,
  Phone,
  Shuffle,
  User,
  CreditCard,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { UserProfilePanel } from './user-profile-panel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  // Check if current route is a settings page to initialize the view
  const isSettingsPage = pathname === '/dashboard/profile' || pathname === '/dashboard/organization';

  const [showUserPanel, setShowUserPanel] = useState(false);
  const [isSettingsView, setIsSettingsView] = useState(isSettingsPage);

  // Sync state if navigating to a settings page specifically
  useEffect(() => {
    if (isSettingsPage) {
      setIsSettingsView(true);
    }
  }, [isSettingsPage]);

  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', isBold: true },
    { label: 'Integrations', isHeader: true },
    { icon: Globe, label: 'Connect CRMs', href: '/dashboard/connect-crms', isBold: true },
    { icon: Phone, label: 'Phone numbers', href: '/dashboard/phone-numbers', isBold: true },
    { label: 'AI Flows', isHeader: true },
    { icon: Shuffle, label: 'Phone call Flows', href: '/dashboard/phone-call-flows', isBold: true },
    { label: 'Report', isHeader: true },
    { icon: FileText, label: 'Call logs', href: '/dashboard/call-logs', isBold: true },
  ];

  const settingsMenuItems = [
    { label: 'Settings', isHeader: true },
    { icon: User, label: 'Your Profile', href: '/dashboard/profile', isBold: true },
    { label: 'Organization', isHeader: true },
    { icon: FileText, label: 'General', href: '/dashboard/organization', isBold: true },
    { icon: CreditCard, label: 'Billing', href: '#', isBold: true },
  ];

  const currentMenuItems = isSettingsView ? settingsMenuItems : menuItems;

  return (
    <>
      {/* Mobile overlay - only on mobile, not tablets */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-full md:w-52 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 z-50 md:relative md:translate-x-0 md:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Header - Logo area */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-800 relative">
          <div className="flex items-center justify-center">
            <img
              src="/callpilot_logo.png"
              alt="CallPilot Logo"
              className="h-12 w-auto object-contain brightness-100"
            />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm border border-gray-100 dark:border-gray-700 md:hidden absolute right-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs - Hidden as per design */}
        <div className="px-4 py-2 md:hidden">
          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-lg">
          </div>
        </div>

        {/* Navigation content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <nav className="space-y-8">
            {currentMenuItems.map((item, index) => {
              if (item.isHeader) {
                return (
                  <div key={index} className="text-[13px] font-medium text-gray-400 dark:text-gray-500 mt-6 mb-2 px-3">
                    {item.label}
                  </div>
                );
              }
              const isActive = pathname === item.href;
              return (
                <a
                  key={index}
                  href={item.href}
                  className={`text-lg flex items-center gap-3 px-3 py-2 text-[15px] rounded-lg transition-colors group ${isActive
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                >
                  {item.icon && (
                    <item.icon
                      size={18}
                      strokeWidth={isActive ? 3 : 2.5}
                      className={`${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100'}`}
                    />
                  )}
                  <span className={isActive || item.isBold ? 'font-semibold' : 'font-medium'}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-7 py-6 bg-white dark:bg-gray-950 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSettingsView(!isSettingsView)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-lg"
              >
                {isSettingsView ? (
                  <>
                    <LayoutGrid size={16} strokeWidth={2.5} className="text-gray-500 dark:text-gray-500 h-[18px] w-[18px]" />
                    <span>Dashboard</span>
                  </>
                ) : (
                  <>
                    <Settings size={16} strokeWidth={2.5} className="text-gray-500 dark:text-gray-500 h-[18px] w-[18px]" />
                    <span>Settings</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowUserPanel(!showUserPanel)}
              className="relative md:hidden w-8 h-8 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="User menu"
            >
              <User size={18} />
            </button>
          </div>

          {showUserPanel && (
            <div className="absolute bottom-full right-4 mb-2 md:hidden">
              <UserProfilePanel onClose={() => setShowUserPanel(false)} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
