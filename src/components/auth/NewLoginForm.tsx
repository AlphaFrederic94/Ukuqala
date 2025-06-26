import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, AlertCircle, Check, RefreshCw, Lock, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NewAuthLayout from './NewAuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleIcon from '../icons/GoogleIcon';

export default function NewLoginForm() {
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
  const { signIn, signInWithGoogle } = useAuth();

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

    // Simpler and more reliable email regex
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
      await signIn(email, password);
      setSuccess('Login successful! Redirecting...');

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (err: any) {
      console.error('Login form error:', err);
      if (err.message && err.message.includes('Invalid login credentials')) {
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

  return (
    <NewAuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue your health journey"
      alternateLink={{
        text: "Don't have an account?",
        to: "/register",
        label: "Sign up"
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

        <AnimatePresence>
          {success && (
            <motion.div
              className="auth-alert auth-alert-success"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="auth-alert-icon" />
              <p className="auth-alert-text">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <motion.div className="auth-input-group" variants={itemVariants}>
            <label htmlFor="email" className="auth-input-label">
              Email address
            </label>
            <div className="auth-input-wrapper group">
              <Mail className={`auth-input-icon group-focus-within:text-blue-500 transition-colors ${
                emailValid === true ? 'text-green-500' :
                emailValid === false ? 'text-red-500' : ''
              }`} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`auth-input ${
                  emailValid === true ? 'auth-input-valid' :
                  emailValid === false ? 'auth-input-invalid' : ''
                }`}
                placeholder="Enter your email"
              />
              {emailValid === true && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <Check className="auth-input-valid-icon" />
                </motion.div>
              )}
              <div className="auth-input-highlight"></div>
            </div>
            {emailValid === false && (
              <motion.p
                className="text-red-500 text-xs mt-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                Please enter a valid email address
              </motion.p>
            )}
          </motion.div>

          <motion.div className="auth-input-group" variants={itemVariants}>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="auth-input-label">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="auth-forgot-password-link group"
              >
                <span>Forgot password?</span>
                <Key className="w-3 h-3 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
            <div className="auth-input-wrapper group">
              <Lock className="auth-input-icon group-focus-within:text-blue-500 transition-colors" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Enter your password"
              />
              <div className="auth-input-highlight"></div>
            </div>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign in</span>
                </>
              )}
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
                  <span>Sign in with Google</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </NewAuthLayout>
  );
}
