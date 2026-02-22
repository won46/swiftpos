import { Request, Response } from 'express';
import prisma from '../config/database';
import { coreApi, snap } from '../config/midtrans';
import { io } from '../index';
import crypto from 'crypto';

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `POS-${timestamp}-${random}`;
};

// Create QRIS payment
export const createQrisPayment = async (req: Request, res: Response) => {
  try {
    const { amount, items, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const orderId = generateOrderId();

    // Prepare Midtrans parameters for QRIS
    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      qris: {
        acquirer: 'gopay', // gopay is used for QRIS dynamic
      },
      item_details: items?.map((item: any) => ({
        id: item.productId,
        price: Math.round(item.unitPrice),
        quantity: item.quantity,
        name: item.name?.substring(0, 50) || 'Product',
      })) || [{
        id: 'default',
        price: Math.round(amount),
        quantity: 1,
        name: 'POS Transaction',
      }],
      customer_details: {
        first_name: customerName || 'Guest',
      },
    };

    // Create transaction via Midtrans
    const chargeResponse = await coreApi.charge(parameter);

    // Extract QR code URL and expiry time
    const qrCodeUrl = chargeResponse.actions?.find(
      (action: any) => action.name === 'generate-qr-code'
    )?.url;

    // Save payment record to database
    await prisma.payment.create({
      data: {
        // transactionId will be linked later when transaction is created
        orderId: orderId,
        amount: Math.round(amount),
        paymentType: 'qris',
        status: 'pending',
        qrCode: qrCodeUrl || chargeResponse.qr_string,
        expiryTime: chargeResponse.expiry_time 
          ? new Date(chargeResponse.expiry_time) 
          : new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        gatewayResponse: chargeResponse as any,
      },
    });

    res.json({
      success: true,
      data: {
        orderId,
        qrCodeUrl: qrCodeUrl || null,
        qrString: chargeResponse.qr_string || null,
        expiryTime: chargeResponse.expiry_time,
        transactionId: chargeResponse.transaction_id,
        transactionStatus: chargeResponse.transaction_status,
      },
    });
  } catch (error: any) {
    console.error('Error creating QRIS payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create QRIS payment',
    });
  }
};

// Create Snap payment
export const createSnapTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, items, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const orderId = generateOrderId();

    // Prepare Midtrans parameters for Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      credit_card: {
        secure: true,
      },
      item_details: items?.map((item: any) => ({
        id: item.productId,
        price: Math.round(item.unitPrice),
        quantity: item.quantity,
        name: item.name?.substring(0, 50) || 'Product',
      })) || [{
        id: 'default',
        price: Math.round(amount),
        quantity: 1,
        name: 'POS Transaction',
      }],
      customer_details: {
        first_name: customerName || 'Guest',
      },
    };

    // Create transaction via Midtrans Snap
    const transaction = await snap.createTransaction(parameter);
    const { token, redirect_url } = transaction;

    // Save payment record to database
    await prisma.payment.create({
      data: {
        orderId: orderId,
        amount: Math.round(amount),
        paymentType: 'snap',
        status: 'pending',
        gatewayResponse: transaction,
      },
    });

    res.json({
      success: true,
      data: {
        orderId,
        token,
        redirectUrl: redirect_url,
      },
    });
  } catch (error: any) {
    console.error('Error creating Snap transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Snap transaction',
    });
  }
};

// Check payment status
export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    // Get status from Midtrans
    const statusResponse = await coreApi.transaction.status(orderId);

    // Update payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (payment) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: statusResponse.transaction_status,
          paidAt: statusResponse.transaction_status === 'settlement' 
            ? new Date() 
            : null,
          gatewayResponse: statusResponse as any,
        },
      });
    }

    // Emit real-time update if payment is settled
    if (statusResponse.transaction_status === 'settlement') {
      io.emit('payment:success', {
        orderId,
        status: 'settlement',
      });
    }

    res.json({
      success: true,
      data: {
        orderId,
        transactionId: statusResponse.transaction_id,
        transactionStatus: statusResponse.transaction_status,
        fraudStatus: statusResponse.fraud_status,
        paymentType: statusResponse.payment_type,
        grossAmount: statusResponse.gross_amount,
        settlementTime: statusResponse.settlement_time,
      },
    });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status',
    });
  }
};

// Handle Midtrans webhook notification
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const notification = req.body;

    // Verify notification signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const signatureKey = notification.signature_key;
    
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    if (signatureKey !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(403).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Update payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId: notification.order_id },
    });

    if (payment) {
      let newStatus = 'pending';
      let paidAt = null;

      if (transactionStatus === 'capture') {
        newStatus = fraudStatus === 'accept' ? 'settlement' : 'pending';
      } else if (transactionStatus === 'settlement') {
        newStatus = 'settlement';
        paidAt = new Date();
      } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
        newStatus = transactionStatus;
      } else if (transactionStatus === 'pending') {
        newStatus = 'pending';
      }

      await prisma.payment.update({
        where: { orderId: notification.order_id },
        data: {
          status: newStatus,
          paidAt,
          gatewayResponse: notification,
        },
      });

      // Emit real-time update
      io.emit('payment:update', {
        orderId: notification.order_id,
        status: newStatus,
        transactionStatus,
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to handle webhook',
    });
  }
};

// Cancel payment
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Cancel via Midtrans
    const cancelResponse = await coreApi.transaction.cancel(orderId);

    // Update payment record
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'cancel',
        gatewayResponse: cancelResponse,
      },
    });

    res.json({
      success: true,
      data: cancelResponse,
    });
  } catch (error: any) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel payment',
    });
  }
};
