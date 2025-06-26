import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Crown, 
  Sparkles, 
  Globe,
  Star,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';
import { PaymentPage } from '../components/payment/PaymentPage';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function PaymentDemo() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  const demoFeatures = [
    {
      icon: CreditCard,
      title: 'Stripe Integration',
      description: 'Secure credit/debit card payments with real-time validation',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile Money',
      description: 'MTN, Orange Money, and Airtel Money support for Africa',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Globe,
      title: 'Regional Pricing',
      description: 'XAF currency with special African pricing (up to 60% off)',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Secure & Encrypted',
      description: '256-bit SSL encryption and PCI DSS compliance',
      color: 'from-red-500 to-red-600'
    }
  ];

  const paymentMethods = [
    {
      name: 'Stripe',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg',
      description: 'Credit/Debit Cards'
    },
    {
      name: 'MTN Mobile Money',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/MTN_Logo.svg/512px-MTN_Logo.svg.png',
      description: 'Mobile Money'
    },
    {
      name: 'Orange Money',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/512px-Orange_logo.svg.png',
      description: 'Mobile Money'
    },
    {
      name: 'Airtel Money',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Airtel_logo.svg/512px-Airtel_logo.svg.png',
      description: 'Mobile Money'
    }
  ];

  const handleDemoPayment = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
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

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center space-x-3 mb-6"
            variants={floatingVariants}
            animate={isAnimating ? "animate" : ""}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CareAI Payment System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Experience our comprehensive payment solution with Stripe, Mobile Money, and Orange Money integration. 
            Featuring XAF currency support and special African pricing.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => setIsAnimating(!isAnimating)}
              className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAnimating ? 'Pause' : 'Play'} Animations</span>
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {demoFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative"
              >
                <Card className="p-6 h-full border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Payment Methods Showcase */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">Supported Payment Methods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <img 
                    src={method.logo} 
                    alt={method.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <h3 className="font-semibold mb-1">{method.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Demo Buttons */}
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold mb-8">Try the Payment Flow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { id: 'basic', name: 'Basic Plan', price: '2,900 XAF', popular: false },
              { id: 'premium', name: 'Premium Plan', price: '8,700 XAF', popular: true },
              { id: 'enterprise', name: 'Enterprise Plan', price: '29,000 XAF', popular: false }
            ].map((plan) => (
              <motion.div
                key={plan.id}
                className={`
                  relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-300
                  ${plan.popular 
                    ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }
                `}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>POPULAR</span>
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {plan.price}
                  </div>
                </div>
                
                <Button
                  onClick={() => handleDemoPayment(plan.id)}
                  className={`
                    w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2
                    ${plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                    }
                  `}
                >
                  <span>Try Payment Flow</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 max-w-2xl mx-auto"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">
                Demo Mode Active
              </h3>
            </div>
            <p className="text-green-700 dark:text-green-400 text-center">
              This is a simulation of the payment system. No real payments will be processed. 
              All transactions are for demonstration purposes only.
            </p>
          </motion.div>
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
