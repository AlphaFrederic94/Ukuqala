import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Star, 
  Zap, 
  Users, 
  Building, 
  Crown,
  Sparkles,
  FileText,
  MessageCircle,
  Calendar,
  BarChart3,
  Shield,
  Headphones,
  Globe
} from 'lucide-react';
import { PricingPlan } from '../../lib/paymentService';

interface PricingCardsProps {
  plans: PricingPlan[];
  onSelectPlan: (plan: PricingPlan) => void;
  userRegion: string;
}

const planIcons = {
  free: FileText,
  basic: Zap,
  premium: Crown,
  enterprise: Building
};

const planColors = {
  free: 'from-gray-500 to-gray-600',
  basic: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600',
  enterprise: 'from-gold-500 to-gold-600'
};

const planBorders = {
  free: 'border-gray-200 dark:border-gray-700',
  basic: 'border-blue-200 dark:border-blue-800',
  premium: 'border-purple-200 dark:border-purple-800',
  enterprise: 'border-yellow-200 dark:border-yellow-800'
};

export const PricingCards: React.FC<PricingCardsProps> = ({ 
  plans, 
  onSelectPlan, 
  userRegion 
}) => {
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
      y: 50,
      scale: 0.9
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

  const formatPrice = (plan: PricingPlan) => {
    if (plan.price_xaf === 0) return 'Free';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(plan.price_xaf);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h3 
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Choose Your Plan
        </motion.h3>
        <motion.p 
          className="text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Globe className="w-4 h-4" />
          <span>
            {userRegion === 'africa' 
              ? 'Special pricing for Africa - Up to 60% off!' 
              : 'Premium healthcare features for your region'
            }
          </span>
        </motion.p>
      </div>

      {/* Pricing Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {plans.map((plan) => {
          const IconComponent = planIcons[plan.id as keyof typeof planIcons] || FileText;
          const gradientColor = planColors[plan.id as keyof typeof planColors] || planColors.basic;
          const borderColor = planBorders[plan.id as keyof typeof planBorders] || planBorders.basic;
          
          return (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 
                ${borderColor} overflow-hidden cursor-pointer group
                ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
              `}
              onClick={() => onSelectPlan(plan)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Star className="w-3 h-3 inline mr-1" />
                  POPULAR
                </motion.div>
              )}

              {/* Background Animation */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                initial={false}
              />

              <div className="p-6 relative z-10">
                {/* Icon and Title */}
                <div className="text-center mb-6">
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${gradientColor} rounded-2xl flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <motion.div
                    className="text-3xl font-bold mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    {formatPrice(plan)}
                  </motion.div>
                  {plan.price_xaf > 0 && (
                    <p className="text-gray-500 text-sm">per month</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Document Limit Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${gradientColor} bg-opacity-10 border border-current border-opacity-20`}>
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {plan.document_limit === -1 
                        ? 'Unlimited documents' 
                        : `${plan.document_limit} documents`
                      }
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  className={`
                    w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
                    ${plan.id === 'free' 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-default' 
                      : `bg-gradient-to-r ${gradientColor} text-white hover:shadow-lg transform hover:-translate-y-0.5`
                    }
                  `}
                  whileHover={plan.id !== 'free' ? { scale: 1.02 } : {}}
                  whileTap={plan.id !== 'free' ? { scale: 0.98 } : {}}
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Choose Plan'}
                </motion.button>
              </div>

              {/* Hover Effect */}
              <motion.div
                className="absolute inset-0 border-2 border-transparent rounded-2xl"
                whileHover={{
                  borderColor: plan.id === 'free' ? 'transparent' : 'rgba(147, 51, 234, 0.3)',
                  boxShadow: plan.id === 'free' ? 'none' : '0 20px 40px rgba(147, 51, 234, 0.1)'
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Regional Pricing Info */}
      {userRegion === 'africa' && (
        <motion.div
          className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-300">
                Special African Pricing! 🌍
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                We're committed to making healthcare accessible across Africa with our lowest regional pricing.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
