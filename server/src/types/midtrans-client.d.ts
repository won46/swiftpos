declare module 'midtrans-client' {
  export interface CoreApiConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface ChargeParameter {
    payment_type: string;
    transaction_details: TransactionDetails;
    qris?: {
      acquirer?: string;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    customer_details?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
  }

  export interface ChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    currency: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
    expiry_time?: string;
    qr_string?: string;
    actions?: Array<{
      name: string;
      method: string;
      url: string;
    }>;
  }

  export interface TransactionStatusResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status: string;
    settlement_time?: string;
  }

  export class CoreApi {
    constructor(config: CoreApiConfig);
    charge(parameter: ChargeParameter): Promise<ChargeResponse>;
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
      cancel(orderId: string): Promise<any>;
      expire(orderId: string): Promise<any>;
    };
  }

  export class Snap {
    constructor(config: CoreApiConfig);
    createTransaction(parameter: any): Promise<any>;
    createTransactionToken(parameter: any): Promise<string>;
    createTransactionRedirectUrl(parameter: any): Promise<string>;
  }
}
