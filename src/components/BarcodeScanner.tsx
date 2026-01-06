'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  mode?: 'usb' | 'camera' | 'auto';
}

export function BarcodeScanner({ onScan, mode = 'auto' }: BarcodeScannerProps) {
  const [scannerMode, setScannerMode] = useState<'usb' | 'camera'>('usb');
  const [lastScan, setLastScan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const barcodeBuffer = useRef<string>('');
  const scanTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Set initial mode
  useEffect(() => {
    if (mode !== 'auto') {
      setScannerMode(mode);
    }
  }, [mode]);

  // USB Scanner - Listen for keyboard inputs
  useEffect(() => {
    if (scannerMode !== 'usb') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Enter key = end of barcode scan
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const barcode = barcodeBuffer.current;
          setLastScan(barcode);
          setIsScanning(true);
          onScan(barcode);
          barcodeBuffer.current = '';
          
          // Reset scanning state after 2 seconds
          setTimeout(() => setIsScanning(false), 2000);
        }
        return;
      }

      // Accumulate characters
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        
        // Clear buffer after 100ms of no input (USB scanner is very fast)
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }
        scanTimeout.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, [scannerMode, onScan]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Pemindai Barcode</h3>
        {mode === 'auto' && (
          <div className="flex gap-2">
            <button
              onClick={() => setScannerMode('usb')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                scannerMode === 'usb'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Keyboard size={16} />
              USB Scanner
            </button>
            <button
              onClick={() => setScannerMode('camera')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                scannerMode === 'camera'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Camera size={16} />
              Camera
            </button>
          </div>
        )}
      </div>

      {scannerMode === 'usb' && (
        <div className="text-center py-8">
          <div className={`inline-block p-6 rounded-full mb-4 ${
            isScanning ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--surface)]'
          }`}>
            <Keyboard size={48} className={isScanning ? 'text-white' : 'text-[var(--foreground-muted)]'} />
          </div>
          <p className="text-lg font-medium mb-2">
            {isScanning ? '✓ Barcode Terdeteksi!' : 'Siap Memindai'}
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Scan barcode dengan USB scanner
          </p>
          {lastScan && (
            <div className="inline-block bg-[var(--surface)] px-4 py-2 rounded-lg">
              <span className="text-xs text-[var(--foreground-muted)]">Scan terakhir:</span>
              <span className="ml-2 font-mono font-bold">{lastScan}</span>
            </div>
          )}
        </div>
      )}

      {scannerMode === 'camera' && (
        <div className="text-center py-8">
          <div className="inline-block p-6 rounded-full bg-[var(--surface)] mb-4">
            <Camera size={48} className="text-[var(--foreground-muted)]" />
          </div>
          <p className="text-lg font-medium mb-2">Camera Scanner</p>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Untuk implementasi camera scanner, install library:<br />
            <code className="bg-[var(--surface)] px-2 py-1 rounded">npm install html5-qrcode</code>
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Saat ini gunakan USB scanner mode
          </p>
        </div>
      )}
    </div>
  );
}
