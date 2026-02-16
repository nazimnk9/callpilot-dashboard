'use client';

import { useState } from 'react';
import { Menu, ChevronDown, Settings, Phone, MessageSquare, ChevronUp, User } from 'lucide-react';
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
          {/* Project selector */}
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
            <span className="text-gray-900 font-medium">Personal</span>
            <div className="flex flex-col -space-y-1">
              <ChevronUp size={10} className="text-gray-400" />
              <ChevronDown size={10} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Right section - Navigation and user */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* User profile button */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowUserPanel(!showUserPanel)}
              className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition flex-shrink-0"
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
