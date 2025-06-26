import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentService } from '../lib/paymentService';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentTest() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  React.useEffect(() => {
    // Load payment data
    const loadData = () => {
      try {
        const availablePlans = paymentService.calculatePricing('africa');
        const availableMethods = paymentService.getPaymentMethods('africa');
        
        setPlans(availablePlans);
        setPaymentMethods(availableMethods);
        
        console.log('Payment data loaded:', { plans: availablePlans, methods: availableMethods });
      } catch (error) {
        console.error('Error loading payment data:', error);
      }
    };

    loadData();
  }, []);

  const testPayment = async (planId: string, methodId: string) => {
    if (!user) {
      alert('Please log in to test payments');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const plan = plans.find(p => p.id === planId);
      const paymentData = {
        plan_id: planId,
        payment_method: methodId,
        amount_xaf: plan?.price_xaf || 0,
        user_id: user.id,
        region: 'africa',
        phone_number: methodId.includes('mobile') || methodId.includes('orange') ? '+237612345678' : undefined,
        card_details: methodId === 'stripe' ? {
          number: '4242424242424242',
          expiry: '12/25',
          cvc: '123',
          name: 'Test User'
        } : undefined
      };

      console.log('Testing payment with data:', paymentData);
      
      const paymentResult = await paymentService.processPayment(paymentData);
      
      console.log('Payment result:', paymentResult);
      setResult(paymentResult);
      
    } catch (error) {
      console.error('Payment test error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <span>Payment System Test</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the payment processing functionality
          </p>
        </motion.div>

        {/* Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{plan.description}</p>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {plan.price_xaf === 0 ? 'Free' : `${plan.price_xaf.toLocaleString()} XAF`}
                </div>
                <div className="text-sm text-gray-500">
                  {plan.document_limit === -1 ? 'Unlimited' : plan.document_limit} documents
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <div className="flex items-center space-x-3 mb-2">
                  {method.type === 'stripe' ? (
                    <CreditCard className="w-6 h-6" />
                  ) : (
                    <Smartphone className="w-6 h-6" />
                  )}
                  <h3 className="font-bold">{method.name}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{method.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Test Payments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.filter(p => p.id !== 'free').map((plan) => (
              paymentMethods.map((method) => (
                <button
                  key={`${plan.id}-${method.id}`}
                  onClick={() => testPayment(plan.id, method.id)}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors"
                >
                  {isProcessing ? 'Processing...' : `${plan.name} via ${method.name}`}
                </button>
              ))
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold mb-4">Payment Result</h2>
            <div className={`p-6 rounded-lg border-2 ${
              result.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <h3 className={`text-lg font-bold ${
                  result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {result.success ? 'Payment Successful!' : 'Payment Failed'}
                </h3>
              </div>
              
              {result.success && result.transaction_id && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Transaction ID:</strong> {result.transaction_id}
                </p>
              )}
              
              {result.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {result.error}
                </p>
              )}
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">View Raw Result</summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Plans Loaded:</strong> {plans.length}</p>
            <p><strong>Payment Methods:</strong> {paymentMethods.length}</p>
            <p><strong>Region:</strong> africa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
