import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  ArrowLeft, 
  Star,
  Zap,
  Users,
  Building,
  Crown,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService, PricingPlan, PaymentMethod } from '../../lib/paymentService';
import { useToast } from '../ui/Toast';
import { PricingCards } from './PricingCards';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentForm } from './PaymentForm';
import { PaymentSuccess } from './PaymentSuccess';

interface PaymentPageProps {
  onClose?: () => void;
  preSelectedPlan?: string;
}

type PaymentStep = 'plans' | 'payment_method' | 'payment_form' | 'processing' | 'success' | 'error';

export const PaymentPage: React.FC<PaymentPageProps> = ({ onClose, preSelectedPlan }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<PaymentStep>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [userRegion, setUserRegion] = useState<string>('africa');
  const [transactionId, setTransactionId] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    initializePaymentData();
  }, []);

  useEffect(() => {
    if (preSelectedPlan && availablePlans.length > 0) {
      const plan = availablePlans.find(p => p.id === preSelectedPlan);
      if (plan) {
        setSelectedPlan(plan);
        setCurrentStep('payment_method');
      }
    }
  }, [preSelectedPlan, availablePlans]);

  const initializePaymentData = async () => {
    try {
      const region = paymentService.detectRegion();
      setUserRegion(region);
      
      const plans = paymentService.calculatePricing(region);
      const paymentMethods = paymentService.getPaymentMethods(region);
      
      setAvailablePlans(plans);
      setAvailablePaymentMethods(paymentMethods);
    } catch (error) {
      console.error('Error initializing payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment options",
        variant: "destructive"
      });
    }
  };

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan!",
        variant: "info"
      });
      return;
    }
    
    setSelectedPlan(plan);
    setCurrentStep('payment_method');
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setCurrentStep('payment_form');
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    if (!selectedPlan || !selectedPaymentMethod || !user) return;

    setCurrentStep('processing');
    setProcessingProgress(0);

    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await paymentService.processPayment({
        plan_id: selectedPlan.id,
        payment_method: selectedPaymentMethod.id,
        amount_xaf: selectedPlan.price_xaf,
        user_id: user.id,
        region: userRegion,
        ...paymentData
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (result.success) {
        setTransactionId(result.transaction_id || '');
        setTimeout(() => setCurrentStep('success'), 500);
        
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${selectedPlan.name} plan!`,
          variant: "success"
        });
      } else {
        setCurrentStep('error');
        toast({
          title: "Payment Failed",
          description: result.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setCurrentStep('error');
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'payment_method':
        setCurrentStep('plans');
        setSelectedPlan(null);
        break;
      case 'payment_form':
        setCurrentStep('payment_method');
        setSelectedPaymentMethod(null);
        break;
      case 'error':
        setCurrentStep('payment_form');
        break;
      default:
        onClose?.();
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      x: -50, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      variants={backgroundVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
            animate={{
              background: [
                "linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))",
                "linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2))",
                "linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentStep !== 'plans' && currentStep !== 'success' && (
                <motion.button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Crown className="w-6 h-6" />
                  <span>Upgrade Your Plan</span>
                </h2>
                <p className="text-blue-100 mt-1">
                  {userRegion === 'africa' ? 'Special African Pricing' : 'Premium Healthcare Features'}
                </p>
              </div>
            </div>
            
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">×</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentStep === 'plans' && (
              <motion.div
                key="plans"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <PricingCards
                  plans={availablePlans}
                  onSelectPlan={handlePlanSelect}
                  userRegion={userRegion}
                />
              </motion.div>
            )}

            {currentStep === 'payment_method' && selectedPlan && (
              <motion.div
                key="payment_method"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <PaymentMethodSelector
                  plan={selectedPlan}
                  paymentMethods={availablePaymentMethods}
                  onSelectMethod={handlePaymentMethodSelect}
                  userRegion={userRegion}
                />
              </motion.div>
            )}

            {currentStep === 'payment_form' && selectedPlan && selectedPaymentMethod && (
              <motion.div
                key="payment_form"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <PaymentForm
                  plan={selectedPlan}
                  paymentMethod={selectedPaymentMethod}
                  onSubmit={handlePaymentSubmit}
                  userRegion={userRegion}
                />
              </motion.div>
            )}

            {currentStep === 'processing' && (
              <motion.div
                key="processing"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Sparkles className="w-16 h-16 text-blue-600" />
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-4">Processing Payment...</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please wait while we process your payment securely
                </p>
                
                <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <p className="text-sm text-gray-500 mt-2">{processingProgress}% complete</p>
              </motion.div>
            )}

            {currentStep === 'success' && selectedPlan && (
              <motion.div
                key="success"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <PaymentSuccess
                  plan={selectedPlan}
                  transactionId={transactionId}
                  onClose={onClose}
                />
              </motion.div>
            )}

            {currentStep === 'error' && (
              <motion.div
                key="error"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-red-600">Payment Failed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn't process your payment. Please try again.
                </p>
                
                <motion.button
                  onClick={handleBack}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
