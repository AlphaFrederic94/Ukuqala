import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, Info, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [showInfoTip, setShowInfoTip] = useState(false);
  const { resetPassword } = useAuth();

  // Validate email format
  useEffect(() => {
    if (!email) {
      setEmailValid(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Enhanced validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (emailValid === false) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);

      // Clear form after successful submission
      if (!success) {
        setTimeout(() => {
          // This timeout ensures the animation plays fully before resetting
          setEmail('');
          setEmailValid(null);
        }, 500);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email';

      // Enhanced error messages
      if (err.message) {
        if (err.message.includes('not found')) {
          errorMessage = 'No account found with this email address';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'Too many attempts. Please try again later';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle info tooltip toggle
  const toggleInfoTip = () => {
    setShowInfoTip(prev => !prev);
  };

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 1
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const successItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you a link to reset your password"
      alternateLink={{
        text: "Remember your password?",
        to: "/login",
        label: "Sign in"
      }}
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={successVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center shadow-sm"
          >
            <motion.div variants={iconVariants} className="mb-4">
              <div className="relative inline-flex">
                <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-800 animate-ping opacity-30"></div>
                <div className="relative rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.h3
              variants={successItemVariants}
              className="text-xl font-semibold text-green-800 dark:text-green-300 mb-3"
            >
              Reset Link Sent
            </motion.h3>

            <motion.div variants={successItemVariants} className="mb-4">
              <p className="text-green-700 dark:text-green-400 mb-2">
                We've sent a password reset link to:
              </p>
              <div className="bg-white dark:bg-gray-800 py-2 px-4 rounded-md inline-block font-medium text-green-800 dark:text-green-300 shadow-sm">
                {email}
              </div>
            </motion.div>

            <motion.div variants={successItemVariants} className="text-sm text-green-600 dark:text-green-500 mb-6 bg-green-100 dark:bg-green-900/40 p-3 rounded-md">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-left">
                  Please check your email and follow the instructions to reset your password.
                  If you don't see the email, check your spam folder.
                </p>
              </div>
            </motion.div>

            <motion.div variants={successItemVariants}>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <button
                    type="button"
                    onClick={toggleInfoTip}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    Help
                  </button>
                </div>

                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${
                      emailValid === true ? 'text-green-500' :
                      emailValid === false ? 'text-red-500' :
                      'text-gray-400'
                    }`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                      emailValid === true ? 'border-green-500 focus:ring-green-500 focus:border-green-500' :
                      emailValid === false ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                      'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                    placeholder="Enter your email"
                  />

                  {emailValid === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showInfoTip && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                    >
                      Enter the email address associated with your account. We'll send a secure link to reset your password.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={loading || emailValid === false}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 relative overflow-hidden"
                >
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      <span>Sending Reset Link...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      <span>Send Reset Link</span>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
