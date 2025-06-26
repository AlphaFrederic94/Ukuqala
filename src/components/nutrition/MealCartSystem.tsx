import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Check,
  Trash2,
  Clock,
  Utensils,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
  quantity?: number;
  prepTime?: number;
}

interface MealCartSystemProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onConfirm: () => Promise<void>;
  isVisible: boolean;
}

export const MealCartSystem: React.FC<MealCartSystemProps> = ({
  items,
  onRemoveItem,
  onConfirm,
  isVisible
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const totalCalories = items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), 0);
  const totalProtein = items.reduce((sum, item) => sum + ((item.protein || 0) * (item.quantity || 1)), 0);
  const totalCarbs = items.reduce((sum, item) => sum + ((item.carbs || 0) * (item.quantity || 1)), 0);
  const totalFat = items.reduce((sum, item) => sum + ((item.fat || 0) * (item.quantity || 1)), 0);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setConfirmationStatus('idle');
      
      await onConfirm();
      
      setConfirmationStatus('success');
      setTimeout(() => {
        setConfirmationStatus('idle');
        setIsExpanded(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error confirming cart:', error);
      setConfirmationStatus('error');
      setTimeout(() => {
        setConfirmationStatus('idle');
      }, 3000);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="relative bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
            {items.length}
          </span>
        </button>
      </motion.div>

      {/* Cart Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meal Cart</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {items.length} item{items.length !== 1 ? 's' : ''} ready to log
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Add some meals to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {item.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {item.mealType && (
                                <div className="flex items-center space-x-1">
                                  <Utensils className="h-3 w-3" />
                                  <span className="capitalize">{item.mealType}</span>
                                </div>
                              )}
                              {item.prepTime && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.prepTime} min</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {Math.round(item.calories * (item.quantity || 1))}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">Calories</div>
                              </div>
                              {item.protein && (
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {Math.round(item.protein * (item.quantity || 1))}g
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">Protein</div>
                                </div>
                              )}
                              {item.carbs && (
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {Math.round(item.carbs * (item.quantity || 1))}g
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">Carbs</div>
                                </div>
                              )}
                              {item.fat && (
                                <div className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {Math.round(item.fat * (item.quantity || 1))}g
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">Fat</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Total Nutrition</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {Math.round(totalCalories)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {Math.round(totalProtein)}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(totalCarbs)}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {Math.round(totalFat)}g
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isConfirming || items.length === 0}
                      className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {isConfirming ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Logging...</span>
                        </>
                      ) : confirmationStatus === 'success' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Success!</span>
                        </>
                      ) : confirmationStatus === 'error' ? (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span>Error</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Log Meals</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MealCartSystem;
