'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, cookieUtils } from '@/services/auth-service';
import { profileService } from '@/services/profile-service';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = cookieUtils.get('access');
      const refreshToken = cookieUtils.get('refresh');

      if (!accessToken || !refreshToken) {
        router.push('/login');
        return;
      }

      try {
        const verifyRes = await authService.verifyToken(accessToken);
        if (verifyRes.ok) {
          const statusRes = await profileService.getPlatformStatus();
          if (!statusRes.data.is_given_company_details) {
            router.push('/activation');
          } else {
            router.push('/dashboard');
          }
        } else {
          const refreshRes = await authService.refreshToken(refreshToken);
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            cookieUtils.set('access', data.access, 7);
            cookieUtils.set('refresh', data.refresh, 7);

            const statusRes = await profileService.getPlatformStatus();
            if (!statusRes.data.is_given_company_details) {
              router.push('/activation');
            } else {
              router.push('/dashboard');
            }
          } else {
            router.push('/login');
          }
        }
      } catch (err) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    </div>
  );
}
