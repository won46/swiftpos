import { usePrinterStore } from '@/store/printerStore';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

const COMMANDS = {
  INIT: ESC + '@',
  CUT: GS + 'V' + '\x41' + '\x03', // Cut paper
  TEXT_FORMAT: {
    NORMAL: ESC + '!' + '\x00',
    BOLD: ESC + '!' + '\x08',
    DOUBLE_HEIGHT: ESC + '!' + '\x10',
    DOUBLE_WIDTH: ESC + '!' + '\x20',
    DOUBLE_SIZE: ESC + '!' + '\x30',
  },
  ALIGN: {
    LEFT: ESC + 'a' + '\x00',
    CENTER: ESC + 'a' + '\x01',
    RIGHT: ESC + 'a' + '\x02',
  }
};

export const printerService = {
  async connect() {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported in this browser');
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard Printer Service
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (!device.gatt) {
        throw new Error('Device does not support GATT');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      // Update store
      usePrinterStore.getState().setDevice(device, server, characteristic);
      
      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        usePrinterStore.getState().disconnect();
      });

      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      throw error;
    }
  },

  async printData(data: Uint8Array) {
    const { characteristic, isConnected } = usePrinterStore.getState();
    if (!isConnected || !characteristic) {
      throw new Error('Printer not connected');
    }

    // Write in chunks to avoid buffer overflow
    const CHUNK_SIZE = 512;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }
  },

  // Helper to encode string to Uint8Array with ESC/POS commands
  encodeReceipt(text: string): Uint8Array {
      const encoder = new TextEncoder();
      const commands = [
          COMMANDS.INIT,
          text,
          LF, 
          LF, 
          LF, // Feed lines
          COMMANDS.CUT
      ];
      return encoder.encode(commands.join(''));
  },
  
  // Advanced formatting helper (Chainable builder pattern could be better, but keeping it simple for now)
  formatText(text: string, format: 'NORMAL' | 'BOLD' | 'CENTER' | 'LEFT' | 'RIGHT' = 'NORMAL'): string {
      let cmd = '';
      if (format === 'BOLD') cmd = COMMANDS.TEXT_FORMAT.BOLD;
      if (format === 'CENTER') cmd = COMMANDS.ALIGN.CENTER;
      if (format === 'LEFT') cmd = COMMANDS.ALIGN.LEFT;
      if (format === 'RIGHT') cmd = COMMANDS.ALIGN.RIGHT;
      
      return cmd + text + (cmd ? COMMANDS.TEXT_FORMAT.NORMAL : '') + (cmd.includes(ESC + 'a') ? COMMANDS.ALIGN.LEFT : ''); 
  }
};
