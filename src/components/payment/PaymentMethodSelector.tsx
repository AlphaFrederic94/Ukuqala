import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle,
  Zap,
  Globe,
  Lock,
  Star,
  ArrowRight
} from 'lucide-react';
import { PricingPlan, PaymentMethod } from '../../lib/paymentService';

interface PaymentMethodSelectorProps {
  plan: PricingPlan;
  paymentMethods: PaymentMethod[];
  onSelectMethod: (method: PaymentMethod) => void;
  userRegion: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  plan,
  paymentMethods,
  onSelectMethod,
  userRegion
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'stripe':
        return CreditCard;
      case 'mobile_money':
      case 'orange_money':
        return Smartphone;
      default:
        return CreditCard;
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    if (method.type === 'mobile_money' || method.type === 'orange_money') {
      return { text: 'Popular in Africa', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    }
    if (method.type === 'stripe') {
      return { text: 'Secure & Fast', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
    }
    return null;
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

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h3 
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choose Payment Method
        </motion.h3>
        <motion.p 
          className="text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Select how you'd like to pay for your {plan.name} plan
        </motion.p>
      </div>

      {/* Plan Summary */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold mb-1">{plan.name} Plan</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(plan.price_xaf)}
            </div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {paymentMethods.map((method) => {
          const IconComponent = getMethodIcon(method.type);
          const badge = getMethodBadge(method);
          const isSelected = selectedMethod?.id === method.id;

          return (
            <motion.div
              key={method.id}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02,
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }
              `}
              onClick={() => setSelectedMethod(method)}
            >
              <div className="flex items-center space-x-4">
                {/* Method Icon */}
                <div className={`
                  w-16 h-16 rounded-xl flex items-center justify-center
                  ${isSelected 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {method.icon ? (
                    <img 
                      src={method.icon} 
                      alt={method.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to icon component if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <IconComponent className={`w-8 h-8 ${method.icon ? 'hidden' : ''}`} />
                </div>

                {/* Method Details */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-lg font-semibold">{method.name}</h4>
                    {badge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {method.description}
                  </p>
                </div>

                {/* Selection Indicator */}
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Security Features */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Lock className="w-4 h-4" />
                    <span>Encrypted</span>
                  </div>
                  {method.type === 'mobile_money' || method.type === 'orange_money' ? (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Instant</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <span>Global</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <motion.div
                className="absolute inset-0 border-2 border-transparent rounded-xl"
                whileHover={{
                  borderColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.2)',
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.1)'
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Continue Button */}
      <motion.div
        className="flex justify-center pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={() => selectedMethod && onSelectMethod(selectedMethod)}
          disabled={!selectedMethod}
          className={`
            px-8 py-4 rounded-xl font-semibold text-lg flex items-center space-x-2 transition-all duration-200
            ${selectedMethod
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          whileHover={selectedMethod ? { scale: 1.05 } : {}}
          whileTap={selectedMethod ? { scale: 0.95 } : {}}
        >
          <span>Continue to Payment</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Regional Info */}
      {userRegion === 'africa' && (
        <motion.div
          className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm">
                Mobile Money Recommended for Africa
              </h4>
              <p className="text-xs text-green-700 dark:text-green-400">
                Fast, secure, and widely accepted across African countries
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
