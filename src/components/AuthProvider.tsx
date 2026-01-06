'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      
      // Public routes that don't require authentication
      const publicRoutes = ['/login'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!token && !isPublicRoute) {
        // No token and trying to access protected route - redirect to login
        router.push('/login');
        return;
      }

      if (token && pathname === '/login') {
        // Already logged in and trying to access login page - redirect to dashboard
        router.push('/dashboard');
        return;
      }

      setIsReady(true);
    };

    checkAuth();
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
