import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, AlertCircle, Check, RefreshCw, Lock, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleIcon from '../icons/GoogleIcon';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();

  // Check for OAuth redirect success
  useEffect(() => {
    // Check if we have a successful OAuth redirect
    const params = new URLSearchParams(location.search);
    const authSuccess = params.get('auth_success');

    if (authSuccess === 'true') {
      setSuccess('Successfully signed in with Google!');
      // Remove the query parameter to avoid showing the message on refresh
      navigate(location.pathname, { replace: true });

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    }
  }, [location, navigate]);

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
    setSuccess(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Login form submitting with email:', email);
      await signIn(email, password);
      console.log('Login successful, navigating to home');
      navigate('/home');
    } catch (err: any) {
      console.error('Login form error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
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

  const successIconVariants = {
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
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      alternateLink={{
        text: "Don't have an account?",
        to: "/register",
        label: "Sign up"
      }}
    >
      <motion.form
        key="login-form"
        className="space-y-6"
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
            <AnimatePresence>
              {error && (
                <motion.div
                  className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 rounded-md shadow-sm"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4 rounded-md shadow-sm"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start">
                    <motion.div
                      variants={successIconVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex-shrink-0 mt-0.5"
                    >
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    </motion.div>
                    <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
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
              } rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors`}
              placeholder="Enter your email"
            />

            {emailValid === true && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              <span>Forgot password?</span>
              <Key className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
              placeholder="Enter your password"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                <span>Signing in...</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                <span>Sign in</span>
              </motion.div>
            )}

            {/* Animated background effect for loading state */}
            {loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-blue-700/0"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            )}
          </motion.button>
        </motion.div>

        <motion.div className="relative" variants={itemVariants}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || redirecting}
            className={`w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${
              googleLoading || redirecting
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 relative overflow-hidden`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {googleLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <RefreshCw className="animate-spin w-5 h-5 mr-2" />
                {redirecting ? 'Redirecting...' : 'Connecting...'}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
              </motion.div>
            )}

            {/* Animated background effect for redirecting state */}
            {redirecting && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-500/0"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            )}
          </motion.button>

          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            By signing in with Google, you'll get access to all features without creating a separate password.
          </p>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
}