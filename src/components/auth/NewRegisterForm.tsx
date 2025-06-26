import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NewAuthLayout from './NewAuthLayout';
import EnhancedTermsAndConditions from './EnhancedTermsAndConditions';
import zxcvbn from 'zxcvbn';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleIcon from '../icons/GoogleIcon';

export default function NewRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (passwordStrength < 2) {
      setError('Please choose a stronger password');
      return false;
    }

    return true;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(zxcvbn(value).score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    setShowTerms(false);
    setLoading(true);

    try {
      const { error, user } = await signUp(email, password, fullName);

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      // Navigate to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      console.error('Registration form error:', err);
      if (err.message && err.message.includes('already registered')) {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      setRedirecting(true);
      // Show loading state for a moment before redirect
      setTimeout(async () => {
        try {
          await signInWithGoogle();
          // The redirect will happen automatically
        } catch (err: any) {
          setRedirecting(false);
          setGoogleLoading(false);

          let errorMessage = 'Failed to sign in with Google';

          if (err instanceof Error) {
            if (err.message.includes('popup')) {
              errorMessage = 'Google sign-in popup was closed. Please try again.';
            } else if (err.message.includes('network')) {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.message.includes('account-exists-with-different-credential')) {
              errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
            } else {
              errorMessage = err.message;
            }
          }

          setError(errorMessage);
        }
      }, 500);
    } catch (err: any) {
      setGoogleLoading(false);
      setRedirecting(false);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-blue-500';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Very weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Strong';
      case 4: return 'Very strong';
      default: return '';
    }
  };

  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
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
        damping: 25
      }
    }
  };

  return (
    <NewAuthLayout
      title="Create Your Account"
      subtitle="Join Ukuqala and start your journey to better health"
      alternateLink={{
        text: "Already have an account?",
        to: "/login",
        label: "Sign in"
      }}
    >
      <motion.div
        className="auth-form"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {error && (
            <motion.div
              className="auth-alert auth-alert-error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="auth-alert-icon" />
              <p className="auth-alert-text">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <motion.div className="auth-input-group" variants={itemVariants}>
            <label htmlFor="full-name" className="auth-input-label">
              Full name
            </label>
            <div className="auth-input-wrapper group">
              <User className="auth-input-icon group-focus-within:text-blue-500 transition-colors" />
              <input
                id="full-name"
                name="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="auth-input"
                placeholder="Enter your full name"
              />
              <div className="auth-input-highlight"></div>
            </div>
          </motion.div>

          <motion.div className="auth-input-group" variants={itemVariants}>
            <label htmlFor="email" className="auth-input-label">
              Email address
            </label>
            <div className="auth-input-wrapper group">
              <Mail className="auth-input-icon group-focus-within:text-blue-500 transition-colors" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="Enter your email"
              />
              <div className="auth-input-highlight"></div>
            </div>
          </motion.div>

          <motion.div className="auth-input-group" variants={itemVariants}>
            <label htmlFor="password" className="auth-input-label">
              Password
            </label>
            <div className="auth-input-wrapper group">
              <Lock className="auth-input-icon group-focus-within:text-blue-500 transition-colors" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="auth-input"
                placeholder="Create a password"
              />
              <div className="auth-input-highlight"></div>
            </div>
            {password && (
              <motion.div
                className="password-strength-meter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="password-strength-bar">
                  <motion.div
                    className={`password-strength-progress ${getPasswordStrengthColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength + 1) * 20}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="password-strength-text text-xs">
                    {getPasswordStrengthText()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {passwordStrength < 2 ? 'Add numbers and symbols for a stronger password' :
                     passwordStrength < 4 ? 'Good password!' : 'Excellent password!'}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6">
            <motion.button
              type="submit"
              disabled={loading}
              className="auth-submit-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin w-5 h-5" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create account</span>
                </>
              )}
              <motion.span
                className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 opacity-0"
                animate={{
                  opacity: [0, 0.1, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="auth-divider">
            <div className="auth-divider::before"></div>
            <span className="auth-divider-text">Or continue with</span>
            <div className="auth-divider::after"></div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || redirecting}
              className="auth-social-button"
              whileHover={{ scale: 1.02, backgroundColor: "var(--bg-secondary)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {googleLoading ? (
                <>
                  <RefreshCw className="animate-spin w-5 h-5" />
                  <span>{redirecting ? 'Redirecting...' : 'Connecting...'}</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="auth-social-icon" />
                  <span>Sign up with Google</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>

      <AnimatePresence>
        {showTerms && (
          <EnhancedTermsAndConditions
            onAccept={handleAcceptTerms}
            onDecline={handleDeclineTerms}
          />
        )}
      </AnimatePresence>
    </NewAuthLayout>
  );
}
