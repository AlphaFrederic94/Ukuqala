import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles, TrendingUp, Award } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'ai-insight' | 'achievement';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any; // For additional data like charts, progress, etc.
}

interface EnhancedToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const ToastIcon = ({ type }: { type: ToastData['type'] }) => {
  const iconProps = { className: "h-6 w-6" };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="h-6 w-6 text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="h-6 w-6 text-red-500" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="h-6 w-6 text-yellow-500" />;
    case 'info':
      return <Info {...iconProps} className="h-6 w-6 text-blue-500" />;
    case 'ai-insight':
      return <Sparkles {...iconProps} className="h-6 w-6 text-purple-500" />;
    case 'achievement':
      return <Award {...iconProps} className="h-6 w-6 text-gold-500" />;
    default:
      return <Info {...iconProps} className="h-6 w-6 text-gray-500" />;
  }
};

const ToastContent = ({ toast }: { toast: ToastData }) => {
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'ai-insight':
        return 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200';
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-xl border shadow-lg ${getBackgroundColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <ToastIcon type={toast.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{toast.title}</h4>
            {toast.type === 'ai-insight' && (
              <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                <span>AI Powered</span>
              </div>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-700">{toast.message}</p>
          
          {/* Special content for different toast types */}
          {toast.type === 'achievement' && toast.data && (
            <div className="mt-3 p-3 bg-white/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-800">
                  Progress: {toast.data.progress}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${toast.data.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {toast.type === 'ai-insight' && toast.data && (
            <div className="mt-3 p-3 bg-white/50 rounded-lg">
              <div className="text-xs text-purple-600 font-medium mb-1">AI Analysis</div>
              {toast.data.insights && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {toast.data.insights.slice(0, 2).map((insight: string, index: number) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={toast.action.onClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {toast.action.label} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EnhancedToast: React.FC<EnhancedToastProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== 0) { // 0 means persistent
        const timer = setTimeout(() => {
          onRemove(toast.id);
        }, toast.duration || 5000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="relative group"
          >
            <ToastContent toast={toast} />
            
            {/* Close button */}
            <button
              onClick={() => onRemove(toast.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
            
            {/* Progress bar for timed toasts */}
            {toast.duration && toast.duration > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-b-xl"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (toast.duration || 5000) / 1000, ease: "linear" }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook for managing toasts
export const useEnhancedToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<ToastData>) => {
    addToast({ type: 'success', title, message, ...options });
  };

  const error = (title: string, message: string, options?: Partial<ToastData>) => {
    addToast({ type: 'error', title, message, ...options });
  };

  const warning = (title: string, message: string, options?: Partial<ToastData>) => {
    addToast({ type: 'warning', title, message, ...options });
  };

  const info = (title: string, message: string, options?: Partial<ToastData>) => {
    addToast({ type: 'info', title, message, ...options });
  };

  const aiInsight = (title: string, message: string, insights?: string[], options?: Partial<ToastData>) => {
    addToast({ 
      type: 'ai-insight', 
      title, 
      message, 
      data: { insights },
      duration: 8000, // Longer duration for AI insights
      ...options 
    });
  };

  const achievement = (title: string, message: string, progress?: number, options?: Partial<ToastData>) => {
    addToast({ 
      type: 'achievement', 
      title, 
      message, 
      data: { progress },
      duration: 6000,
      ...options 
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    aiInsight,
    achievement
  };
};
