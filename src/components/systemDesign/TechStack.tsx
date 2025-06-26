import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Server, Database, Globe, Cpu, Shield } from 'lucide-react';

export default function TechStack() {
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

  const technologies = [
    {
      category: "Frontend",
      icon: <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      color: "bg-blue-50 dark:bg-blue-900/20",
      items: [
        { name: "React", description: "UI library for building component-based interfaces", link: "https://reactjs.org/" },
        { name: "TypeScript", description: "Typed superset of JavaScript for improved code quality", link: "https://www.typescriptlang.org/" },
        { name: "Tailwind CSS", description: "Utility-first CSS framework for rapid UI development", link: "https://tailwindcss.com/" },
        { name: "Framer Motion", description: "Animation library for React applications", link: "https://www.framer.com/motion/" },
        { name: "React Router", description: "Declarative routing for React applications", link: "https://reactrouter.com/" }
      ]
    },
    {
      category: "Backend",
      icon: <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      color: "bg-purple-50 dark:bg-purple-900/20",
      items: [
        { name: "Supabase", description: "Open source Firebase alternative with PostgreSQL", link: "https://supabase.io/" },
        { name: "Firebase", description: "Platform for real-time applications and cloud services", link: "https://firebase.google.com/" },
        { name: "FastAPI", description: "Modern Python web framework for building APIs", link: "https://fastapi.tiangolo.com/" },
        { name: "Edge Functions", description: "Serverless functions for backend logic", link: "https://supabase.com/edge-functions" },
        { name: "Africa's Talking", description: "SMS and voice API for notifications", link: "https://africastalking.com/" }
      ]
    },
    {
      category: "Database",
      icon: <Database className="h-5 w-5 text-green-600 dark:text-green-400" />,
      color: "bg-green-50 dark:bg-green-900/20",
      items: [
        { name: "PostgreSQL", description: "Advanced open source relational database", link: "https://www.postgresql.org/" },
        { name: "Firestore", description: "NoSQL document database for real-time data", link: "https://firebase.google.com/docs/firestore" },
        { name: "Firebase Storage", description: "Object storage for user-generated content", link: "https://firebase.google.com/docs/storage" },
        { name: "Supabase Storage", description: "Object storage built on top of PostgreSQL", link: "https://supabase.com/storage" },
        { name: "IndexedDB", description: "Client-side storage for offline capabilities", link: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" }
      ]
    },
    {
      category: "AI/ML",
      icon: <Cpu className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      color: "bg-amber-50 dark:bg-amber-900/20",
      items: [
        { name: "Hugging Face", description: "AI model repository and inference API", link: "https://huggingface.co/" },
        { name: "TensorFlow.js", description: "Machine learning framework for JavaScript", link: "https://www.tensorflow.org/js" },
        { name: "OpenBioLLM", description: "Large language model for medical conversations", link: "https://huggingface.co/aaditya/Llama3-OpenBioLLM-70B" },
        { name: "Brain Tumor Model", description: "Custom CNN for brain tumor detection", link: "#" },
        { name: "vLLM", description: "High-throughput and memory-efficient inference engine", link: "https://github.com/vllm-project/vllm" }
      ]
    },
    {
      category: "DevOps & Security",
      icon: <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />,
      color: "bg-red-50 dark:bg-red-900/20",
      items: [
        { name: "GitHub Actions", description: "CI/CD pipeline for automated deployment", link: "https://github.com/features/actions" },
        { name: "Row-Level Security", description: "Database security policies for data protection", link: "https://supabase.com/docs/guides/auth/row-level-security" },
        { name: "JWT Authentication", description: "Token-based authentication system", link: "https://jwt.io/" },
        { name: "CORS Protection", description: "Security mechanism for cross-origin requests", link: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" },
        { name: "PWA", description: "Progressive Web App capabilities for offline use", link: "https://web.dev/progressive-web-apps/" }
      ]
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Technology Stack</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ukuqala is built using a modern technology stack that balances performance, scalability, and accessibility.
            This overview details the key technologies used throughout the application.
          </p>

          <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8 overflow-hidden">
            <img
              src="/assets/diagrams/tech-stack-overview.svg"
              alt="Ukuqala Technology Stack Overview"
              className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.category}
                variants={itemVariants}
                className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
              >
                <div className={`${tech.color} px-4 py-3 border-b border-gray-200 dark:border-gray-600`}>
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                    {tech.icon}
                    <span className="ml-2">{tech.category}</span>
                  </h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {tech.items.map((item, i) => (
                      <li key={i} className="flex">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                            {item.link !== "#" && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Technology Selection Rationale</h3>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Low-Resource Optimization</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Technologies were selected with consideration for low-resource environments in Africa.
                The application is optimized for performance on lower-end devices and intermittent network connections,
                with offline capabilities and progressive enhancement.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Scalability Considerations</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The architecture leverages cloud services (Supabase, Firebase) that can scale automatically with user growth.
                The separation of concerns between different services allows for independent scaling of components based on demand.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Future Extensibility</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The modular architecture and use of standard APIs make it straightforward to add new features or replace
                components as requirements evolve. The system is designed to accommodate future AI models and additional
                health monitoring capabilities.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
