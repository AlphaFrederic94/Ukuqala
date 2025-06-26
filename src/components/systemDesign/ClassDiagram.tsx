import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Info, ChevronDown, ChevronUp, Code } from 'lucide-react';

export default function ClassDiagram() {
  const [expandedSection, setExpandedSection] = useState<string | null>('frontend');

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Class Diagram Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The class diagrams below illustrate the key components and their relationships within the Ukuqala application.
            These diagrams help visualize the structure of the codebase and how different parts of the system interact.
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
              src="/assets/diagrams/class-diagram-overview.svg"
              alt="Ukuqala Class Diagram Overview"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-start">
              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>This high-level class diagram shows the major components and their relationships across the application.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Frontend Components Section */}
            <div>
              <button
                onClick={() => toggleSection('frontend')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                    <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Frontend Component Classes</span>
                </div>
                {expandedSection === 'frontend' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'frontend' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/frontend-class-diagram.png"
                      alt="Frontend Component Classes"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Page Components</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">Home</span>: Main dashboard after login</li>
                        <li><span className="font-mono">Predictions</span>: Disease prediction interface</li>
                        <li><span className="font-mono">Analytics</span>: Health data visualization</li>
                        <li><span className="font-mono">Social</span>: Community interaction features</li>
                        <li><span className="font-mono">Profile</span>: User profile management</li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shared Components</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">Layout</span>: Common page structure</li>
                        <li><span className="font-mono">Header</span>: Navigation and user controls</li>
                        <li><span className="font-mono">HealthCard</span>: Reusable health info display</li>
                        <li><span className="font-mono">Chart</span>: Data visualization component</li>
                        <li><span className="font-mono">Modal</span>: Popup dialog component</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Context Providers Section */}
            <div>
              <button
                onClick={() => toggleSection('context')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                    <Code className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Context Providers</span>
                </div>
                {expandedSection === 'context' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'context' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/context-providers-diagram.png"
                      alt="Context Providers Class Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Authentication & User</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">AuthContext</span>: Manages user authentication state</li>
                        <li><span className="font-mono">UserContext</span>: Provides user profile data</li>
                        <li><span className="font-mono">SettingsContext</span>: User preferences and settings</li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Feature Contexts</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">ThemeContext</span>: Manages light/dark mode</li>
                        <li><span className="font-mono">NotificationContext</span>: Handles notifications</li>
                        <li><span className="font-mono">FirebaseContext</span>: Firebase services access</li>
                        <li><span className="font-mono">TutorialContext</span>: Onboarding tutorials</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Services Section */}
            <div>
              <button
                onClick={() => toggleSection('services')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3">
                    <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Service Classes</span>
                </div>
                {expandedSection === 'services' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'services' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/services-class-diagram.png"
                      alt="Service Classes Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">API Services</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">weatherService</span>: Weather data fetching</li>
                        <li><span className="font-mono">predictionService</span>: Disease prediction</li>
                        <li><span className="font-mono">newsService</span>: Health news articles</li>
                        <li><span className="font-mono">chatbotService</span>: Medical chatbot</li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Services</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">supabaseClient</span>: Database operations</li>
                        <li><span className="font-mono">firebaseService</span>: Social features</li>
                        <li><span className="font-mono">storageService</span>: File storage</li>
                        <li><span className="font-mono">analyticsService</span>: Health data analysis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data Models Section */}
            <div>
              <button
                onClick={() => toggleSection('models')}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-3">
                    <Code className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Data Models</span>
                </div>
                {expandedSection === 'models' ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {expandedSection === 'models' && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="relative bg-white dark:bg-gray-700 rounded-xl p-6 mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src="/assets/diagrams/data-models-diagram.png"
                      alt="Data Models Class Diagram"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Models</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">User</span>: Core user information</li>
                        <li><span className="font-mono">Profile</span>: Extended user profile</li>
                        <li><span className="font-mono">MedicalRecord</span>: User health data</li>
                        <li><span className="font-mono">Appointment</span>: Medical appointments</li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Social Models</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                        <li><span className="font-mono">Post</span>: Social media posts</li>
                        <li><span className="font-mono">Comment</span>: Post comments</li>
                        <li><span className="font-mono">ChatGroup</span>: Group chat channels</li>
                        <li><span className="font-mono">Message</span>: Chat messages</li>
                        <li><span className="font-mono">Friendship</span>: User connections</li>
                      </ul>
                    </div>
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
