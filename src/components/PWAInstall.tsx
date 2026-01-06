'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstall() {
  const [isMounted, setIsMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner after a delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }

    setInstallPrompt(null);
  };

  // Don't render on server
  if (!isMounted) return null;

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="card bg-[var(--surface)] border-2 border-[var(--primary)] p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary-bg)]">
            <Download className="text-[var(--primary)]" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install SwiftPOS</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-3">
              Akses lebih cepat dengan install aplikasi ke home screen
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleInstall}
                className="btn btn-primary btn-sm"
              >
                Install
              </button>
              <button 
                onClick={() => setShowBanner(false)}
                className="btn btn-secondary btn-sm"
              >
                Nanti
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 rounded hover:bg-[var(--surface)] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
