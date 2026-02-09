'use client';

import { useState } from 'react';
import { Menu, ChevronDown, Settings, Phone, MessageSquare, ChevronUp } from 'lucide-react';
import { UserProfilePanel } from './user-profile-panel';

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Topbar({ onMenuClick, isSidebarOpen }: TopbarProps) {
  const [showUserPanel, setShowUserPanel] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        {/* Left section - Logo and project selector */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Hamburger for mobile only - NOT on tablets */}
          {/* <button
            onClick={onMenuClick}
            className="md:hidden text-gray-700 hover:text-gray-900 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button> */}

          {/* Logo and project selector - visible on tablet and up */}
          <div className="flex items-center gap-2">
            {/* <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
              P
            </div> */}
            <span className="text-gray-900">Personal</span>
            <div className="flex flex-col -space-y-1">
              <ChevronUp size={10} className="text-gray-400" />
              <ChevronDown size={10} className="text-gray-400" />
            </div>
            {/* <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-900">Default project</span>
            <div className="flex flex-col -space-y-1">
              <ChevronUp size={10} className="text-gray-400" />
              <ChevronDown size={10} className="text-gray-400" />
            </div> */}
            {/* <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-700 font-medium">Personal</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
              <span className="text-gray-400">/</span>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-700 font-medium">Default project</span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div> */}
          </div>
        </div>

        {/* Right section - Navigation and user */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Tablet and Desktop navigation */}
          {/* <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Docs
            </a>
            <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              API reference
            </a>
            <button
              className="text-gray-700 hover:text-gray-900 transition"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </nav> */}

          {/* Mobile navigation - visible on mobile only */}
          {/* <nav className="flex md:hidden items-center gap-3">
            <button
              className="text-gray-700 hover:text-gray-900 transition"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              className="text-gray-700 hover:text-gray-900 transition"
              aria-label="Phone"
            >
              <Phone size={20} />
            </button>
            <button
              className="text-gray-700 hover:text-gray-900 transition"
              aria-label="Message"
            >
              <MessageSquare size={20} />
            </button>
          </nav> */}

          {/* User profile button */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowUserPanel(!showUserPanel)}
              className="w-8 h-8 rounded-full hover:opacity-80 transition flex-shrink-0"
              aria-label="User menu"
            >
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Md"
                alt="User avatar"
                className="w-full h-full rounded-full"
              />
            </button>

            {/* User Profile Panel */}
            {showUserPanel && (
              <div className="absolute right-0 top-full mt-2">
                <UserProfilePanel onClose={() => setShowUserPanel(false)} />
              </div>
            )}
          </div>
          <button
            onClick={onMenuClick}
            className="md:hidden text-gray-700 hover:text-gray-900 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
    </>
  );
}
