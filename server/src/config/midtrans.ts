import { CoreApi, Snap } from 'midtrans-client';

// Debug: Log environment variables
console.log('📱 Midtrans Config:');
console.log('  - isProduction:', process.env.MIDTRANS_IS_PRODUCTION);
console.log('  - serverKey:', process.env.MIDTRANS_SERVER_KEY ? `${process.env.MIDTRANS_SERVER_KEY.substring(0, 15)}...` : 'NOT SET');
console.log('  - clientKey:', process.env.MIDTRANS_CLIENT_KEY ? `${process.env.MIDTRANS_CLIENT_KEY.substring(0, 15)}...` : 'NOT SET');

const config = {
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
};

// Initialize Midtrans Core API
const coreApi = new CoreApi(config);

// Initialize Midtrans Snap API
const snap = new Snap(config);

export { coreApi, snap };

