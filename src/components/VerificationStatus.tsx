import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getVerificationStatus } from '../services/studentVerificationService';
import { Loader, CheckCircle, X, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import VerificationStatusIndicator from './VerificationStatusIndicator';

const VerificationStatus: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.returnPath || '/students-hub';
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('none');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);

      // Get current user
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/login');
        return;
      }

      setUserId(data.user.id);

      // Get verification status
      const { status, data: verificationData } = await getVerificationStatus(data.user.id);
      setStatus(status);
      setVerificationData(verificationData);

      setLoading(false);
    };

    checkStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin text-indigo-500 h-12 w-12" />
      </div>
    );
  }

  // Handle verification success
  const handleVerificationSuccess = () => {
    // Redirect to the Medical Students Hub
    navigate(returnPath);
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Verification Status</h1>
        <p className="text-gray-600">
          Track the status of your medical student verification
        </p>
      </motion.div>

      {/* Verification Status Indicator */}
      <VerificationStatusIndicator
        onVerified={handleVerificationSuccess}
        showRefresh={true}
      />

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Student Verification Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Current status of your medical student verification
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {status === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Loader className="animate-spin -ml-1 mr-2 h-3 w-3" />
                    Pending
                  </span>
                )}
                {status === 'verified' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="-ml-1 mr-2 h-3 w-3" />
                    Verified
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <X className="-ml-1 mr-2 h-3 w-3" />
                    Rejected
                  </span>
                )}
                {status === 'none' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Submitted
                  </span>
                )}
              </dd>
            </div>

            {verificationData && (
              <>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {verificationData.full_name}
                  </dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">School</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {verificationData.school_name}
                  </dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {verificationData.school_country}
                  </dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Graduation Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(verificationData.graduation_date).toLocaleDateString()}
                  </dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">School Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {verificationData.school_email}
                  </dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">School Website</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <a
                      href={verificationData.school_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {verificationData.school_website}
                    </a>
                  </dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Submitted Documents</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {verificationData.document_urls.map((url: string, index: number) => (
                        <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              Document {index + 1}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>

                {verificationData.verification_notes && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {verificationData.verification_notes}
                    </dd>
                  </div>
                )}

                {verificationData.verified_at && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Verified At</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(verificationData.verified_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="flex justify-between">
        {status === 'none' && (
          <button
            onClick={() => navigate('/student-verification')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Submit Verification
          </button>
        )}

        {status === 'rejected' && (
          <button
            onClick={() => navigate('/student-verification')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Update Verification
          </button>
        )}

        {status === 'verified' && (
          <button
            onClick={() => navigate(returnPath)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Go to Medical Students Hub
            <ArrowRight className="ml-2" size={16} />
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default VerificationStatus;
