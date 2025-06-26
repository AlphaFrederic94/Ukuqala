import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Brain, Microscope } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  alternateLink: {
    text: string;
    to: string;
    label: string;
  };
}

export default function AuthLayout({ children, title, subtitle, alternateLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Medical animation and project info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-12 text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Activity className="h-10 w-10" />
            <h1 className="text-3xl font-bold">Care AI</h1>
          </div>

          {/* Animated medical icons */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="animate-float-slow">
              <Heart className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Health Monitoring</h3>
              <p className="text-blue-100">Track your vital signs and health metrics in real-time</p>
            </div>
            <div className="animate-float-slower">
              <Brain className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Diagnostics</h3>
              <p className="text-blue-100">Advanced AI-powered health predictions and analysis</p>
            </div>
            <div className="animate-float">
              <Microscope className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lab Results</h3>
              <p className="text-blue-100">Quick access to your medical test results</p>
            </div>
            <div className="animate-float-slowest">
              <Activity className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Monitoring</h3>
              <p className="text-blue-100">Continuous health tracking and alerts</p>
            </div>
          </div>

          <div className="prose prose-lg text-blue-100">
            <h2 className="text-2xl font-bold text-white mb-4">Transform Your Healthcare Experience</h2>
            <p>
              Care AI combines cutting-edge artificial intelligence with comprehensive health monitoring
              to provide you with personalized healthcare insights and predictions.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>

          {children}

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {alternateLink.text}{' '}
            <Link
              to={alternateLink.to}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {alternateLink.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}