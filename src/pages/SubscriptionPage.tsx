import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  FileText, 
  MessageCircle, 
  Calendar, 
  BarChart3,
  Shield,
  Zap,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { paymentService, PricingPlan } from '../lib/paymentService';
import { PaymentPage } from '../components/payment/PaymentPage';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [documentUsage, setDocumentUsage] = useState({ current: 0, limit: 3 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userRegion, setUserRegion] = useState('africa');

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get user's current subscription
      const subscription = await paymentService.getUserSubscription(user!.id);
      setCurrentSubscription(subscription);
      
      // Get available plans
      const region = paymentService.detectRegion();
      setUserRegion(region);
      const plans = paymentService.calculatePricing(region);
      setAvailablePlans(plans);
      
      // Get document usage
      const usage = await paymentService.canUploadDocument(user!.id);
      setDocumentUsage({
        current: usage.currentCount,
        limit: usage.limit === Infinity ? -1 : usage.limit
      });
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    loadSubscriptionData(); // Refresh data
    toast({
      title: "Subscription Updated!",
      description: "Your plan has been successfully upgraded",
      variant: "success"
    });
  };

  const getCurrentPlanName = () => {
    if (!currentSubscription) return 'Free';
    const plan = availablePlans.find(p => p.id === currentSubscription.plan_id);
    return plan?.name || 'Free';
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUsageColor = () => {
    const percentage = documentUsage.limit === -1 ? 0 : (documentUsage.current / documentUsage.limit) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:bg-green-900/20';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12"
        >
          <Sparkles className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <span>Your Subscription</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your CareAI plan and unlock premium features
          </p>
        </motion.div>

        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Current Plan Status */}
          <motion.div variants={itemVariants}>
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Current Plan</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    You're currently on the <span className="font-semibold">{getCurrentPlanName()}</span> plan
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {currentSubscription ? formatPrice(
                      availablePlans.find(p => p.id === currentSubscription.plan_id)?.price_xaf || 0
                    ) : 'Free'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentSubscription ? 'per month' : 'forever'}
                  </div>
                </div>
              </div>

              {/* Document Usage */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Health Documents</span>
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUsageColor()}`}>
                    {documentUsage.current} / {documentUsage.limit === -1 ? '∞' : documentUsage.limit} used
                  </span>
                </div>
                
                {documentUsage.limit !== -1 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(documentUsage.current / documentUsage.limit) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                )}

                {documentUsage.current >= documentUsage.limit && documentUsage.limit !== -1 && (
                  <motion.div
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-300">
                          Document Limit Reached
                        </h4>
                        <p className="text-red-700 dark:text-red-400 text-sm">
                          Upgrade your plan to store more health documents securely.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Available Plans */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6 text-center">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availablePlans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan_id === plan.id || 
                                    (!currentSubscription && plan.id === 'free');
                
                return (
                  <motion.div
                    key={plan.id}
                    className={`
                      relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-200
                      ${isCurrentPlan 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }
                      ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                    `}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {plan.description}
                      </p>
                      <div className="text-3xl font-bold mb-1">
                        {formatPrice(plan.price_xaf)}
                      </div>
                      {plan.price_xaf > 0 && (
                        <p className="text-gray-500 text-sm">per month</p>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan || plan.id === 'free'}
                      className={`
                        w-full py-3 rounded-xl font-medium transition-all duration-200
                        ${isCurrentPlan 
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-default' 
                          : plan.id === 'free'
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-default'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                        }
                      `}
                    >
                      {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Free Plan' : 'Upgrade'}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Regional Pricing Info */}
          {userRegion === 'africa' && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">
                    Special African Pricing! 🌍
                  </h3>
                  <p className="text-green-700 dark:text-green-400">
                    We're committed to making healthcare accessible across Africa with our lowest regional pricing.
                    Save up to 60% compared to other regions!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentPage
            preSelectedPlan={selectedPlan}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPlan('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
