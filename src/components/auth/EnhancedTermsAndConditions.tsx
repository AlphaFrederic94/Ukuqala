import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Shield, Lock, FileText, AlertTriangle, Users, Database, Server, Clock } from 'lucide-react';

export default function EnhancedTermsAndConditions({ onAccept, onDecline }: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [activeTab, setActiveTab] = useState('terms');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    // Save the current overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';

    // Cleanup function to restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setHasScrolledToBottom(true);
    }
  };

  const tabs = [
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'data', label: 'Data Usage', icon: Database },
  ];

  return (
    <motion.div
      className="terms-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ isolation: 'isolate' }}
    >
      <motion.div
        className="terms-modal-content bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ isolation: 'isolate' }}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-white flex items-center">
            <Shield className="mr-2 text-blue-600 dark:text-blue-400" />
            Ukuqala Terms & Privacy
          </h2>
          <button
            onClick={onDecline}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex-1 py-4 px-6 text-center font-medium flex items-center justify-center ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="overflow-y-auto p-6 max-h-[50vh] bg-white dark:bg-gray-800"
          onScroll={handleScroll}
          style={{ isolation: 'isolate' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="prose dark:prose-invert prose-sm max-w-none"
            >
              {activeTab === 'terms' && (
                <>
                  <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        By using Ukuqala, you agree to these terms and conditions.
                        Please read them carefully as they govern your use of our services.
                      </span>
                    </p>
                  </div>

                  <h3 className="flex items-center text-lg font-semibold">
                    <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    1. Introduction
                  </h3>
                  <p>
                    Welcome to Ukuqala, an integrated disease prediction system designed specifically for low-resource countries.
                    Our AI-powered health platform provides disease diagnosis support, health analytics, and personalized care recommendations.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <AlertTriangle className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                    2. Medical Disclaimer
                  </h3>
                  <p>
                    Ukuqala is not a substitute for professional medical advice, diagnosis, or treatment.
                    The predictions and recommendations provided by our AI systems are meant to support, not replace,
                    the relationship between you and your healthcare providers.
                  </p>
                  <p>
                    Always seek the advice of qualified health providers with any questions you may have
                    regarding a medical condition. Never disregard professional medical advice or delay in seeking it
                    because of information you have obtained through Ukuqala.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Users className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    3. User Responsibilities
                  </h3>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials and PIN.
                    Do not share your login information with others. You are responsible for all activities that occur
                    under your account.
                  </p>
                  <p>
                    You agree to provide accurate, current, and complete information during the registration process
                    and to update such information to keep it accurate, current, and complete.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Server className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    4. Service Availability
                  </h3>
                  <p>
                    While we strive to provide uninterrupted access to Ukuqala, we cannot guarantee 24/7 availability.
                    The service may be temporarily unavailable due to maintenance, system upgrades, or factors beyond our control.
                  </p>
                  <p>
                    We reserve the right to modify, suspend, or discontinue any part of our services at any time
                    without prior notice or liability.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Clock className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                    5. Termination
                  </h3>
                  <p>
                    We reserve the right to terminate or suspend your account and access to our services immediately,
                    without prior notice or liability, for any reason, including if you violate these Terms.
                  </p>
                  <p>
                    Upon termination, your right to use the service will immediately cease. All provisions of these Terms
                    which by their nature should survive termination shall survive, including ownership provisions,
                    warranty disclaimers, indemnity, and limitations of liability.
                  </p>
                </>
              )}

              {activeTab === 'privacy' && (
                <>
                  <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 flex items-start">
                      <Lock className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        Your privacy is important to us. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use Ukuqala.
                      </span>
                    </p>
                  </div>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Database className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    1. Information We Collect
                  </h3>
                  <p>
                    We collect several types of information from and about users of our platform, including:
                  </p>
                  <ul>
                    <li>Personal information (name, email address, phone number)</li>
                    <li>Health information (symptoms, medical history, test results)</li>
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (interactions with the app, features used, time spent)</li>
                  </ul>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Shield className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    2. How We Protect Your Information
                  </h3>
                  <p>
                    We implement appropriate security measures to protect your personal information:
                  </p>
                  <ul>
                    <li>End-to-end encryption for all health data</li>
                    <li>Secure authentication with multi-factor options</li>
                    <li>Regular security audits and vulnerability testing</li>
                    <li>Strict access controls for our staff</li>
                  </ul>
                  <p>
                    However, no method of transmission over the Internet or electronic storage is 100% secure.
                    While we strive to use commercially acceptable means to protect your information, we cannot
                    guarantee its absolute security.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Users className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                    3. Sharing Your Information
                  </h3>
                  <p>
                    We may share your information in the following circumstances:
                  </p>
                  <ul>
                    <li>With healthcare providers you explicitly authorize</li>
                    <li>To comply with legal obligations</li>
                    <li>With service providers who assist in operating our platform</li>
                    <li>In anonymized, aggregated form for research purposes</li>
                  </ul>
                  <p>
                    We will never sell your personal health information to third parties for marketing purposes.
                  </p>
                </>
              )}

              {activeTab === 'data' && (
                <>
                  <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 flex items-start">
                      <Database className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        This section explains how we use your data to provide and improve our services,
                        and your rights regarding your information.
                      </span>
                    </p>
                  </div>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Database className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    1. How We Use Your Data
                  </h3>
                  <p>
                    We use your data for the following purposes:
                  </p>
                  <ul>
                    <li>To provide and maintain our services</li>
                    <li>To generate health predictions and recommendations</li>
                    <li>To improve our AI models and algorithms</li>
                    <li>To communicate with you about your account and health</li>
                    <li>To detect and prevent fraudulent or unauthorized activity</li>
                  </ul>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Server className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    2. Data Storage and Retention
                  </h3>
                  <p>
                    Your data is stored securely in our cloud infrastructure:
                  </p>
                  <ul>
                    <li>Personal account information is stored in Supabase</li>
                    <li>Social features data is stored in Firebase</li>
                    <li>Health analytics data is encrypted and stored in secure databases</li>
                  </ul>
                  <p>
                    We retain your data for as long as your account is active or as needed to provide services.
                    You can request deletion of your data at any time through your account settings.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <Users className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    3. Research and Improvement
                  </h3>
                  <p>
                    With your consent, we may use your anonymized health data to:
                  </p>
                  <ul>
                    <li>Improve disease prediction models</li>
                    <li>Conduct research on health patterns in low-resource settings</li>
                    <li>Develop new features and services</li>
                    <li>Generate aggregated health insights for communities</li>
                  </ul>
                  <p>
                    All research data is de-identified and cannot be traced back to individual users.
                  </p>

                  <h3 className="flex items-center text-lg font-semibold">
                    <FileText className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                    4. Your Data Rights
                  </h3>
                  <p>
                    You have the following rights regarding your data:
                  </p>
                  <ul>
                    <li>Right to access your personal information</li>
                    <li>Right to correct inaccurate information</li>
                    <li>Right to delete your data</li>
                    <li>Right to restrict or object to processing</li>
                    <li>Right to data portability</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us through the app's support section or email
                    privacy@ukuqala.com.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800" style={{ isolation: 'isolate' }}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onDecline}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className={`px-6 py-2 rounded-lg flex items-center ${
                hasScrolledToBottom
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              } transition-all duration-300`}
              disabled={!hasScrolledToBottom}
            >
              <Check className="w-5 h-5 mr-2" />
              I Accept
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
