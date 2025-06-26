import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Info, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';

export default function SequenceDiagram() {
  const [expandedSection, setExpandedSection] = useState<string | null>('auth');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sequence Diagrams</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            These sequence diagrams illustrate the interactions between different components of the Ukuqala application
            during key processes. They help visualize the flow of operations and data exchange between system components.
          </p>

          <div className="relative bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <a
                href="https://miro.com/app/board/uXjVOfXK5Fo=/?share_link_id=267573180130"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-sm"
              >
                <span>View in Miro</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <img
              src="/assets/diagrams/sequence-overview.svg"
              alt="Ukuqala Sequence Diagram Overview"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-start">
              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>This overview shows the main interaction patterns in the Ukuqala application.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Authentication Flow */}
            <div>
              <button
                onClick={() => toggleSection('auth')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                    <GitBranch className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Authentication Flow</span>
                </div>
                {expandedSection === 'auth' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'auth' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/auth-sequence.svg"
                      alt="Authentication Sequence Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Authentication Process</h4>
                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                      <li>User enters credentials in the login form</li>
                      <li>Frontend validates input and sends authentication request to Supabase</li>
                      <li>Supabase authenticates the user and returns a session token</li>
                      <li>Frontend stores the token and updates the AuthContext</li>
                      <li>PIN verification is requested for sensitive operations</li>
                      <li>After successful authentication, user profile data is loaded</li>
                      <li>User is redirected to the home dashboard</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Disease Prediction Flow */}
            <div>
              <button
                onClick={() => toggleSection('prediction')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                    <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Disease Prediction Flow</span>
                </div>
                {expandedSection === 'prediction' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'prediction' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/prediction-sequence.png"
                      alt="Disease Prediction Sequence Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Prediction Process</h4>
                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                      <li>User inputs symptoms or uploads medical images</li>
                      <li>Frontend validates and preprocesses the input data</li>
                      <li>Data is sent to the appropriate prediction service (FastAPI backend)</li>
                      <li>ML model processes the data and generates predictions</li>
                      <li>Results are returned to the frontend with confidence scores</li>
                      <li>Frontend displays the prediction results to the user</li>
                      <li>Results are stored in the user's medical history (optional)</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Social Interaction Flow */}
            <div>
              <button
                onClick={() => toggleSection('social')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
                    <GitBranch className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Social Interaction Flow</span>
                </div>
                {expandedSection === 'social' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'social' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/social-sequence.png"
                      alt="Social Interaction Sequence Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Social Interaction Process</h4>
                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                      <li>User navigates to the social section of the app</li>
                      <li>Frontend connects to Firebase Firestore for real-time data</li>
                      <li>Posts, comments, and messages are loaded from Firestore</li>
                      <li>User creates content (post, comment, message)</li>
                      <li>Content is validated and sent to Firebase</li>
                      <li>Firebase stores the content and broadcasts to other users</li>
                      <li>Other users receive real-time updates via Firebase listeners</li>
                      <li>Notifications are sent to relevant users</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment Management Flow */}
            <div>
              <button
                onClick={() => toggleSection('appointment')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-3">
                    <GitBranch className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Appointment Management Flow</span>
                </div>
                {expandedSection === 'appointment' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'appointment' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/appointment-sequence.png"
                      alt="Appointment Management Sequence Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Appointment Management Process</h4>
                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                      <li>User creates a new appointment with details</li>
                      <li>Frontend validates appointment data</li>
                      <li>Appointment is saved to Supabase database</li>
                      <li>Supabase triggers a webhook for appointment creation</li>
                      <li>Edge function processes the webhook</li>
                      <li>SMS reminder is scheduled via Africa's Talking API</li>
                      <li>Before appointment, reminder notification is sent</li>
                      <li>User receives SMS and in-app notification</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
