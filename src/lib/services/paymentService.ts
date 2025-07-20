import type { CartItem } from '$lib/stores/cart';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private apiUrl: string;
  
  private constructor() {
    this.apiUrl = '/api/payments';
  }
  
  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }
  
  async createPaymentIntent(items: CartItem[], metadata: any = {}): Promise<PaymentIntent> {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = totalAmount * 0.08; // 8% tax
    const finalAmount = Math.round((totalAmount + taxAmount) * 100); // Convert to cents
    
    const response = await fetch(`${this.apiUrl}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: 'usd',
        items: items.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        metadata
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }
    
    return await response.json();
  }
  
  async confirmPayment(paymentIntentId: string, paymentMethod: string): Promise<PaymentResult> {
    const response = await fetch(`${this.apiUrl}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        paymentMethod
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Payment confirmation failed'
      };
    }
    
    return {
      success: true,
      paymentIntentId: result.paymentIntentId
    };
  }
  
  async processPayment(items: CartItem[], paymentData: any): Promise<PaymentResult> {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(items, {
        userId: paymentData.userId,
        email: paymentData.email,
        billingAddress: paymentData.billingAddress
      });
      
      // Confirm payment (in a real app, this would be done on the client side with Stripe.js)
      const result = await this.confirmPayment(paymentIntent.id, paymentData.paymentMethod);
      
      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }
  
  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string; amount: number }> {
    const response = await fetch(`${this.apiUrl}/payment-status/${paymentIntentId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }
    
    return await response.json();
  }
  
  async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    const response = await fetch(`${this.apiUrl}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amount
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Refund failed'
      };
    }
    
    return {
      success: true,
      paymentIntentId: result.paymentIntentId
    };
  }
}

export const paymentService = PaymentService.getInstance(); 