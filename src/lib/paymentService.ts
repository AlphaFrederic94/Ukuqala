import { supabase } from './supabaseClient';

// XAF Currency Exchange Rates (Base: 1 USD)
const XAF_EXCHANGE_RATE = 580; // 1 USD = 580 XAF (approximate)

// Regional Pricing Multipliers
const REGIONAL_PRICING = {
  africa: 1.0,      // Base pricing (cheapest)
  europe: 2.0,      // 2x Africa pricing
  north_america: 2.5, // 2.5x Africa pricing
  other: 2.0        // 2x Africa pricing
};

// Base Pricing in USD (will be converted to XAF)
const BASE_PRICING_USD = {
  basic: 5,      // 5 USD
  premium: 15,   // 15 USD
  enterprise: 50 // 50 USD
};

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'mobile_money' | 'orange_money';
  icon: string;
  description: string;
  available_regions: string[];
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  document_limit: number;
  price_usd: number;
  price_xaf: number;
  popular?: boolean;
}

export interface PaymentData {
  plan_id: string;
  payment_method: string;
  amount_xaf: number;
  user_id: string;
  region: string;
  phone_number?: string;
  card_details?: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
  redirect_url?: string;
}

class PaymentService {
  private paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      type: 'stripe',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg',
      description: 'Pay securely with your credit or debit card',
      available_regions: ['africa', 'europe', 'north_america', 'other']
    },
    {
      id: 'mtn_mobile_money',
      name: 'MTN Mobile Money',
      type: 'mobile_money',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/MTN_Logo.svg/512px-MTN_Logo.svg.png',
      description: 'Pay with MTN Mobile Money',
      available_regions: ['africa']
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      type: 'orange_money',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png',
      description: 'Pay with Orange Money',
      available_regions: ['africa']
    },
    {
      id: 'airtel_money',
      name: 'Airtel Money',
      type: 'mobile_money',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Airtel_logo.svg/512px-Airtel_logo.svg.png',
      description: 'Pay with Airtel Money',
      available_regions: ['africa']
    }
  ];

  // Get available payment methods for a region
  getPaymentMethods(region: string = 'africa'): PaymentMethod[] {
    return this.paymentMethods.filter(method => 
      method.available_regions.includes(region)
    );
  }

  // Calculate pricing based on region
  calculatePricing(region: string = 'africa'): PricingPlan[] {
    const multiplier = REGIONAL_PRICING[region as keyof typeof REGIONAL_PRICING] || REGIONAL_PRICING.other;
    
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        features: [
          '3 health documents storage',
          'Basic chatbot access',
          'Appointment booking',
          'Basic health tracking'
        ],
        document_limit: 3,
        price_usd: 0,
        price_xaf: 0
      },
      {
        id: 'basic',
        name: 'Basic',
        description: 'Great for individuals',
        features: [
          '25 health documents storage',
          'Enhanced chatbot features',
          'Priority appointment booking',
          'Advanced health analytics',
          'Email support'
        ],
        document_limit: 25,
        price_usd: BASE_PRICING_USD.basic * multiplier,
        price_xaf: Math.round(BASE_PRICING_USD.basic * multiplier * XAF_EXCHANGE_RATE),
        popular: region === 'africa'
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Best for families',
        features: [
          '100 health documents storage',
          'AI-powered health insights',
          'Telemedicine consultations',
          'Family health management',
          'Priority support',
          'Custom health reports'
        ],
        document_limit: 100,
        price_usd: BASE_PRICING_USD.premium * multiplier,
        price_xaf: Math.round(BASE_PRICING_USD.premium * multiplier * XAF_EXCHANGE_RATE),
        popular: region !== 'africa'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For healthcare organizations',
        features: [
          'Unlimited health documents',
          'Advanced AI analytics',
          'Multi-user management',
          'API access',
          'Custom integrations',
          '24/7 dedicated support',
          'Compliance reporting'
        ],
        document_limit: -1, // Unlimited
        price_usd: BASE_PRICING_USD.enterprise * multiplier,
        price_xaf: Math.round(BASE_PRICING_USD.enterprise * multiplier * XAF_EXCHANGE_RATE)
      }
    ];
  }

  // Detect user region (simplified - in production, use IP geolocation)
  detectRegion(): string {
    // For now, default to Africa since it's the target market
    // In production, implement proper geolocation
    return 'africa';
  }

  // Process payment based on method
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // For demo purposes, simulate payment without database
      const transactionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('Processing demo payment:', {
        plan: paymentData.plan_id,
        method: paymentData.payment_method,
        amount: paymentData.amount_xaf,
        transactionId
      });

      // Route to appropriate payment processor
      switch (paymentData.payment_method) {
        case 'stripe':
          return await this.processStripePayment(paymentData, transactionId);
        case 'mtn_mobile_money':
        case 'airtel_money':
          return await this.processMobileMoneyPayment(paymentData, transactionId);
        case 'orange_money':
          return await this.processOrangeMoneyPayment(paymentData, transactionId);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  private async processStripePayment(paymentData: PaymentData, transactionId: string): Promise<PaymentResult> {
    // Simulate Stripe payment processing
    // In production, integrate with Stripe API

    console.log('Processing Stripe payment...', { transactionId, amount: paymentData.amount_xaf });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    const success = Math.random() > 0.1; // 90% success rate for simulation

    if (success) {
      console.log('Stripe payment successful!', transactionId);
      // Skip database operations for demo
      // await this.updatePaymentStatus(transactionId, 'completed');
      // await this.upgradeUserPlan(paymentData.user_id, paymentData.plan_id);

      return {
        success: true,
        transaction_id: `stripe_${transactionId}`
      };
    } else {
      console.log('Stripe payment failed!', transactionId);
      return {
        success: false,
        error: 'Card payment failed. Please check your card details.'
      };
    }
  }

  private async processMobileMoneyPayment(paymentData: PaymentData, transactionId: string): Promise<PaymentResult> {
    // Simulate Mobile Money payment processing
    // In production, integrate with MTN/Airtel APIs

    console.log('Processing Mobile Money payment...', { transactionId, phone: paymentData.phone_number });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call

    const success = Math.random() > 0.05; // 95% success rate for simulation

    if (success) {
      console.log('Mobile Money payment successful!', transactionId);
      // Skip database operations for demo
      // await this.updatePaymentStatus(transactionId, 'completed');
      // await this.upgradeUserPlan(paymentData.user_id, paymentData.plan_id);

      return {
        success: true,
        transaction_id: `momo_${transactionId}`
      };
    } else {
      console.log('Mobile Money payment failed!', transactionId);
      return {
        success: false,
        error: 'Mobile Money payment failed. Please check your phone number and balance.'
      };
    }
  }

  private async processOrangeMoneyPayment(paymentData: PaymentData, transactionId: string): Promise<PaymentResult> {
    // Simulate Orange Money payment processing
    // In production, integrate with Orange Money API

    console.log('Processing Orange Money payment...', { transactionId, phone: paymentData.phone_number });
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API call

    const success = Math.random() > 0.05; // 95% success rate for simulation

    if (success) {
      console.log('Orange Money payment successful!', transactionId);
      // Skip database operations for demo
      // await this.updatePaymentStatus(transactionId, 'completed');
      // await this.upgradeUserPlan(paymentData.user_id, paymentData.plan_id);

      return {
        success: true,
        transaction_id: `orange_${transactionId}`
      };
    } else {
      console.log('Orange Money payment failed!', transactionId);
      return {
        success: false,
        error: 'Orange Money payment failed. Please check your phone number and balance.'
      };
    }
  }

  private async updatePaymentStatus(transactionId: string, status: string): Promise<void> {
    // For demo purposes, just log the status update
    console.log('Payment status updated:', { transactionId, status });
  }

  private async upgradeUserPlan(userId: string, planId: string): Promise<void> {
    // For demo purposes, just log the plan upgrade
    console.log('User plan upgraded:', { userId, planId });
  }

  // Get user's current subscription
  async getUserSubscription(userId: string) {
    try {
      // For demo purposes, return null (free plan)
      console.log('Getting subscription for user:', userId);
      return null; // Simulates free plan
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  // Check if user can upload more documents
  async canUploadDocument(userId: string): Promise<{ canUpload: boolean; currentCount: number; limit: number }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const planId = subscription?.plan_id || 'free';

      const plans = this.calculatePricing();
      const currentPlan = plans.find(p => p.id === planId) || plans[0]; // Default to free

      // For demo purposes, simulate some document usage
      const currentCount = Math.floor(Math.random() * 2); // 0-1 documents used
      const limit = currentPlan.document_limit;
      const canUpload = limit === -1 || currentCount < limit; // -1 means unlimited

      console.log('Document usage check:', { userId, currentCount, limit, canUpload });

      return {
        canUpload,
        currentCount,
        limit: limit === -1 ? Infinity : limit
      };
    } catch (error) {
      console.error('Error checking document upload:', error);
      // Return safe defaults
      return {
        canUpload: true,
        currentCount: 0,
        limit: 3
      };
    }
  }

  // Format XAF currency
  formatXAF(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Validate phone number for mobile money
  validatePhoneNumber(phoneNumber: string, countryCode: string = '+237'): boolean {
    // Basic validation for Cameroon phone numbers
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    const fullNumber = cleanNumber.startsWith('+') ? cleanNumber : countryCode + cleanNumber;

    // Cameroon mobile number patterns
    const cameroonPattern = /^\+237[67]\d{8}$/;

    return cameroonPattern.test(fullNumber);
  }

  // Get payment method by ID
  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.paymentMethods.find(method => method.id === id);
  }
}

export const paymentService = new PaymentService();
