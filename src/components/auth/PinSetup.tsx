import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, Fingerprint, AlertCircle, CheckCircle, X, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import bcrypt from 'bcryptjs';
import { motion, AnimatePresence } from 'framer-motion';

export default function PinSetup() {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [showNumpad, setShowNumpad] = useState(false);
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (index: number, value: string, currentPin: string[], setPinFunction: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...currentPin];
      newPin[index] = value;
      setPinFunction(newPin);
      setActiveInput(index);

      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
        setActiveInput(index + 1);
      }

      if (index === 4 && value) {
        if (step === 'create') {
          // Add a small delay for better UX
          setTimeout(() => {
            const enteredPin = newPin.join('');
            setPin(newPin);
            setStep('confirm');
            setConfirmPin(['', '', '', '', '']);
            setActiveInput(0);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
          }, 300);
        } else {
          const enteredConfirmPin = newPin.join('');
          const originalPin = pin.join('');
          if (enteredConfirmPin === originalPin) {
            handlePinComplete(enteredConfirmPin);
          } else {
            setError('PINs do not match. Please try again.');
            // Add a small delay before resetting
            setTimeout(() => {
              setStep('create');
              setPin(['', '', '', '', '']);
              setConfirmPin(['', '', '', '', '']);
              setActiveInput(0);
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }, 1000);
          }
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, currentPin: string[]) => {
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  };

  const handleNumpadClick = (digit: string) => {
    const currentPinArray = step === 'create' ? pin : confirmPin;
    const setPinFunction = step === 'create' ? setPin : setConfirmPin;

    if (activeInput <= 4) {
      handleInputChange(activeInput, digit, currentPinArray, setPinFunction);
    }
  };

  const handleClearPin = () => {
    if (step === 'create') {
      setPin(['', '', '', '', '']);
    } else {
      setConfirmPin(['', '', '', '', '']);
    }
    setActiveInput(0);
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  };

  const handlePinComplete = async (finalPin: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // First check if PIN already exists
      const { data: existingPin, error: checkError } = await supabase
        .from('app_pins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Hash the PIN with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(finalPin, salt);

      if (existingPin) {
        // Update existing PIN
        const { error: updateError } = await supabase
          .from('app_pins')
          .update({
            pin_hash: hashedPin,
            attempts: 0,
            last_attempt: null,
            last_used: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new PIN
        const { error: insertError } = await supabase
          .from('app_pins')
          .insert([
            {
              user_id: user.id,
              pin_hash: hashedPin,
              attempts: 0,
              last_attempt: null,
              last_used: new Date().toISOString()
            }
          ]);

        if (insertError) throw insertError;
      }

      // Show success state before navigating
      setSuccess(true);

      // Store verification time in local storage
      localStorage.setItem('careai_pin_verification_time', Date.now().toString());

      // Navigate after a short delay to show success animation
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('PIN setup error:', err);
      setError('Failed to set PIN. Please try again.');
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
                <Lock className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          <div className="px-8 pt-6 pb-8 -mt-10 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {step === 'create' ? 'Create Your Security PIN' : 'Confirm Your PIN'}
                </h2>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {step === 'create'
                    ? 'Choose a 5-digit PIN to secure your health data'
                    : 'Please enter the same PIN again to confirm'
                  }
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </motion.div>
            )}

            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-center"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">PIN set successfully!</p>
                </div>
              </motion.div>
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
                    value={step === 'create' ? pin[index] : confirmPin[index]}
                    onChange={(e) => handleInputChange(
                      index,
                      e.target.value,
                      step === 'create' ? pin : confirmPin,
                      step === 'create' ? setPin : setConfirmPin
                    )}
                    onKeyDown={(e) => handleKeyDown(
                      index,
                      e,
                      step === 'create' ? pin : confirmPin
                    )}
                    onFocus={() => setActiveInput(index)}
                    className={`w-12 h-14 text-center text-2xl border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                      (step === 'create' ? pin[index] : confirmPin[index]) ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'
                    } ${activeInput === index ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} ${
                      success ? 'border-green-500 dark:border-green-400 ring-green-500 dark:ring-green-400' : ''
                    } ${error ? 'border-red-300 dark:border-red-700' : ''} ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={loading || success}
                    autoFocus={index === 0}
                  />
                  {(step === 'create' ? pin[index] : confirmPin[index]) && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Toggle numpad button */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowNumpad(!showNumpad)}
                className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
                disabled={loading || success}
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
                      disabled={loading || success}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={loading || success}
                  >
                    <X className="h-5 w-5 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadClick('0')}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    disabled={loading || success}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPinArray = step === 'create' ? pin : confirmPin;
                      if (currentPinArray.every(digit => digit !== '')) {
                        if (step === 'create') {
                          setStep('confirm');
                          setConfirmPin(['', '', '', '', '']);
                          setActiveInput(0);
                          setTimeout(() => inputRefs.current[0]?.focus(), 100);
                        } else {
                          const enteredConfirmPin = confirmPin.join('');
                          const originalPin = pin.join('');
                          if (enteredConfirmPin === originalPin) {
                            handlePinComplete(enteredConfirmPin);
                          } else {
                            setError('PINs do not match. Please try again.');
                            setTimeout(() => {
                              setStep('create');
                              setPin(['', '', '', '', '']);
                              setConfirmPin(['', '', '', '', '']);
                              setActiveInput(0);
                              setTimeout(() => inputRefs.current[0]?.focus(), 100);
                            }, 1000);
                          }
                        }
                      }
                    }}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                      (step === 'create' ? pin : confirmPin).every(digit => digit !== '')
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!(step === 'create' ? pin : confirmPin).every(digit => digit !== '') || loading || success}
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
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{step === 'confirm' ? 'Setting up PIN...' : 'Processing...'}</span>
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
