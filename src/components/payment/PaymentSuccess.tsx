import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Crown, 
  Calendar, 
  FileText, 
  MessageCircle, 
  BarChart3,
  Download,
  Share2,
  ArrowRight,
  Sparkles,
  Gift,
  Star
} from 'lucide-react';
import { PricingPlan } from '../../lib/paymentService';
import { Button } from '../ui/Button';

interface PaymentSuccessProps {
  plan: PricingPlan;
  transactionId: string;
  onClose?: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  plan,
  transactionId,
  onClose
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getNextBillingDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
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

  const confettiVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5,
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="text-center space-y-8 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success Animation */}
      <motion.div className="relative">
        {/* Confetti Background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          variants={confettiVariants}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* Success Icon */}
        <motion.div
          className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            delay: 0.2 
          }}
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>

      {/* Success Message */}
      <motion.div variants={itemVariants}>
        <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
          Payment Successful! 🎉
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Welcome to your {plan.name} plan!
        </p>
      </motion.div>

      {/* Plan Details Card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 max-w-md mx-auto"
      >
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(plan.price_xaf)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Next Billing</span>
            <span className="font-semibold">{getNextBillingDate()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {transactionId.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* New Features Unlocked */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-2xl font-bold flex items-center justify-center space-x-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <span>Features Unlocked!</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {plan.features.slice(0, 4).map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-semibold">What's Next?</h3>
        
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigate to health records
              onClose?.();
            }}
          >
            <FileText className="w-4 h-4" />
            <span>Upload Health Records</span>
          </motion.button>
          
          <motion.button
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigate to chatbot
              onClose?.();
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Try Enhanced Chatbot</span>
          </motion.button>
          
          <motion.button
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigate to appointments
              onClose?.();
            }}
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Receipt Actions */}
      <motion.div variants={itemVariants} className="flex justify-center space-x-4">
        <motion.button
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span>Download Receipt</span>
        </motion.button>
        
        <motion.button
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </motion.button>
      </motion.div>

      {/* Close Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={onClose}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Thank You Message */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 max-w-md mx-auto"
      >
        <div className="flex items-center justify-center space-x-3 mb-3">
          <Gift className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
            Thank You for Choosing CareAI!
          </h4>
        </div>
        <p className="text-yellow-700 dark:text-yellow-400 text-sm">
          Your support helps us continue improving healthcare accessibility across Africa. 
          Welcome to the CareAI family! 🌍❤️
        </p>
      </motion.div>
    </motion.div>
  );
};
