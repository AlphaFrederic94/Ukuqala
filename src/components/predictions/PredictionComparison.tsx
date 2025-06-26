import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Prediction } from '../../lib/predictionService';

interface PredictionComparisonProps {
  predictions: Prediction[];
  onClose: () => void;
}

const PredictionComparison: React.FC<PredictionComparisonProps> = ({ predictions, onClose }) => {
  const { t } = useTranslation();
  const [selectedIndices, setSelectedIndices] = useState<[number, number]>([0, 1]);
  const [sortedPredictions, setSortedPredictions] = useState<Prediction[]>([]);

  // Sort predictions by date (newest first)
  useEffect(() => {
    const sorted = [...predictions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setSortedPredictions(sorted);
  }, [predictions]);

  // Get the two selected predictions
  const firstPrediction = sortedPredictions[selectedIndices[0]];
  const secondPrediction = sortedPredictions[selectedIndices[1]];

  // Handle navigation
  const handlePrevious = (index: 0 | 1) => {
    setSelectedIndices(prev => {
      const newIndices = [...prev] as [number, number];
      if (newIndices[index] > 0) {
        newIndices[index] -= 1;
      }
      return newIndices;
    });
  };

  const handleNext = (index: 0 | 1) => {
    setSelectedIndices(prev => {
      const newIndices = [...prev] as [number, number];
      if (newIndices[index] < sortedPredictions.length - 1) {
        newIndices[index] += 1;
      }
      return newIndices;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Calculate the difference between two values
  const calculateDifference = (value1: number, value2: number) => {
    const diff = value1 - value2;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'same'
    };
  };

  // Render difference indicator
  const renderDifferenceIndicator = (direction: string, value: number) => {
    if (direction === 'same') {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span>No change</span>
        </div>
      );
    }

    const isPositive = direction === 'increase';
    const colorClass = isPositive
      ? 'text-red-500 dark:text-red-400'
      : 'text-green-500 dark:text-green-400';

    return (
      <div className={`flex items-center ${colorClass}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 mr-1" />
        )}
        <span>{value.toFixed(2)}</span>
      </div>
    );
  };

  // Get risk level color
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'text-red-500 dark:text-red-400';
      case 'moderate':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'low':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  // Get risk level icon
  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'moderate':
        return <Info className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  if (!firstPrediction || !secondPrediction) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('predictions.compareWithPrevious')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('predictions.noDataAvailable')}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {t('predictions.compareWithPrevious')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* First Prediction Selector */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => handlePrevious(0)}
                disabled={selectedIndices[0] === 0}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(firstPrediction.created_at)}
                </span>
              </div>
              <button
                onClick={() => handleNext(0)}
                disabled={selectedIndices[0] === sortedPredictions.length - 1}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center mb-2">
              <div className={`text-lg font-bold ${getRiskLevelColor(firstPrediction.risk_level)} mr-2`}>
                {firstPrediction.risk_level} {t('predictions.riskLevel')}
              </div>
              {getRiskLevelIcon(firstPrediction.risk_level)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {firstPrediction.prediction_type}
            </div>
          </div>

          {/* Second Prediction Selector */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => handlePrevious(1)}
                disabled={selectedIndices[1] === 0}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatDate(secondPrediction.created_at)}
                </span>
              </div>
              <button
                onClick={() => handleNext(1)}
                disabled={selectedIndices[1] === sortedPredictions.length - 1}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center mb-2">
              <div className={`text-lg font-bold ${getRiskLevelColor(secondPrediction.risk_level)} mr-2`}>
                {secondPrediction.risk_level} {t('predictions.riskLevel')}
              </div>
              {getRiskLevelIcon(secondPrediction.risk_level)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {secondPrediction.prediction_type}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                  {t('predictions.parameter')}
                </th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                  {formatDate(firstPrediction.created_at)}
                </th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                  {formatDate(secondPrediction.created_at)}
                </th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                  {t('predictions.change')}
                </th>
              </tr>
            </thead>
            <tbody>
              {firstPrediction.parameters && secondPrediction.parameters && Object.entries(firstPrediction.parameters).map(([key, value]) => {
                // Skip non-numeric parameters
                if (typeof value !== 'number') return null;

                const secondValue = secondPrediction.parameters[key];
                if (typeof secondValue !== 'number') return null;

                const diff = calculateDifference(value, secondValue);

                return (
                  <tr key={key} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {typeof secondValue === 'number' ? secondValue.toFixed(2) : secondValue}
                    </td>
                    <td className="px-4 py-3">
                      {renderDifferenceIndicator(diff.direction, diff.value)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">
                  {t('predictions.probability')}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {firstPrediction.probability !== undefined ? (firstPrediction.probability * 100).toFixed(2) : 'N/A'}%
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {secondPrediction.probability !== undefined ? (secondPrediction.probability * 100).toFixed(2) : 'N/A'}%
                </td>
                <td className="px-4 py-3">
                  {firstPrediction.probability !== undefined && secondPrediction.probability !== undefined ?
                    renderDifferenceIndicator(
                      calculateDifference(firstPrediction.probability, secondPrediction.probability).direction,
                      Math.abs(firstPrediction.probability - secondPrediction.probability) * 100
                    ) : 'N/A'
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recommendations Comparison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {formatDate(firstPrediction.created_at)} {t('predictions.recommendations')}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {firstPrediction.recommendations && firstPrediction.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {formatDate(secondPrediction.created_at)} {t('predictions.recommendations')}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {secondPrediction.recommendations && secondPrediction.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictionComparison;
