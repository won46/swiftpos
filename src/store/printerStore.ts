import { create } from 'zustand';

interface PrinterState {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
  deviceName: string | null;
  setDevice: (device: BluetoothDevice, server: BluetoothRemoteGATTServer, characteristic: BluetoothRemoteGATTCharacteristic) => void;
  disconnect: () => void;
}

export const usePrinterStore = create<PrinterState>((set) => ({
  device: null,
  server: null,
  characteristic: null,
  isConnected: false,
  deviceName: null,

  setDevice: (device, server, characteristic) => set({
    device,
    server,
    characteristic,
    isConnected: true,
    deviceName: device.name || 'Unknown Printer'
  }),

  disconnect: () => set((state) => {
    if (state.device && state.device.gatt?.connected) {
      state.device.gatt.disconnect();
    }
    return {
      device: null,
      server: null,
      characteristic: null,
      isConnected: false,
      deviceName: null
    };
  })
}));
