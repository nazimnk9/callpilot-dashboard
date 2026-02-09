'use client';

import { useState, useEffect } from 'react';
import { Topbar } from '@/components/topbar';
import { Sidebar } from '@/components/sidebar';
import { HomeContent } from '@/components/home-content';

export default function Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTabletOrLarger, setIsTabletOrLarger] = useState(true);

  useEffect(() => {
    // Check if viewport is tablet or larger (768px+)
    const checkViewport = () => {
      const isTabletUp = window.innerWidth >= 768;
      setIsTabletOrLarger(isTabletUp);
      // Always open sidebar on tablet and larger
      if (isTabletUp) {
        setIsSidebarOpen(true);
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - always visible on tablet+, toggleable on mobile */}
      <Sidebar
        isOpen={isTabletOrLarger || isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <Topbar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page content */}
        <HomeContent />
      </div>
    </div>
  );
}
