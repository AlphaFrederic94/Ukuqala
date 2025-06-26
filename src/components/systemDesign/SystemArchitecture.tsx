import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Info } from 'lucide-react';

export default function SystemArchitecture() {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">System Architecture Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ukuqala follows a modern client-server architecture with a React frontend and Supabase backend.
            The application is designed to be scalable, maintainable, and optimized for performance even in low-resource environments.
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
              src="/assets/diagrams/system-architecture.svg"
              alt="Ukuqala System Architecture"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-start">
              <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>This diagram illustrates the high-level architecture of the Ukuqala application, showing the relationships between frontend, backend, and external services.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Architecture Components</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Frontend Layer</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>React/TypeScript SPA</li>
                  <li>Responsive UI with Tailwind CSS</li>
                  <li>State management with Context API</li>
                  <li>Animation with Framer Motion</li>
                  <li>Progressive Web App capabilities</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backend Services</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Supabase for database and authentication</li>
                  <li>Firebase for real-time features</li>
                  <li>FastAPI for ML model integration</li>
                  <li>Edge Functions for serverless operations</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Layer</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>PostgreSQL database (via Supabase)</li>
                  <li>Firebase Firestore for social features</li>
                  <li>Firebase Storage for media</li>
                  <li>Local storage for offline capabilities</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">External Integrations</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Weather API for forecasts</li>
                  <li>News API for health articles</li>
                  <li>Hugging Face for AI models</li>
                  <li>Africa's Talking for SMS notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Architecture Design Principles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Modularity</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Components are designed to be self-contained and reusable, with clear interfaces and responsibilities.
                This enables easier maintenance and feature development.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Scalability</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The architecture supports horizontal scaling through stateless components and cloud-based services
                that can handle increased load as user base grows.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Resilience</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Designed for low-resource environments with offline capabilities, error handling,
                and graceful degradation when services are unavailable.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Security Considerations</h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>Authentication via Supabase with multiple methods (email/password, OAuth)</li>
              <li>Row-level security policies in database</li>
              <li>PIN-based access control for sensitive features</li>
              <li>Data encryption for medical records</li>
              <li>CORS protection for API endpoints</li>
              <li>Input validation on both client and server</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
