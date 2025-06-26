import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  Calendar,
  Key,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PricingPlan, PaymentMethod, paymentService } from '../../lib/paymentService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface PaymentFormProps {
  plan: PricingPlan;
  paymentMethod: PaymentMethod;
  onSubmit: (data: any) => void;
  userRegion: string;
}

interface FormData {
  // Card details
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardholderName: string;
  
  // Mobile money details
  phoneNumber: string;
  countryCode: string;
  
  // Common
  email: string;
  agreeToTerms: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  plan,
  paymentMethod,
  onSubmit,
  userRegion
}) => {
  const [formData, setFormData] = useState<FormData>({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    phoneNumber: '',
    countryCode: '+237',
    email: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showCvc, setShowCvc] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (paymentMethod.type === 'stripe') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }
      if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      }
      if (!formData.cvc || formData.cvc.length < 3) {
        newErrors.cvc = 'Please enter a valid CVC';
      }
      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = 'Please enter the cardholder name';
      }
    } else {
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Please enter your phone number';
      } else if (!paymentService.validatePhoneNumber(formData.phoneNumber, formData.countryCode)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Please agree to the terms and conditions' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsValidating(true);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const submitData = paymentMethod.type === 'stripe' 
      ? {
          card_details: {
            number: formData.cardNumber.replace(/\s/g, ''),
            expiry: formData.expiryDate,
            cvc: formData.cvc,
            name: formData.cardholderName
          },
          email: formData.email
        }
      : {
          phone_number: formData.countryCode + formData.phoneNumber,
          email: formData.email
        };

    onSubmit(submitData);
    setIsValidating(false);
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

  const fieldVariants = {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h3 
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Complete Your Payment
        </motion.h3>
        <motion.p 
          className="text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Secure payment for your {plan.name} plan
        </motion.p>
      </div>

      {/* Payment Summary */}
      <motion.div
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              {paymentMethod.type === 'stripe' ? (
                <CreditCard className="w-6 h-6 text-white" />
              ) : (
                <Smartphone className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold">{paymentMethod.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{plan.name} Plan</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(plan.price_xaf)}
            </div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <Shield className="w-4 h-4" />
          <span>256-bit SSL encryption • Your payment is secure</span>
        </div>
      </motion.div>

      {/* Payment Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {paymentMethod.type === 'stripe' ? (
          // Credit Card Form
          <>
            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Cardholder Name
              </label>
              <Input
                type="text"
                value={formData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="John Doe"
                error={errors.cardholderName}
                className="text-lg py-3"
              />
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Card Number
              </label>
              <Input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                error={errors.cardNumber}
                className="text-lg py-3 font-mono"
              />
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={fieldVariants}>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Expiry Date
                </label>
                <Input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  error={errors.expiryDate}
                  className="text-lg py-3 font-mono"
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <label className="block text-sm font-medium mb-2">
                  <Key className="w-4 h-4 inline mr-2" />
                  CVC
                </label>
                <div className="relative">
                  <Input
                    type={showCvc ? "text" : "password"}
                    value={formData.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    error={errors.cvc}
                    className="text-lg py-3 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCvc(!showCvc)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCvc ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        ) : (
          // Mobile Money Form
          <>
            <motion.div variants={fieldVariants}>
              <label className="block text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="+237">🇨🇲 +237</option>
                  <option value="+234">🇳🇬 +234</option>
                  <option value="+233">🇬🇭 +233</option>
                  <option value="+254">🇰🇪 +254</option>
                  <option value="+256">🇺🇬 +256</option>
                </select>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                  placeholder="6 XX XX XX XX"
                  error={errors.phoneNumber}
                  className="flex-1 text-lg py-3 font-mono"
                />
              </div>
            </motion.div>

            <motion.div 
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              variants={fieldVariants}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                    Mobile Money Instructions
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                    You'll receive an SMS prompt to authorize the payment. Please ensure your phone is nearby and has sufficient balance.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Email Field */}
        <motion.div variants={fieldVariants}>
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john@example.com"
            error={errors.email}
            className="text-lg py-3"
          />
        </motion.div>

        {/* Terms and Conditions */}
        <motion.div variants={fieldVariants}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms as string}</p>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={fieldVariants}>
          <Button
            type="submit"
            disabled={isValidating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl"
          >
            {isValidating ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Pay {formatPrice(plan.price_xaf)}</span>
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
};
