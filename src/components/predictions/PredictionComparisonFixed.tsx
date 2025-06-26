import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info, BarChart3, Activity, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Prediction } from '../../lib/predictionService';

// Extended prediction interface with optional properties used in comparison
interface ExtendedPrediction extends Prediction {
  parameters?: Record<string, any>;
  probability?: number;
  recommendations?: string[];
  confidence_score?: number;
  input_parameters?: Record<string, any>;
}

interface PredictionComparisonProps {
  predictions: Prediction[];
  onClose: () => void;
}

// Comparison analysis interface
interface ComparisonAnalysis {
  riskTrend: 'improving' | 'worsening' | 'stable';
  probabilityChange: number;
  timeGap: number;
  keyChanges: string[];
  recommendations: string[];
  confidenceChange: number;
  overallAssessment: string;
}

const PredictionComparisonFixed: React.FC<PredictionComparisonProps> = ({ predictions, onClose }) => {
  const { t } = useTranslation();
  const [selectedIndices, setSelectedIndices] = useState<[number, number]>([0, 1]);
  const [sortedPredictions, setSortedPredictions] = useState<ExtendedPrediction[]>([]);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<ComparisonAnalysis | null>(null);

  // Sort predictions by date (newest first) and process data
  useEffect(() => {
    if (!predictions || !Array.isArray(predictions) || predictions.length < 2) {
      return;
    }

    // Process and enhance predictions with extracted data
    const processedPredictions = predictions.map(pred => {
      const enhanced: ExtendedPrediction = { ...pred };

      // Extract data from result_details if available
      if (pred.result_details) {
        enhanced.probability = pred.result_details.probability || pred.result_details.prediction;
        enhanced.recommendations = pred.result_details.recommendations || [];
        enhanced.confidence_score = pred.result_details.confidence_score || pred.result_details.probability;
        enhanced.input_parameters = pred.result_details.input_parameters || pred.result_details;
      }

      return enhanced;
    });

    const sorted = processedPredictions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setSortedPredictions(sorted);
  }, [predictions]);

  // Get the two selected predictions
  const firstPrediction: ExtendedPrediction | undefined = sortedPredictions[selectedIndices[0]];
  const secondPrediction: ExtendedPrediction | undefined = sortedPredictions[selectedIndices[1]];

  // Advanced comparison analysis algorithm
  const performComparisonAnalysis = useMemo(() => {
    if (!firstPrediction || !secondPrediction) return null;

    const analysis: ComparisonAnalysis = {
      riskTrend: 'stable',
      probabilityChange: 0,
      timeGap: 0,
      keyChanges: [],
      recommendations: [],
      confidenceChange: 0,
      overallAssessment: ''
    };

    // Calculate time gap
    analysis.timeGap = differenceInDays(
      new Date(firstPrediction.created_at),
      new Date(secondPrediction.created_at)
    );

    // Risk level comparison
    const riskLevels = { 'low': 1, 'moderate': 2, 'high': 3, 'unknown': 0 };
    const firstRisk = riskLevels[firstPrediction.risk_level] || 0;
    const secondRisk = riskLevels[secondPrediction.risk_level] || 0;

    if (firstRisk < secondRisk) {
      analysis.riskTrend = 'improving';
    } else if (firstRisk > secondRisk) {
      analysis.riskTrend = 'worsening';
    }

    // Probability change analysis
    if (firstPrediction.probability !== undefined && secondPrediction.probability !== undefined) {
      analysis.probabilityChange = ((firstPrediction.probability - secondPrediction.probability) * 100);
    }

    // Confidence change
    if (firstPrediction.confidence_score !== undefined && secondPrediction.confidence_score !== undefined) {
      analysis.confidenceChange = ((firstPrediction.confidence_score - secondPrediction.confidence_score) * 100);
    }

    // Key changes detection
    if (Math.abs(analysis.probabilityChange) > 5) {
      analysis.keyChanges.push(
        `Risk probability ${analysis.probabilityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(analysis.probabilityChange).toFixed(1)}%`
      );
    }

    if (analysis.riskTrend !== 'stable') {
      analysis.keyChanges.push(`Risk level ${analysis.riskTrend === 'improving' ? 'improved' : 'worsened'}`);
    }

    // Generate recommendations based on trends
    if (analysis.riskTrend === 'worsening') {
      analysis.recommendations.push('Consider consulting with a healthcare professional');
      analysis.recommendations.push('Review lifestyle factors that may have changed');
    } else if (analysis.riskTrend === 'improving') {
      analysis.recommendations.push('Continue current positive health practices');
      analysis.recommendations.push('Maintain regular monitoring');
    }

    // Overall assessment
    if (analysis.riskTrend === 'improving') {
      analysis.overallAssessment = 'Your health indicators show positive improvement';
    } else if (analysis.riskTrend === 'worsening') {
      analysis.overallAssessment = 'Health indicators suggest increased attention needed';
    } else {
      analysis.overallAssessment = 'Health indicators remain stable';
    }

    return analysis;
  }, [firstPrediction, secondPrediction]);

  // Update analysis when predictions change
  useEffect(() => {
    setComparisonAnalysis(performComparisonAnalysis);
  }, [performComparisonAnalysis]);

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
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Calculate the difference between two values
  const calculateDifference = (value1: number | undefined, value2: number | undefined) => {
    if (value1 === undefined || value2 === undefined) {
      return {
        value: 0,
        direction: 'same'
      };
    }

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
  const getRiskLevelColor = (riskLevel: string | undefined) => {
    if (!riskLevel) return 'text-gray-500 dark:text-gray-400';

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
  const getRiskLevelIcon = (riskLevel: string | undefined) => {
    if (!riskLevel) return <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />;

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
                {firstPrediction.risk_level || 'Unknown'} {t('predictions.riskLevel')}
              </div>
              {getRiskLevelIcon(firstPrediction.risk_level)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {firstPrediction.prediction_type || 'Unknown'}
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
                {secondPrediction.risk_level || 'Unknown'} {t('predictions.riskLevel')}
              </div>
              {getRiskLevelIcon(secondPrediction.risk_level)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {secondPrediction.prediction_type || 'Unknown'}
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
              {firstPrediction.parameters && secondPrediction.parameters &&
                Object.entries(firstPrediction.parameters || {}).map(([key, value]) => {
                  // Skip non-numeric parameters
                  if (typeof value !== 'number') return null;

                  const secondValue = secondPrediction.parameters?.[key];
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

        {/* Enhanced Comparison Analysis */}
        {comparisonAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-blue-200 dark:border-gray-500"
          >
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Intelligent Comparison Analysis
              </h3>
            </div>

            {/* Overall Assessment */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Assessment</h4>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comparisonAnalysis.overallAssessment}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Risk Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Risk Trend</p>
                    <p className={`text-lg font-bold ${
                      comparisonAnalysis.riskTrend === 'improving' ? 'text-green-600 dark:text-green-400' :
                      comparisonAnalysis.riskTrend === 'worsening' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {comparisonAnalysis.riskTrend.charAt(0).toUpperCase() + comparisonAnalysis.riskTrend.slice(1)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    comparisonAnalysis.riskTrend === 'improving' ? 'bg-green-100 dark:bg-green-900' :
                    comparisonAnalysis.riskTrend === 'worsening' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {comparisonAnalysis.riskTrend === 'improving' ? (
                      <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : comparisonAnalysis.riskTrend === 'worsening' ? (
                      <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Probability Change */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Probability Change</p>
                    <p className={`text-lg font-bold ${
                      comparisonAnalysis.probabilityChange > 0 ? 'text-red-600 dark:text-red-400' :
                      comparisonAnalysis.probabilityChange < 0 ? 'text-green-600 dark:text-green-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {comparisonAnalysis.probabilityChange > 0 ? '+' : ''}{comparisonAnalysis.probabilityChange.toFixed(1)}%
                    </p>
                  </div>
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Time Gap */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time Between</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {comparisonAnalysis.timeGap} days
                    </p>
                  </div>
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Key Changes */}
            {comparisonAnalysis.keyChanges.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  Key Changes Detected
                </h4>
                <div className="space-y-2">
                  {comparisonAnalysis.keyChanges.map((change, index) => (
                    <div key={index} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {comparisonAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  AI-Generated Recommendations
                </h4>
                <div className="space-y-2">
                  {comparisonAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Recommendations Comparison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {formatDate(firstPrediction.created_at)} {t('predictions.recommendations')}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {firstPrediction.recommendations && Array.isArray(firstPrediction.recommendations) ?
                firstPrediction.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                )) :
                <li>No recommendations available</li>
              }
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {formatDate(secondPrediction.created_at)} {t('predictions.recommendations')}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              {secondPrediction.recommendations && Array.isArray(secondPrediction.recommendations) ?
                secondPrediction.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                )) :
                <li>No recommendations available</li>
              }
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

export default PredictionComparisonFixed;
