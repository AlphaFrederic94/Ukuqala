import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Activity, Utensils, Moon, Heart, Database, Shield, AlertTriangle } from 'lucide-react';
import '../../styles/healthSimulation.css';
import { useTranslation } from 'react-i18next';
import { fdaEnhancedHealthAnalytics, HealthPrediction, RiskFactor, FDAInsight } from '../../lib/fdaEnhancedHealthAnalytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimulationProps {
  initialHealthData: {
    healthScore: number;
    metrics: {
      bmi: number;
      bloodPressure: string;
      bloodSugar: number;
      cholesterol: number;
    };
  };
  patientProfile?: {
    age?: number;
    gender?: 'male' | 'female';
    weight?: number;
    conditions?: string[];
    medications: string[];
    allergies?: string[];
  };
  enableFDAAnalytics?: boolean;
}

const HealthSimulation: React.FC<SimulationProps> = ({
  initialHealthData,
  patientProfile,
  enableFDAAnalytics = true
}) => {
  const { t } = useTranslation();

  // Simulation parameters
  const [exerciseLevel, setExerciseLevel] = useState(3); // 1-10 scale
  const [dietQuality, setDietQuality] = useState(5); // 1-10 scale
  const [sleepHours, setSleepHours] = useState(7); // hours per night
  const [stressLevel, setStressLevel] = useState(5); // 1-10 scale
  const [medicationAdherence, setMedicationAdherence] = useState(8); // 1-10 scale
  const [smokingStatus, setSmokingStatus] = useState<'never' | 'former' | 'current'>('never');
  const [alcoholConsumption, setAlcoholConsumption] = useState<'none' | 'light' | 'moderate' | 'heavy'>('light');

  // FDA Analytics states
  const [fdaPredictions, setFdaPredictions] = useState<HealthPrediction[]>([]);
  const [fdaRiskFactors, setFdaRiskFactors] = useState<RiskFactor[]>([]);
  const [fdaInsights, setFdaInsights] = useState<FDAInsight[]>([]);
  const [loadingFDA, setLoadingFDA] = useState(false);
  const [fdaEnabled, setFdaEnabled] = useState(enableFDAAnalytics);

  // Projected health metrics
  const [projectedMetrics, setProjectedMetrics] = useState({
    healthScore: initialHealthData.healthScore,
    bmi: initialHealthData.metrics.bmi,
    bloodPressure: initialHealthData.metrics.bloodPressure,
    bloodSugar: initialHealthData.metrics.bloodSugar,
    cholesterol: initialHealthData.metrics.cholesterol
  });

  // Timeline data (6 months projection)
  const [timelineData, setTimelineData] = useState({
    labels: ['Current', '1 Month', '2 Months', '3 Months', '6 Months'],
    datasets: [
      {
        label: 'Health Score',
        data: [initialHealthData.healthScore, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  });

  // Load FDA analytics when parameters change
  useEffect(() => {
    if (fdaEnabled && patientProfile && patientProfile.medications.length > 0) {
      loadFDAAnalytics();
    }
  }, [exerciseLevel, dietQuality, sleepHours, stressLevel, medicationAdherence, smokingStatus, alcoholConsumption, fdaEnabled, patientProfile]);

  // Calculate projected metrics when simulation parameters change
  useEffect(() => {
    // Calculate impact factors
    const exerciseImpact = (exerciseLevel - 5) * 0.6; // -2.4 to +3
    const dietImpact = (dietQuality - 5) * 0.8; // -3.2 to +4
    const sleepImpact = (sleepHours - 7) * 1.2; // -3.6 to +3.6
    const stressImpact = (5 - stressLevel) * 0.5; // -2 to +2
    const medicationImpact = (medicationAdherence - 5) * 0.4; // -1.6 to +2

    let totalImpact = exerciseImpact + dietImpact + sleepImpact + stressImpact + medicationImpact;

    // Apply FDA analytics if available
    if (fdaEnabled && fdaPredictions.length > 0) {
      const sixMonthPrediction = fdaPredictions.find(p => p.timeframe === '6months');
      if (sixMonthPrediction) {
        // Adjust impact based on FDA risk factors
        const fdaRiskAdjustment = fdaRiskFactors
          .filter(rf => rf.type === 'medication')
          .reduce((sum, rf) => sum + (rf.impact * 0.1), 0); // Scale down FDA impact

        totalImpact += fdaRiskAdjustment;
      }
    }

    // Calculate projected health score (capped between 0-100)
    const projectedScore = Math.max(0, Math.min(100, initialHealthData.healthScore + totalImpact * 2));

    // Calculate projected BMI
    // Exercise and diet have the most impact on BMI
    const bmiChange = (exerciseImpact * 0.15) + (dietImpact * 0.2);
    const projectedBmi = Math.max(18.5, Math.min(35, initialHealthData.metrics.bmi - bmiChange));

    // Calculate projected blood pressure
    // All factors affect blood pressure
    const [systolic, diastolic] = initialHealthData.metrics.bloodPressure.split('/').map(Number);
    const systolicChange = totalImpact * 1.5;
    const diastolicChange = totalImpact * 0.8;
    const projectedSystolic = Math.max(90, Math.min(180, systolic - systolicChange));
    const projectedDiastolic = Math.max(60, Math.min(110, diastolic - diastolicChange));

    // Calculate projected blood sugar
    // Diet, exercise, and medication have the most impact
    const bloodSugarChange = (exerciseImpact * 1.2) + (dietImpact * 1.5) + (medicationImpact * 1.8);
    const projectedBloodSugar = Math.max(70, Math.min(200, initialHealthData.metrics.bloodSugar - bloodSugarChange));

    // Calculate projected cholesterol
    // Diet, exercise, and medication have the most impact
    const cholesterolChange = (exerciseImpact * 2) + (dietImpact * 3) + (medicationImpact * 2.5);
    const projectedCholesterol = Math.max(150, Math.min(300, initialHealthData.metrics.cholesterol - cholesterolChange));

    // Update projected metrics
    setProjectedMetrics({
      healthScore: Math.round(projectedScore),
      bmi: parseFloat(projectedBmi.toFixed(1)),
      bloodPressure: `${Math.round(projectedSystolic)}/${Math.round(projectedDiastolic)}`,
      bloodSugar: Math.round(projectedBloodSugar),
      cholesterol: Math.round(projectedCholesterol)
    });

    // Update timeline data
    // Calculate gradual changes over time
    const scoreTimeline = [
      initialHealthData.healthScore,
      initialHealthData.healthScore + (totalImpact * 0.5),
      initialHealthData.healthScore + (totalImpact * 1.0),
      initialHealthData.healthScore + (totalImpact * 1.5),
      Math.round(projectedScore)
    ].map(score => Math.max(0, Math.min(100, score)));

    setTimelineData({
      labels: ['Current', '1 Month', '2 Months', '3 Months', '6 Months'],
      datasets: [
        {
          label: 'Health Score',
          data: scoreTimeline,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    });
  }, [exerciseLevel, dietQuality, sleepHours, stressLevel, medicationAdherence, initialHealthData, fdaEnabled, fdaPredictions, fdaRiskFactors]);

  // Load FDA analytics
  const loadFDAAnalytics = async () => {
    if (!patientProfile || patientProfile.medications.length === 0) return;

    setLoadingFDA(true);
    try {
      const currentMetrics = {
        healthScore: initialHealthData.healthScore,
        bmi: initialHealthData.metrics.bmi,
        bloodPressure: {
          systolic: parseInt(initialHealthData.metrics.bloodPressure.split('/')[0]),
          diastolic: parseInt(initialHealthData.metrics.bloodPressure.split('/')[1])
        },
        bloodSugar: initialHealthData.metrics.bloodSugar,
        cholesterol: initialHealthData.metrics.cholesterol
      };

      const lifestyleFactors = {
        exerciseLevel,
        dietQuality,
        sleepHours,
        stressLevel,
        smokingStatus,
        alcoholConsumption
      };

      const predictions = await fdaEnhancedHealthAnalytics.generateHealthPredictions(
        patientProfile,
        currentMetrics,
        lifestyleFactors
      );

      setFdaPredictions(predictions);

      // Extract risk factors and insights from the latest prediction
      const latestPrediction = predictions[predictions.length - 1];
      if (latestPrediction) {
        setFdaRiskFactors(latestPrediction.riskFactors);
        setFdaInsights(latestPrediction.fdaInsights);
      }

    } catch (error) {
      console.error('Error loading FDA analytics:', error);
    } finally {
      setLoadingFDA(false);
    }
  };

  // Helper function to determine if a change is positive, negative, or neutral
  const getChangeType = (current: number, projected: number) => {
    const difference = projected - current;
    if (Math.abs(difference) < 0.1) return 'neutral';
    return difference > 0 ? 'positive' : 'negative';
  };

  // Helper function to determine if a blood pressure change is positive, negative, or neutral
  const getBpChangeType = (current: string, projected: string) => {
    const [currentSystolic, currentDiastolic] = current.split('/').map(Number);
    const [projectedSystolic, projectedDiastolic] = projected.split('/').map(Number);

    // Lower blood pressure is generally better (up to a point)
    if (projectedSystolic < currentSystolic && projectedDiastolic < currentDiastolic) {
      return 'positive';
    } else if (projectedSystolic > currentSystolic && projectedDiastolic > currentDiastolic) {
      return 'negative';
    }
    return 'neutral';
  };

  // Helper function to format change percentage
  const formatChange = (current: number, projected: number) => {
    const percentChange = ((projected - current) / current) * 100;
    return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `Health Score: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: Math.max(0, Math.min(initialHealthData.healthScore, projectedMetrics.healthScore) - 20),
        max: Math.min(100, Math.max(initialHealthData.healthScore, projectedMetrics.healthScore) + 10),
        ticks: {
          color: '#6b7280',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(243, 244, 246, 1)',
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="simulation-container"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="simulation-title">{t('digitalTwin.simulationTitle', 'Health Intervention Simulation')}</h3>

        {patientProfile && patientProfile.medications.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <button
                onClick={() => setFdaEnabled(!fdaEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  fdaEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fdaEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                FDA Analytics
              </span>
              <Database className="w-4 h-4 ml-1 text-blue-500" />
            </div>
            {loadingFDA && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Loading FDA data...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="simulation-controls">
        <div className="simulation-control">
          <label className="simulation-label">{t('digitalTwin.exerciseLevel', 'Exercise Level')}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={exerciseLevel}
            onChange={(e) => setExerciseLevel(parseInt(e.target.value))}
            className="simulation-slider"
          />
          <span className="simulation-value">
            {exerciseLevel < 3 ? t('digitalTwin.exerciseLow', 'Sedentary') :
             exerciseLevel < 7 ? t('digitalTwin.exerciseMedium', 'Moderate') :
             t('digitalTwin.exerciseHigh', 'Very Active')}
          </span>
        </div>

        <div className="simulation-control">
          <label className="simulation-label">{t('digitalTwin.dietQuality', 'Diet Quality')}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={dietQuality}
            onChange={(e) => setDietQuality(parseInt(e.target.value))}
            className="simulation-slider"
          />
          <span className="simulation-value">
            {dietQuality < 3 ? t('digitalTwin.dietLow', 'Poor') :
             dietQuality < 7 ? t('digitalTwin.dietMedium', 'Average') :
             t('digitalTwin.dietHigh', 'Excellent')}
          </span>
        </div>

        <div className="simulation-control">
          <label className="simulation-label">{t('digitalTwin.sleepHours', 'Sleep (hours/night)')}</label>
          <input
            type="range"
            min="4"
            max="10"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="simulation-slider"
          />
          <span className="simulation-value">{sleepHours} {t('common.hours')}</span>
        </div>

        <div className="simulation-control">
          <label className="simulation-label">{t('digitalTwin.stressLevel', 'Stress Level')}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="simulation-slider"
          />
          <span className="simulation-value">
            {stressLevel < 3 ? t('digitalTwin.stressLow', 'Low') :
             stressLevel < 7 ? t('digitalTwin.stressMedium', 'Moderate') :
             t('digitalTwin.stressHigh', 'High')}
          </span>
        </div>

        <div className="simulation-control">
          <label className="simulation-label">{t('digitalTwin.medicationAdherence', 'Medication Adherence')}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={medicationAdherence}
            onChange={(e) => setMedicationAdherence(parseInt(e.target.value))}
            className="simulation-slider"
          />
          <span className="simulation-value">
            {medicationAdherence < 3 ? t('digitalTwin.adherenceLow', 'Poor') :
             medicationAdherence < 7 ? t('digitalTwin.adherenceMedium', 'Moderate') :
             t('digitalTwin.adherenceHigh', 'Excellent')}
          </span>
        </div>

        {fdaEnabled && (
          <>
            <div className="simulation-control">
              <label className="simulation-label">Smoking Status</label>
              <select
                value={smokingStatus}
                onChange={(e) => setSmokingStatus(e.target.value as any)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="never">Never Smoked</option>
                <option value="former">Former Smoker</option>
                <option value="current">Current Smoker</option>
              </select>
            </div>

            <div className="simulation-control">
              <label className="simulation-label">Alcohol Consumption</label>
              <select
                value={alcoholConsumption}
                onChange={(e) => setAlcoholConsumption(e.target.value as any)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="none">None</option>
                <option value="light">Light (1-3 drinks/week)</option>
                <option value="moderate">Moderate (4-7 drinks/week)</option>
                <option value="heavy">Heavy (8+ drinks/week)</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="simulation-results">
        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('digitalTwin.healthScore', 'Health Score')}</span>
            <span className={`result-change ${getChangeType(initialHealthData.healthScore, projectedMetrics.healthScore)}`}>
              {formatChange(initialHealthData.healthScore, projectedMetrics.healthScore)}
            </span>
          </div>
          <div className="result-values">
            <div className="result-current">
              <span className="result-label">{t('common.current')}</span>
              <span className="result-value">{initialHealthData.healthScore}</span>
            </div>
            <span className="result-arrow">
              <ArrowRight size={20} />
            </span>
            <div className="result-projected">
              <span className="result-label">{t('common.projected')}</span>
              <span className="result-value">{projectedMetrics.healthScore}</span>
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('digitalTwin.bmi', 'BMI')}</span>
            <span className={`result-change ${getChangeType(initialHealthData.metrics.bmi, projectedMetrics.bmi) === 'positive' ? 'negative' : 'positive'}`}>
              {formatChange(initialHealthData.metrics.bmi, projectedMetrics.bmi)}
            </span>
          </div>
          <div className="result-values">
            <div className="result-current">
              <span className="result-label">{t('common.current')}</span>
              <span className="result-value">{initialHealthData.metrics.bmi}</span>
            </div>
            <span className="result-arrow">
              <ArrowRight size={20} />
            </span>
            <div className="result-projected">
              <span className="result-label">{t('common.projected')}</span>
              <span className="result-value">{projectedMetrics.bmi}</span>
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('digitalTwin.bloodPressure', 'Blood Pressure')}</span>
            <span className={`result-change ${getBpChangeType(initialHealthData.metrics.bloodPressure, projectedMetrics.bloodPressure)}`}>
              {initialHealthData.metrics.bloodPressure} → {projectedMetrics.bloodPressure}
            </span>
          </div>
          <div className="result-values">
            <div className="result-current">
              <span className="result-label">{t('common.current')}</span>
              <span className="result-value">{initialHealthData.metrics.bloodPressure}</span>
            </div>
            <span className="result-arrow">
              <ArrowRight size={20} />
            </span>
            <div className="result-projected">
              <span className="result-label">{t('common.projected')}</span>
              <span className="result-value">{projectedMetrics.bloodPressure}</span>
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('digitalTwin.bloodSugar', 'Blood Sugar')}</span>
            <span className={`result-change ${getChangeType(initialHealthData.metrics.bloodSugar, projectedMetrics.bloodSugar) === 'positive' ? 'negative' : 'positive'}`}>
              {formatChange(initialHealthData.metrics.bloodSugar, projectedMetrics.bloodSugar)}
            </span>
          </div>
          <div className="result-values">
            <div className="result-current">
              <span className="result-label">{t('common.current')}</span>
              <span className="result-value">{initialHealthData.metrics.bloodSugar}</span>
            </div>
            <span className="result-arrow">
              <ArrowRight size={20} />
            </span>
            <div className="result-projected">
              <span className="result-label">{t('common.projected')}</span>
              <span className="result-value">{projectedMetrics.bloodSugar}</span>
            </div>
          </div>
        </div>

        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('digitalTwin.cholesterol', 'Cholesterol')}</span>
            <span className={`result-change ${getChangeType(initialHealthData.metrics.cholesterol, projectedMetrics.cholesterol) === 'positive' ? 'negative' : 'positive'}`}>
              {formatChange(initialHealthData.metrics.cholesterol, projectedMetrics.cholesterol)}
            </span>
          </div>
          <div className="result-values">
            <div className="result-current">
              <span className="result-label">{t('common.current')}</span>
              <span className="result-value">{initialHealthData.metrics.cholesterol}</span>
            </div>
            <span className="result-arrow">
              <ArrowRight size={20} />
            </span>
            <div className="result-projected">
              <span className="result-label">{t('common.projected')}</span>
              <span className="result-value">{projectedMetrics.cholesterol}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-header">
          <h4 className="timeline-title">{t('digitalTwin.projectedTimeline', '6-Month Projection')}</h4>
          <div className="timeline-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>{t('digitalTwin.healthScore', 'Health Score')}</span>
            </div>
          </div>
        </div>
        <div className="timeline-chart">
          <Line data={timelineData} options={chartOptions} />
        </div>
      </div>

      {/* FDA Risk Factors */}
      {fdaEnabled && fdaRiskFactors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-orange-500 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              FDA Risk Assessment
            </h4>
          </div>
          <div className="space-y-3">
            {fdaRiskFactors.slice(0, 5).map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    risk.impact < -10 ? 'bg-red-500' :
                    risk.impact < -5 ? 'bg-orange-500' :
                    risk.impact < 0 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{risk.factor}</p>
                    {risk.fdaEvidence && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {risk.fdaEvidence.adverseEventCount} FDA reports, {risk.fdaEvidence.seriousEventCount} serious
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    risk.impact < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {risk.impact > 0 ? '+' : ''}{risk.impact.toFixed(1)}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(risk.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FDA Insights */}
      {fdaEnabled && fdaInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-500 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              FDA Insights
            </h4>
          </div>
          <div className="space-y-3">
            {fdaInsights.map((insight, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">{insight.medication}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      insight.impact === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      insight.impact === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {insight.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{insight.insight}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{insight.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      <div className="recommendations">
        <h4 className="recommendations-title">{t('digitalTwin.recommendations', 'Personalized Recommendations')}</h4>
        <div className="recommendation-list">
          {/* Exercise recommendation */}
          <div className="recommendation-item">
            <div className="recommendation-icon exercise">
              <Activity size={20} />
            </div>
            <div className="recommendation-content">
              <h5 className="recommendation-title">
                {exerciseLevel < 5 ?
                  t('digitalTwin.recommendations.increaseExercise', 'Increase Physical Activity') :
                  t('digitalTwin.recommendations.maintainExercise', 'Maintain Your Exercise Routine')}
              </h5>
              <p className="recommendation-description">
                {exerciseLevel < 3 ?
                  t('digitalTwin.recommendations.exerciseLow', 'Try to incorporate at least 30 minutes of moderate activity 3-4 times per week.') :
                  exerciseLevel < 7 ?
                  t('digitalTwin.recommendations.exerciseMedium', 'Consider adding 1-2 more days of exercise or increasing intensity for better results.') :
                  t('digitalTwin.recommendations.exerciseHigh', 'Your exercise level is excellent. Focus on recovery and preventing injuries.')}
              </p>
            </div>
          </div>

          {/* Diet recommendation */}
          <div className="recommendation-item">
            <div className="recommendation-icon diet">
              <Utensils size={20} />
            </div>
            <div className="recommendation-content">
              <h5 className="recommendation-title">
                {dietQuality < 5 ?
                  t('digitalTwin.recommendations.improveDiet', 'Improve Your Diet') :
                  t('digitalTwin.recommendations.maintainDiet', 'Maintain Your Healthy Diet')}
              </h5>
              <p className="recommendation-description">
                {dietQuality < 3 ?
                  t('digitalTwin.recommendations.dietLow', 'Focus on adding more fruits, vegetables, and whole grains while reducing processed foods.') :
                  dietQuality < 7 ?
                  t('digitalTwin.recommendations.dietMedium', 'Consider reducing sugar and increasing protein intake for better health outcomes.') :
                  t('digitalTwin.recommendations.dietHigh', 'Your diet is excellent. Continue with your current eating habits.')}
              </p>
            </div>
          </div>

          {/* Sleep recommendation */}
          <div className="recommendation-item">
            <div className="recommendation-icon sleep">
              <Moon size={20} />
            </div>
            <div className="recommendation-content">
              <h5 className="recommendation-title">
                {sleepHours < 7 ?
                  t('digitalTwin.recommendations.improveSleep', 'Improve Sleep Duration') :
                  t('digitalTwin.recommendations.maintainSleep', 'Maintain Good Sleep Habits')}
              </h5>
              <p className="recommendation-description">
                {sleepHours < 6 ?
                  t('digitalTwin.recommendations.sleepLow', 'Aim for at least 7 hours of sleep per night. Create a consistent sleep schedule.') :
                  sleepHours < 8 ?
                  t('digitalTwin.recommendations.sleepMedium', 'Your sleep duration is good. Focus on improving sleep quality by reducing screen time before bed.') :
                  t('digitalTwin.recommendations.sleepHigh', 'Your sleep duration is excellent. Maintain your current sleep schedule.')}
              </p>
            </div>
          </div>

          {/* Stress management recommendation */}
          <div className="recommendation-item">
            <div className="recommendation-icon stress">
              <Heart size={20} />
            </div>
            <div className="recommendation-content">
              <h5 className="recommendation-title">
                {stressLevel > 5 ?
                  t('digitalTwin.recommendations.reduceStress', 'Reduce Stress Levels') :
                  t('digitalTwin.recommendations.maintainStress', 'Maintain Stress Management')}
              </h5>
              <p className="recommendation-description">
                {stressLevel > 7 ?
                  t('digitalTwin.recommendations.stressHigh', 'Consider meditation, deep breathing exercises, or speaking with a mental health professional.') :
                  stressLevel > 4 ?
                  t('digitalTwin.recommendations.stressMedium', 'Practice regular relaxation techniques like yoga or mindfulness to manage stress.') :
                  t('digitalTwin.recommendations.stressLow', 'Your stress management is good. Continue with your current stress reduction practices.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthSimulation;
