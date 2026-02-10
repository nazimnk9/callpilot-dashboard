'use client';

import { LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cookieUtils } from '@/services/auth-service';

interface UserProfilePanelProps {
  onClose: () => void;
}

export function UserProfilePanel({ onClose }: UserProfilePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = () => {
    cookieUtils.set('access', '', -1);
    cookieUtils.set('refresh', '', -1);
    onClose();
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="w-[280px] bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-200"
    >
      {/* User Info */}
      <div className="mb-4">
        <div className="flex flex-col mb-4">
          <p className="text-[15px] font-bold text-gray-900">Md. Nazim Ahmed</p>
          <p className="text-[13px] text-gray-500 truncate">nazimahmedprovat@gmail.c...</p>
        </div>

        {/* Theme Toggles */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-fit">
          <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-400 hover:text-gray-900">
            < Sun size={18} />
          </button>
          <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-gray-400 hover:text-gray-900">
            < Moon size={18} />
          </button>
          <button className="p-2 bg-white shadow-sm rounded-lg transition text-gray-900 border border-gray-100">
            < Monitor size={18} />
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-50 -mx-4 mb-3" />

      {/* Menu Items */}
      <nav className="space-y-1">
        <a
          href="#"
          className="block text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-xl transition"
        >
          Your profile
        </a>
        <a
          href="#"
          className="block text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-xl transition"
        >
          Terms & policies
        </a>
        <a
          href="#"
          className="block text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-xl transition"
        >
          Help
        </a>
        <button
          onClick={handleLogout}
          className="w-full text-left text-[14px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-xl transition flex items-center gap-2"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </nav>
    </div>
  );
}
