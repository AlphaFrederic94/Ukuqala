import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  error?: string;
  title?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  error = 'Something went wrong. Please try again later.',
  title = 'Error'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('error.title', title)}
      </h1>
      
      <p className="text-center text-gray-600 dark:text-gray-300 max-w-md mb-8">
        {t('error.message', error)}
      </p>
      
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t('error.goBack', 'Go Back')}
        </button>
        
        <Link
          to="/"
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="h-5 w-5 mr-2" />
          {t('error.goHome', 'Go Home')}
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
