'use client';

import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
        {/* <p className="text-sm font-medium text-muted-foreground transition-all">{message}</p> */}
      </div>
    </div>
  );
}
