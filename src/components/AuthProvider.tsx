'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('accessToken');
      const publicRoutes = ['/login'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!token) {
        if (!isPublicRoute) router.push('/login');
        else setIsReady(true);
        return;
      }

      if (pathname === '/login') {
        router.push('/dashboard');
        return;
      }

      // Verify if user exists in DB
      try {
        const { authAPI } = require('@/services/api'); // Dynamic import to avoid cycles if any
        await authAPI.getMe();
        setIsReady(true);
      } catch (error: any) {
        console.error('Session validation failed:', error);
        // If 404 (User not found) or 401, clear session
        if (error.response?.status === 404 || error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          router.push('/login');
        } else {
          // Other errors (network), just allow (api interceptor will handle)
          setIsReady(true);
        }
      }
    };

    validateSession();
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--foreground-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
