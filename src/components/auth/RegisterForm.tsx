import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import TermsAndConditions from './TermsAndConditions';
import zxcvbn from 'zxcvbn';
import { userService } from '../../lib/userService';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { signUp } = useAuth();

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
      console.log('Registration form submitting with email:', email);
      const { error, user } = await signUp(email, password, fullName);

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      // Note: userService.initializeNewUser is already called in AuthContext.signUp
      // so we don't need to call it again here

      console.log('Registration successful, navigating to onboarding');
      navigate('/onboarding');
    } catch (err) {
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

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your journey to better health monitoring"
      alternateLink={{
        text: "Already have an account?",
        to: "/login",
        label: "Sign in"
      }}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full name
          </label>
          <div className="mt-1">
            <input
              id="full-name"
              name="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Create a password"
            />
            <div className="mt-2">
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength + 1) * 20}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {passwordStrength === 0 && 'Very weak'}
                {passwordStrength === 1 && 'Weak'}
                {passwordStrength === 2 && 'Fair'}
                {passwordStrength === 3 && 'Strong'}
                {passwordStrength === 4 && 'Very strong'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Create account
              </>
            )}
          </button>
        </div>
      </form>

      {showTerms && (
        <TermsAndConditions
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
        />
      )}
    </AuthLayout>
  );
}
