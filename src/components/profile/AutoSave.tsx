import React, { useState, useEffect, useCallback } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoSaveProps {
  onSave: () => Promise<boolean>;
  debounceTime?: number;
  isDirty: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const AutoSave: React.FC<AutoSaveProps> = ({
  onSave,
  debounceTime = 2000,
  isDirty
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
    }
    
    if (isDirty) {
      setSaveStatus('saving');
      const newTimer = setTimeout(async () => {
        try {
          const success = await onSave();
          setSaveStatus(success ? 'success' : 'error');
          
          // Reset to idle after showing success/error
          setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        } catch (error) {
          setSaveStatus('error');
          
          // Reset to idle after showing error
          setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        }
      }, debounceTime);
      
      setTimer(newTimer);
    }
  }, [isDirty, onSave, debounceTime, timer]);

  // Trigger save when isDirty changes
  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isDirty, debouncedSave, timer]);

  // Status icon and text
  const getStatusContent = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <Save className="w-4 h-4 animate-pulse" />,
          text: 'Saving changes...',
          color: 'text-blue-500 dark:text-blue-400'
        };
      case 'success':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'Changes saved',
          color: 'text-green-500 dark:text-green-400'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Failed to save',
          color: 'text-red-500 dark:text-red-400'
        };
      default:
        return {
          icon: null,
          text: '',
          color: ''
        };
    }
  };

  const { icon, text, color } = getStatusContent();

  return (
    <AnimatePresence>
      {saveStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
            saveStatus === 'error' 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <span className={color}>{icon}</span>
          <span className={`text-sm font-medium ${color}`}>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoSave;
