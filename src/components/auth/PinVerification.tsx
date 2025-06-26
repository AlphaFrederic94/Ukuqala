import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Fingerprint, AlertCircle, CheckCircle, X, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import bcrypt from 'bcryptjs';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export default function PinVerification() {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [activeInput, setActiveInput] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get the return path from location state, localStorage, or default to home
  const getReturnDestination = () => {
    // First try location state
    if (location.state?.returnTo) {
      return location.state.returnTo;
    }

    // Then try localStorage (for page reloads)
    const storedDestination = localStorage.getItem('careai_pin_intended_destination');
    if (storedDestination && storedDestination !== '/pin-verify') {
      return storedDestination;
    }

    // Default to home
    return '/';
  };

  const returnTo = getReturnDestination();

  // Check lockout status on component mount
  useEffect(() => {
    const checkLockoutStatus = async () => {
      if (!user) return;

      try {
        const { data, error: dbError } = await supabase
          .from('app_pins')
          .select('attempts, last_attempt')
          .eq('user_id', user.id)
          .single();

        if (dbError) throw dbError;

        if (data.attempts >= MAX_ATTEMPTS && data.last_attempt) {
          const lockoutEnd = new Date(data.last_attempt).getTime() + LOCKOUT_DURATION;
          if (Date.now() < lockoutEnd) {
            setLockoutTime(lockoutEnd);
          } else {
            setAttemptsLeft(MAX_ATTEMPTS);
          }
        } else {
          setAttemptsLeft(MAX_ATTEMPTS - (data.attempts || 0));
        }
      } catch (err) {
        console.error('Error checking lockout status:', err);
      }
    };

    checkLockoutStatus();
  }, [user]);

  // Update lockout timer
  useEffect(() => {
    if (!lockoutTime) return;

    const updateTimer = () => {
      const now = Date.now();
      if (now >= lockoutTime) {
        setLockoutTime(null);
        setAttemptsLeft(MAX_ATTEMPTS);
        setLockoutTimer(null);
        return;
      }

      const timeLeft = lockoutTime - now;
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setLockoutTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setActiveInput(index);

      // Move to next input if value is entered
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
        setActiveInput(index + 1);
      }

      // Check if PIN is complete
      if (index === 4 && value) {
        handlePinComplete(newPin.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  };

  const handleNumpadClick = (digit: string) => {
    if (activeInput <= 4) {
      handleInputChange(activeInput, digit);
    }
  };

  const handleClearPin = () => {
    setPin(['', '', '', '', '']);
    setActiveInput(0);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const handlePinComplete = async (value: string) => {
    if (lockoutTime) return;

    setLoading(true);
    setError(null);

    try {
      // Get PIN data including attempts
      const { data, error: dbError } = await supabase
        .from('app_pins')
        .select('pin_hash, attempts, last_attempt')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        // No PIN found
        setError('PIN not set up. Please set up your PIN first.');
        setTimeout(() => navigate('/pin-setup'), 2000);
        return;
      }

      // Check for lockout
      if (data.attempts >= MAX_ATTEMPTS && data.last_attempt) {
        const lockoutEnd = new Date(data.last_attempt).getTime() + LOCKOUT_DURATION;
        if (Date.now() < lockoutEnd) {
          setLockoutTime(lockoutEnd);
          setPin(['', '', '', '', '']);
          return;
        }
      }

      // Verify PIN
      const isMatch = await bcrypt.compare(value, data.pin_hash);

      if (!isMatch) {
        // Increment attempts counter
        const newAttempts = (data.attempts || 0) + 1;
        await supabase
          .from('app_pins')
          .update({
            attempts: newAttempts,
            last_attempt: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        setAttemptsLeft(MAX_ATTEMPTS - newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const newLockoutEnd = Date.now() + LOCKOUT_DURATION;
          setLockoutTime(newLockoutEnd);
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }

        setPin(['', '', '', '', '']);
        setActiveInput(0);
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
        return;
      }

      // Success animation
      setSuccess(true);

      // Reset attempts on successful verification
      await supabase
        .from('app_pins')
        .update({
          attempts: 0,
          last_attempt: null,
          last_used: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      // Store verification time in local storage
      localStorage.setItem('careai_pin_verification_time', Date.now().toString());

      // Clear the intended destination since we're navigating there
      localStorage.removeItem('careai_pin_intended_destination');

      // Navigate after a short delay to show success animation
      setTimeout(() => {
        console.log('[PIN] Verification successful, navigating to:', returnTo);
        navigate(returnTo);
      }, 1000);

    } catch (err) {
      setError('Failed to verify PIN. Please try again.');
      console.error('PIN verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card with glass effect */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden transition-all duration-300 transform">
          {/* Header with wave design */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 pt-12 pb-20">
            <div className="absolute bottom-0 left-0 right-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-24">
                <path fill="#ffffff" fillOpacity="0.8" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,202.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Fingerprint className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          <div className="px-8 pt-6 pb-8 -mt-10 relative z-10">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Security Verification
            </h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">
              Please enter your 5-digit PIN to access your health dashboard
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Lockout message */}
            {lockoutTimer && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Account temporarily locked</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Too many failed attempts. Please try again in <span className="font-medium">{lockoutTimer}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5">
                  <div
                    className="bg-yellow-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: lockoutTime ? `${100 - ((lockoutTime - Date.now()) / LOCKOUT_DURATION) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-center">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">PIN verified successfully!</p>
                </div>
              </div>
            )}

            {/* PIN input fields */}
            <div className="flex justify-center space-x-3 mb-8">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative">
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setActiveInput(index)}
                    className={`w-12 h-14 text-center text-2xl border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${pin[index] ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'} ${activeInput === index ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${success ? 'border-green-500 dark:border-green-400 ring-green-500 dark:ring-green-400' : ''} ${error ? 'border-red-300 dark:border-red-700' : ''} ${lockoutTimer ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!!lockoutTimer || loading || success}
                    autoFocus={index === 0}
                  />
                  {pin[index] && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Attempts indicator */}
            {attemptsLeft !== null && !lockoutTimer && !success && (
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index < attemptsLeft ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                    ></div>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                </span>
              </div>
            )}

            {/* Toggle numpad button */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowNumpad(!showNumpad)}
                className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
                disabled={!!lockoutTimer || loading || success}
              >
                {showNumpad ? 'Hide keypad' : 'Show keypad'}
              </button>
            </div>

            {/* Numpad */}
            {showNumpad && (
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpadClick(num.toString())}
                      className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      disabled={!!lockoutTimer || loading || success}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={!!lockoutTimer || loading || success}
                  >
                    <X className="h-5 w-5 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadClick('0')}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={!!lockoutTimer || loading || success}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pin.every(digit => digit !== '')) {
                        handlePinComplete(pin.join(''));
                      }
                    }}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${pin.every(digit => digit !== '') ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                    disabled={!pin.every(digit => digit !== '') || !!lockoutTimer || loading || success}
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && !success && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Verifying...</span>
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <Shield className="h-3 w-3 mr-1" />
            Secured with end-to-end encryption
          </p>
        </div>
      </div>
    </div>
  );
}
