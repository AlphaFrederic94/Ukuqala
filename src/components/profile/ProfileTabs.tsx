import React from 'react';
import { User, Activity, Shield, Heart, Lock, UserCog, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'personal' | 'medical' | 'security';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// Animation variants
const tabVariants = {
  inactive: {
    opacity: 0.7,
    y: 0
  },
  active: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  },
  hover: {
    y: -2,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    y: 1,
    transition: {
      duration: 0.1
    }
  }
};

const iconVariants = {
  inactive: {
    scale: 1
  },
  active: {
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'personal' as TabType,
      label: 'Personal Information',
      icon: User,
      description: 'Your basic profile details',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'medical' as TabType,
      label: 'Medical Information',
      icon: Heart,
      description: 'Your health records and metrics',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'security' as TabType,
      label: 'Security & Privacy',
      icon: Shield,
      description: 'Account security settings',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center p-4 md:p-5 flex-1
                transition-all duration-200 ease-in-out
                ${isActive
                  ? 'text-white bg-gradient-to-r ' + tab.color
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
              initial="inactive"
              animate={isActive ? "active" : "inactive"}
              whileHover={!isActive ? "hover" : undefined}
              whileTap="tap"
              variants={tabVariants}
            >
              <div className="flex items-center w-full">
                <div className={`
                  flex-shrink-0 p-2 rounded-full
                  ${isActive
                    ? 'bg-white/20'
                    : 'bg-gray-100 dark:bg-gray-700'}
                `}>
                  <motion.div
                    variants={iconVariants}
                    animate={isActive ? "active" : "inactive"}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </motion.div>
                </div>

                <div className="ml-3 text-left">
                  <span className={`font-medium text-sm md:text-base block ${
                    isActive ? 'text-white' : ''
                  }`}>
                    {tab.label}
                  </span>
                  <span className={`text-xs ${
                    isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {tab.description}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    />
                  </div>
                )}
              </div>

              {/* Active indicator line */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                    layoutId="activeTabIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabs;
