import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const { user, setupMFA, verifyMFA } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateMFASetup = async () => {
      if (!user) return;
      
      try {
        setSetupLoading(true);
        const { data, error } = await setupMFA();
        
        if (error) throw error;
        
        if (data) {
          setQrCodeUrl(data.qr_code);
          setSecret(data.secret);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to set up MFA');
      } finally {
        setSetupLoading(false);
      }
    };

    generateMFASetup();
  }, [user, setupMFA]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await verifyMFA(verificationCode);
      
      if (error) throw error;
      
      setSuccess(true);
      
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshSetup = async () => {
    setQrCodeUrl(null);
    setSecret(null);
    setSetupLoading(true);
    
    try {
      const { data, error } = await setupMFA();
      
      if (error) throw error;
      
      if (data) {
        setQrCodeUrl(data.qr_code);
        setSecret(data.secret);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh MFA setup');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Set Up Two-Factor Authentication
        </h2>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md"
        >
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Two-Factor Authentication Enabled
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account is now protected with an additional layer of security.
          </p>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Continue
          </button>
        </motion.div>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Two-factor authentication adds an extra layer of security to your account. 
            After you enter your password, you'll need to provide a code from your authenticator app.
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Step 1: Scan QR Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
            </p>

            <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center mb-4">
              {setupLoading ? (
                <div className="flex items-center justify-center h-[180px] w-[180px]">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : qrCodeUrl ? (
                <QRCode value={qrCodeUrl} size={180} renderAs="svg" includeMargin />
              ) : (
                <div className="flex items-center justify-center h-[180px] w-[180px] bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">QR code unavailable</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={refreshSetup}
                disabled={setupLoading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh QR code
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Step 2: Manual Setup (if QR code doesn't work)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter this secret key manually in your authenticator app:
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between mb-2">
              <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                {setupLoading ? '••••••••••••••••••••' : secret || '••••••••••••••••••••'}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!secret}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400">Copied to clipboard!</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Step 3: Verify Setup
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit verification code from your authenticator app:
            </p>

            <form onSubmit={handleVerify}>
              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-mono dark:bg-gray-700 dark:text-white"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="flex justify-between">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || setupLoading || verificationCode.length !== 6}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify and Enable'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default MFASetup;
