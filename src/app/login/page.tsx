'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';
import { Button, Input } from '@/components/ui';
import { ShoppingCart, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() { 
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      const { accessToken, refreshToken, user } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <ShoppingCart size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">SwiftPOS</h1>
          <p className="text-[var(--foreground-muted)]">
            Silakan login untuk melanjutkan
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-[var(--error-bg)] border border-[var(--error)] flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-[var(--error)] mt-0.5" />
              <p className="text-sm text-[var(--error)]">{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com1"
              icon={Mail}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 pt-8 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--foreground-muted)] mb-4 text-center">
            Akun Demo (untuk testing):
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('admin@swiftpos.com', 'admin123')}
              className="w-full p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-left border border-[var(--border)]"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-[var(--foreground-muted)]">admin@swiftpos.com</p>
                </div>
                <span className="badge badge-error text-xs">ADMIN</span>
              </div>
            </button>
            <button
              onClick={() => handleDemoLogin('kasir@swiftpos.com', 'cashier123')}
              className="w-full p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors text-left border border-[var(--border)]"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Kasir</p>
                  <p className="text-xs text-[var(--foreground-muted)]">kasir@swiftpos.com</p>
                </div>
                <span className="badge badge-info text-xs">KASIR</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--foreground-muted)]">
            © 2025 SwiftPOS. Modern Point of Sales System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
