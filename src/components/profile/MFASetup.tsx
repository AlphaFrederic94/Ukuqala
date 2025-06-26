import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  AlertCircle,
  Check,
  Smartphone,
  QrCode,
  RefreshCw,
  Copy,
  Info,
  ChevronLeft,
  ChevronRight,
  Lock,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeErrorBoundary from '../ui/QRCodeErrorBoundary';
import '../../styles/mfa-setup.css';

interface MFASetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'recovery'>('intro');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<boolean>(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null); // Store the factor ID for verification
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [secretCopied, setSecretCopied] = useState(false);
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);
  const [currentDigit, setCurrentDigit] = useState<number>(0);
  const [verificationDigits, setVerificationDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showQRAnimation, setShowQRAnimation] = useState(false);

  const { setupMFA, verifyMFA, isMFAEnabled } = useAuth();

  // Generate mock recovery codes (in a real app, these would come from the backend)
  const generateRecoveryCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      // Generate a random 10-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      // Format as XXXX-XXXX-XXXX
      codes.push(code.slice(0, 4) + '-' + code.slice(4, 8) + '-' + code.slice(8, 12));
    }
    return codes;
  };

  // Check if MFA is already enabled
  useEffect(() => {
    if (isMFAEnabled) {
      setSuccess('Multi-factor authentication is already enabled for your account');
    }
  }, [isMFAEnabled]);

  // Handle copy to clipboard functionality
  const copyToClipboard = (text: string, type: 'secret' | 'recoveryCodes') => {
    navigator.clipboard.writeText(text).then(
      () => {
        if (type === 'secret') {
          setSecretCopied(true);
          setTimeout(() => setSecretCopied(false), 2000);
        } else {
          setRecoveryCodesCopied(true);
          setTimeout(() => setRecoveryCodesCopied(false), 2000);
        }
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Handle digit input for verification code
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting a full code
      if (value.length === 6 && /^\d+$/.test(value)) {
        const digits = value.split('');
        setVerificationDigits(digits);
        setVerificationCode(value);
        // Focus the last input
        inputRefs.current[5]?.focus();
        return;
      }
      value = value.slice(0, 1);
    }

    if (value && !/^\d+$/.test(value)) {
      return; // Only allow digits
    }

    const newDigits = [...verificationDigits];
    newDigits[index] = value;
    setVerificationDigits(newDigits);
    setVerificationCode(newDigits.join(''));

    // Auto-advance to next input if a digit was entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setCurrentDigit(index + 1);
    }
  };

  // Handle backspace in digit input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationDigits[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
      setCurrentDigit(index - 1);
    }
  };

  // Generate a QR code URL from the secret key
  const generateQRCodeURL = (secret: string): string => {
    try {
      // Format: otpauth://totp/App:user@example.com?secret=SECRET&issuer=App
      const appName = 'CareAI';
      const account = 'user'; // Generic account name
      const encodedSecret = encodeURIComponent(secret);
      const encodedIssuer = encodeURIComponent(appName);

      return `otpauth://totp/${encodedIssuer}:${account}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
    } catch (error) {
      console.error('Error generating QR code URL:', error);
      return '';
    }
  };

  const handleStartSetup = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await setupMFA();
      if (error) throw error;

      if (data && data.totp) {
        console.log('MFA setup data:', data);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        console.log('Factor ID set:', data.id);

        // Generate recovery codes
        setRecoveryCodes(generateRecoveryCodes());

        // Try to set the QR code, but handle potential errors
        try {
          // First try to use the QR code from the API if it's valid
          if (data.totp.qr_code &&
              data.totp.qr_code.length < 1000 && // Limit QR code length
              data.totp.qr_code.startsWith('otpauth://')) {
            setQrCode(data.totp.qr_code);
            setQrCodeError(false);
          } else {
            // If API QR code is invalid, generate our own from the secret
            const generatedQRCode = generateQRCodeURL(data.totp.secret);
            if (generatedQRCode) {
              setQrCode(generatedQRCode);
              setQrCodeError(false);
            } else {
              // Both methods failed, set error state
              setQrCodeError(true);
            }
          }
        } catch (qrError) {
          console.error('Error setting QR code:', qrError);
          setQrCodeError(true);
        }

        // Reset verification digits
        setVerificationDigits(['', '', '', '', '', '']);
        setVerificationCode('');

        // Show QR animation
        setShowQRAnimation(true);
        setTimeout(() => {
          setShowQRAnimation(false);
        }, 1000);

        setStep('setup');
      } else {
        throw new Error('Failed to generate MFA setup information');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to set up MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('intro');
    setQrCode(null);
    setQrCodeError(false);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
    setError(null);
    setSuccess(null);
    setLoading(false);
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);

    if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setError('Please enter a valid 6-digit verification code');
      setLoading(false);
      return;
    }

    try {
      if (!factorId) {
        console.error('No factor ID available for verification');
        setError('Setup information is missing. Please restart the MFA setup process.');
        setLoading(false);
        return;
      }

      console.log('Verifying MFA with factor ID:', factorId);
      const { error } = await verifyMFA(factorId, verificationCode);
      if (error) throw error;

      setSuccess('Multi-factor authentication has been successfully enabled');

      // Show recovery codes after successful verification
      setStep('recovery');

      // Call success callback if provided, but only after showing recovery codes
      if (onSuccess) {
        // We'll call this when the user clicks "Done" on the recovery codes screen
      }
    } catch (err: any) {
      let errorMessage = 'Failed to verify MFA code';

      if (err instanceof Error) {
        if (err.message.includes('invalid')) {
          errorMessage = 'Invalid verification code. Please try again.';
        } else if (err.message.includes('expired')) {
          errorMessage = 'Verification code has expired. Please generate a new code.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // Shake animation for incorrect code
      const inputs = inputRefs.current;
      inputs.forEach(input => {
        if (input) {
          input.classList.add('shake-animation');
          setTimeout(() => {
            input.classList.remove('shake-animation');
          }, 500);
        }
      });

      // Clear the verification code
      setVerificationDigits(['', '', '', '', '', '']);
      setVerificationCode('');
      setCurrentDigit(0);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 10);
    } finally {
      setLoading(false);
    }
  };

  // Handle completion after showing recovery codes
  const handleComplete = () => {
    setStep('verify');

    // Call success callback if provided
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 500);
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
        damping: 25
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

  const qrCodeVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5
      }
    },
    pulse: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0px 0px 0px rgba(59, 130, 246, 0)",
        "0px 0px 20px rgba(59, 130, 246, 0.5)",
        "0px 0px 0px rgba(59, 130, 246, 0)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop"
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
        damping: 20,
        delay: 0.2
      }
    }
  };

  const recoveryCodeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4 shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Multi-Factor Authentication</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {['intro', 'setup', 'recovery', 'verify'].map((s, index) => (
            <div key={s} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['intro', 'setup', 'recovery', 'verify'].indexOf(step) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {index === 0 && <Info className="w-4 h-4" />}
                {index === 1 && <QrCode className="w-4 h-4" />}
                {index === 2 && <Key className="w-4 h-4" />}
                {index === 3 && <Check className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 ${
                ['intro', 'setup', 'recovery', 'verify'].indexOf(step) >= index
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {index === 0 && 'Info'}
                {index === 1 && 'Setup'}
                {index === 2 && 'Backup'}
                {index === 3 && 'Done'}
              </span>
            </div>
          ))}
          <div className="absolute left-0 right-0 flex justify-center">
            <div className="w-2/3 bg-gray-200 dark:bg-gray-700 h-1 absolute top-4 -z-10">
              <div
                className="bg-blue-600 h-1 transition-all duration-500"
                style={{
                  width:
                    step === 'intro' ? '0%' :
                    step === 'setup' ? '33%' :
                    step === 'recovery' ? '66%' :
                    '100%'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Restart setup process
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">Why use multi-factor authentication?</h4>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>Adds an extra layer of security to your account</li>
                <li>Protects against unauthorized access even if your password is compromised</li>
                <li>Verifies your identity using something you know (password) and something you have (mobile device)</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleStartSetup}
                disabled={loading || isMFAEnabled}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : isMFAEnabled ? (
                  'MFA Already Enabled'
                ) : (
                  'Set Up MFA'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'setup' && secret && (
          <motion.div
            key="setup"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Set up your authenticator app</h4>

              <motion.div
                variants={itemVariants}
                className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 text-left shadow-sm"
              >
                <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Instructions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-200 space-y-2">
                  <li>Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)</li>
                  {!qrCodeError ? (
                    <li>Scan the QR code below or enter the secret key manually</li>
                  ) : (
                    <li>Add a new account or select "Enter setup key"</li>
                  )}
                  <li>Use "CareAI" as the account name</li>
                  <li>Once added, enter the 6-digit code from your app below</li>
                </ol>
              </motion.div>

              {!qrCodeError && qrCode ? (
                <motion.div
                  variants={itemVariants}
                  className="mb-6"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    <motion.div
                      className="inline-block p-4 bg-white rounded-lg shadow-md"
                      variants={qrCodeVariants}
                      animate={showQRAnimation ? "pulse" : "visible"}
                    >
                      {/* Wrap QRCodeSVG in error boundary */}
                      <QRCodeErrorBoundary>
                        <div className="relative">
                          <QRCodeSVG
                            value={qrCode}
                            size={200}
                            level="M" // Medium error correction level
                            includeMargin={true}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                              <img
                                src="/images/logo.png"
                                alt="CareAI Logo"
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </QRCodeErrorBoundary>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="mb-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md"
                >
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p>QR code not available. Please use the manual method below.</p>
                  </div>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="mt-4"
              >
                <div className="flex items-center justify-center mb-2">
                  <QrCode className="w-6 h-6 text-gray-500 mr-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secret Key (for manual entry):
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-sm break-all mb-4 shadow-sm">
                    {secret}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secret || '', 'secret')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    aria-label="Copy secret key"
                  >
                    {secretCopied ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After setting up your authenticator app, enter the 6-digit verification code displayed in the app:
              </p>

              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Verification Code
                </label>

                {/* 6-digit input boxes */}
                <div className="flex justify-center space-x-2 mb-4">
                  {verificationDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setCurrentDigit(index)}
                      className={`w-12 h-14 text-center text-xl font-semibold border ${
                        currentDigit === index
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all`}
                    />
                  ))}
                </div>

                <style jsx>{`
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); }
                    40%, 80% { transform: translateX(5px); }
                  }
                  .shake-animation {
                    animation: shake 0.5s ease-in-out;
                  }
                `}</style>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex justify-between space-x-3"
            >
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline-block mr-1" />
                Back
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    <span>Verifying...</span>
                  </motion.div>
                ) : (
                  <>
                    Verify
                    <ChevronRight className="w-4 h-4 inline-block ml-1" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Recovery Codes Step */}
        {step === 'recovery' && (
          <motion.div
            key="recovery"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <motion.div variants={successIconVariants} className="inline-block mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Lock className="w-8 h-8" />
                </div>
              </motion.div>

              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">MFA Successfully Enabled</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account is now protected with multi-factor authentication. Save your recovery codes in case you lose access to your authenticator app.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Important</h5>
                  <p className="text-sm text-amber-700 dark:text-amber-200">
                    Save these recovery codes in a secure location. Each code can only be used once to sign in if you lose access to your authenticator app.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <motion.div
                      key={index}
                      custom={index}
                      variants={recoveryCodeVariants}
                      className="font-mono text-sm bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 text-center"
                    >
                      {code}
                    </motion.div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(recoveryCodes.join('\n'), 'recoveryCodes')}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                aria-label="Copy recovery codes"
              >
                {recoveryCodesCopied ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-end">
              <button
                type="button"
                onClick={handleComplete}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                I've Saved My Recovery Codes
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center py-8">
              <motion.div
                variants={successIconVariants}
                className="inline-block mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-200 dark:bg-green-800 animate-ping opacity-30"></div>
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <Check className="w-10 h-10" />
                  </div>
                </div>
              </motion.div>

              <motion.h4
                variants={itemVariants}
                className="text-2xl font-semibold text-gray-900 dark:text-white mb-3"
              >
                MFA Successfully Enabled
              </motion.h4>

              <motion.p
                variants={itemVariants}
                className="text-gray-600 dark:text-gray-400 max-w-md mx-auto"
              >
                Your account is now protected with multi-factor authentication. You'll need to enter a verification code from your authenticator app when signing in.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg inline-block"
              >
                <div className="flex items-start text-left">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Remember to keep your recovery codes in a safe place. You'll need them if you lose access to your authenticator app.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex justify-center"
            >
              <button
                type="button"
                onClick={onSuccess || (() => {})}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MFASetup;
