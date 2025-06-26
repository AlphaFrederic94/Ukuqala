import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Info, Database, Server, ArrowRight } from 'lucide-react';

export default function DataFlowDiagram() {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Flow Diagram</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The data flow diagram illustrates how information moves through the Ukuqala application,
            from user input to storage and processing, and back to the user interface.
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
              src="/assets/diagrams/data-flow-diagram.svg"
              alt="Ukuqala Data Flow Diagram"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-start">
              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>This diagram shows the flow of data between different components and services in the Ukuqala application.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Data Flows</h3>

          <div className="space-y-6">
            {/* User Data Flow */}
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Database className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  User Data Flow
                </h4>
              </div>
              <div className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Input</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Validation</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Supabase API</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PostgreSQL Database</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User profile data, medical records, and settings flow through this path. Data is validated on the client side
                  before being sent to Supabase, which applies additional server-side validation and stores it in PostgreSQL.
                </p>
              </div>
            </div>

            {/* Social Data Flow */}
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Database className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                  Social Data Flow
                </h4>
              </div>
              <div className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Interaction</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Firebase SDK</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Firestore</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time Updates</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Social data (posts, comments, messages) flows through Firebase. When a user creates content, it's sent to Firestore,
                  which then broadcasts updates to all connected clients in real-time using Firebase's subscription model.
                </p>
              </div>
            </div>

            {/* Prediction Data Flow */}
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Server className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                  Prediction Data Flow
                </h4>
              </div>
              <div className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Symptom Input</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FastAPI Backend</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ML Models</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prediction Results</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For disease predictions, user symptom data or medical images are sent to the FastAPI backend, which preprocesses the data
                  and passes it to the appropriate ML model. The model generates predictions that are returned to the frontend for display.
                </p>
              </div>
            </div>

            {/* Notification Data Flow */}
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Server className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                  Notification Data Flow
                </h4>
              </div>
              <div className="p-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Trigger</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Edge Function</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center mb-4 md:mb-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Africa's Talking API</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 transform rotate-90 md:rotate-0 my-2 md:my-0" />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Delivery</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For appointment reminders, database events trigger Edge Functions that process the notification data and send it to
                  Africa's Talking API for SMS delivery. In-app notifications are handled through Firebase Cloud Messaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
