'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Settings, Phone, MessageSquare, ChevronUp, User, Check } from 'lucide-react';
import { UserProfilePanel } from './user-profile-panel';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Topbar({ onMenuClick, isSidebarOpen }: TopbarProps) {
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('Your Business');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        {/* Left section - Logo and project selector */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Project selector */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedOrg}</span>
              <div className="flex flex-col -space-y-1">
                <ChevronUp size={10} className={cn("transition-colors", isOrgDropdownOpen ? "text-gray-900 dark:text-gray-100" : "text-gray-400")} />
                <ChevronDown size={10} className={cn("transition-colors", !isOrgDropdownOpen ? "text-gray-900 dark:text-gray-100" : "text-gray-400")} />
              </div>
            </div>

            {/* Organizations Dropdown */}
            {isOrgDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl py-3 z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-4 mb-2">
                  <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">Organizations</span>
                </div>

                <div
                  onClick={() => {
                    setSelectedOrg('Your Business');
                    setIsOrgDropdownOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-4 flex justify-center">
                    {selectedOrg === 'Your Business' || selectedOrg === 'Your Business' ? (
                      <Check size={14} className="text-gray-600 dark:text-gray-400" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-bold">
                      P
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Your Business</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section - Navigation and user */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* User profile button */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowUserPanel(!showUserPanel)}
              className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
              aria-label="User menu"
            >
              <User size={18} />
            </button>

            {/* User Profile Panel */}
            {showUserPanel && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <UserProfilePanel onClose={() => setShowUserPanel(false)} />
              </div>
            )}
          </div>
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
    </>
  );
}
