'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Printer, Bluetooth, CheckCircle, XCircle } from 'lucide-react';
import { usePrinterStore } from '@/store/printerStore';
import { printerService } from '@/services/printerService';

export function PrinterSetup() {
  const { isConnected, deviceName, disconnect } = usePrinterStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await printerService.connect();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      const encoder = new TextEncoder();
      const text = '\x1B\x40' + // Init
                   '\x1B\x61\x01' + // Center
                   'TEST PRINT\n' +
                   '----------------\n' +
                   'Bluetooth Printer\n' +
                   'Connected Successfully!\n' +
                   '\x0A\x0A\x0A' + // Line feeds
                   '\x1D\x56\x00'; // Cut
      
      await printerService.printData(encoder.encode(text));
    } catch (err: any) {
      setError(err.message || 'Failed to print test');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
          <Printer size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg">Printer Bluetooth</h3>
          <p className="text-sm text-gray-500">Hubungkan printer thermal via Bluetooth</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
          <div className="flex items-center gap-3">
             {isConnected ? (
                <CheckCircle className="text-green-500" />
             ) : (
                <XCircle className="text-gray-400" />
             )}
             <div>
                <p className="font-medium">{isConnected ? 'Terhubung' : 'Tidak Terhubung'}</p>
                {isConnected && <p className="text-sm text-gray-500">{deviceName}</p>}
             </div>
          </div>
          
          {isConnected ? (
             <Button variant="secondary" onClick={disconnect} className="text-red-500 hover:bg-red-50">
                Putuskan
             </Button>
          ) : (
             <Button variant="primary" onClick={handleConnect} disabled={isConnecting} icon={Bluetooth}>
                {isConnecting ? 'Mencari...' : 'Hubungkan'}
             </Button>
          )}
        </div>

        {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm">
                {error}
            </div>
        )}

        {isConnected && (
            <Button onClick={handleTestPrint} className="w-full">
                Test Print
            </Button>
        )}
      </div>
    </div>
  );
}
