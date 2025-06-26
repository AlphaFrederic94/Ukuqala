import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Pill,
  Activity,
  Shield,
  AlertTriangle,
  Database,
  ExternalLink
} from 'lucide-react';
import { fdaDataProcessor, MedicationRisk, HealthImpactAnalysis } from '../../lib/fdaDataProcessor';
import { openFDAService, DrugLabel } from '../../lib/openFDAService';

interface MedicationSimulationProps {
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
    allergies?: string[];
  };
}

// Sample medication database
const MEDICATIONS = [
  {
    id: 1,
    name: 'Lisinopril',
    category: 'ACE Inhibitor',
    primaryEffect: 'Lowers blood pressure',
    effects: {
      bloodPressure: -15, // Reduces systolic by ~15 points
      healthScore: 5
    },
    sideEffects: [
      { name: 'Dry cough', severity: 'moderate', probability: 'common' },
      { name: 'Dizziness', severity: 'mild', probability: 'common' },
      { name: 'Headache', severity: 'mild', probability: 'common' }
    ],
    interactions: [
      { medication: 'Potassium supplements', severity: 'severe', effect: 'May cause dangerous potassium levels' },
      { medication: 'NSAIDs', severity: 'moderate', effect: 'May reduce effectiveness' }
    ]
  },
  {
    id: 2,
    name: 'Atorvastatin',
    category: 'Statin',
    primaryEffect: 'Lowers cholesterol',
    effects: {
      cholesterol: -50, // Reduces cholesterol by ~50 points
      healthScore: 7
    },
    sideEffects: [
      { name: 'Muscle pain', severity: 'moderate', probability: 'common' },
      { name: 'Liver enzyme elevation', severity: 'moderate', probability: 'uncommon' },
      { name: 'Digestive issues', severity: 'mild', probability: 'common' }
    ],
    interactions: [
      { medication: 'Grapefruit juice', severity: 'moderate', effect: 'Increases medication concentration' },
      { medication: 'Certain antibiotics', severity: 'moderate', effect: 'Increases risk of side effects' }
    ]
  },
  {
    id: 3,
    name: 'Metformin',
    category: 'Biguanide',
    primaryEffect: 'Lowers blood sugar',
    effects: {
      bloodSugar: -30, // Reduces blood sugar by ~30 points
      healthScore: 6
    },
    sideEffects: [
      { name: 'Digestive issues', severity: 'moderate', probability: 'very common' },
      { name: 'Metallic taste', severity: 'mild', probability: 'common' },
      { name: 'Vitamin B12 deficiency', severity: 'moderate', probability: 'uncommon' }
    ],
    interactions: [
      { medication: 'Contrast dyes', severity: 'severe', effect: 'Risk of kidney problems' },
      { medication: 'Alcohol', severity: 'moderate', effect: 'Risk of low blood sugar' }
    ]
  },
  {
    id: 4,
    name: 'Aspirin (low-dose)',
    category: 'Antiplatelet',
    primaryEffect: 'Prevents blood clots',
    effects: {
      healthScore: 4
    },
    sideEffects: [
      { name: 'Stomach irritation', severity: 'mild', probability: 'common' },
      { name: 'Increased bleeding risk', severity: 'moderate', probability: 'common' }
    ],
    interactions: [
      { medication: 'Blood thinners', severity: 'severe', effect: 'Increased bleeding risk' },
      { medication: 'NSAIDs', severity: 'moderate', effect: 'Increased stomach irritation' }
    ]
  },
  {
    id: 5,
    name: 'Levothyroxine',
    category: 'Thyroid Hormone',
    primaryEffect: 'Treats hypothyroidism',
    effects: {
      healthScore: 8
    },
    sideEffects: [
      { name: 'Heart palpitations', severity: 'moderate', probability: 'uncommon' },
      { name: 'Insomnia', severity: 'mild', probability: 'common' },
      { name: 'Weight changes', severity: 'mild', probability: 'common' }
    ],
    interactions: [
      { medication: 'Calcium supplements', severity: 'moderate', effect: 'Reduced absorption' },
      { medication: 'Antacids', severity: 'moderate', effect: 'Reduced absorption' }
    ]
  }
];

const MedicationSimulation: React.FC<MedicationSimulationProps> = ({
  initialHealthData,
  patientProfile
}) => {
  const { t } = useTranslation();
  const [selectedMedications, setSelectedMedications] = useState<number[]>([]);
  const [expandedMedication, setExpandedMedication] = useState<number | null>(null);
  const [projectedMetrics, setProjectedMetrics] = useState({
    healthScore: initialHealthData.healthScore,
    bloodPressure: initialHealthData.metrics.bloodPressure,
    bloodSugar: initialHealthData.metrics.bloodSugar,
    cholesterol: initialHealthData.metrics.cholesterol
  });
  const [interactionWarnings, setInteractionWarnings] = useState<{
    medication1: string;
    medication2: string;
    severity: string;
    effect: string;
  }[]>([]);

  // FDA-enhanced states
  const [fdaAnalysis, setFdaAnalysis] = useState<HealthImpactAnalysis | null>(null);
  const [medicationLabels, setMedicationLabels] = useState<Map<string, DrugLabel>>(new Map());
  const [loadingFdaData, setLoadingFdaData] = useState(false);
  const [fdaDataEnabled, setFdaDataEnabled] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);
  
  // Load FDA data for selected medications
  useEffect(() => {
    const loadFDAData = async () => {
      if (!fdaDataEnabled || selectedMedications.length === 0) {
        setFdaAnalysis(null);
        setSafetyAlerts([]);
        return;
      }

      setLoadingFdaData(true);
      try {
        const selectedMedicationNames = selectedMedications
          .map(id => MEDICATIONS.find(med => med.id === id)?.name)
          .filter(Boolean) as string[];

        // Get comprehensive FDA analysis
        const analysis = await fdaDataProcessor.analyzeMedicationRisks({
          medications: selectedMedicationNames,
          age: patientProfile?.age,
          gender: patientProfile?.gender,
          weight: patientProfile?.weight,
          conditions: patientProfile?.conditions,
          allergies: patientProfile?.allergies
        });

        setFdaAnalysis(analysis);

        // Get real-time safety alerts
        const alerts = await fdaDataProcessor.getRealTimeSafetyAlerts(selectedMedicationNames);
        setSafetyAlerts(alerts);

        // Load drug labels for detailed information
        const labels = new Map<string, DrugLabel>();
        for (const medName of selectedMedicationNames) {
          try {
            const label = await openFDAService.getDrugLabel(medName);
            if (label) {
              labels.set(medName, label);
            }
          } catch (error) {
            console.error(`Error loading label for ${medName}:`, error);
          }
        }
        setMedicationLabels(labels);

      } catch (error) {
        console.error('Error loading FDA data:', error);
        setFdaAnalysis(null);
      } finally {
        setLoadingFdaData(false);
      }
    };

    loadFDAData();
  }, [selectedMedications, fdaDataEnabled, patientProfile]);

  // Update projected metrics when selected medications change
  useEffect(() => {
    // Start with initial health data
    let newHealthScore = initialHealthData.healthScore;
    let newBloodPressure = initialHealthData.metrics.bloodPressure;
    let newBloodSugar = initialHealthData.metrics.bloodSugar;
    let newCholesterol = initialHealthData.metrics.cholesterol;
    
    // Apply effects of each selected medication
    selectedMedications.forEach(medId => {
      const medication = MEDICATIONS.find(med => med.id === medId);
      if (!medication) return;
      
      // Add health score effect
      if (medication.effects.healthScore) {
        newHealthScore += medication.effects.healthScore;
      }
      
      // Apply blood pressure effect
      if (medication.effects.bloodPressure) {
        const [systolic, diastolic] = newBloodPressure.split('/').map(Number);
        const newSystolic = systolic + medication.effects.bloodPressure;
        const newDiastolic = diastolic + Math.round(medication.effects.bloodPressure * 0.6);
        newBloodPressure = `${newSystolic}/${newDiastolic}`;
      }
      
      // Apply blood sugar effect
      if (medication.effects.bloodSugar) {
        newBloodSugar += medication.effects.bloodSugar;
      }
      
      // Apply cholesterol effect
      if (medication.effects.cholesterol) {
        newCholesterol += medication.effects.cholesterol;
      }
    });
    
    // Apply FDA safety score adjustment if available
    if (fdaAnalysis && fdaDataEnabled) {
      // Reduce health score based on FDA risk assessment
      const safetyPenalty = (fdaAnalysis.overallRiskScore / 100) * 15; // Max 15 point penalty
      newHealthScore -= safetyPenalty;

      // Apply additional penalties for high-risk medications
      const criticalMeds = fdaAnalysis.medicationRisks.filter(risk => risk.riskLevel === 'critical');
      const highRiskMeds = fdaAnalysis.medicationRisks.filter(risk => risk.riskLevel === 'high');

      newHealthScore -= criticalMeds.length * 10; // 10 points per critical medication
      newHealthScore -= highRiskMeds.length * 5;  // 5 points per high-risk medication
    }

    // Ensure values stay within reasonable ranges
    newHealthScore = Math.max(0, Math.min(100, newHealthScore));
    newBloodSugar = Math.max(70, newBloodSugar);
    newCholesterol = Math.max(120, newCholesterol);

    // Update projected metrics
    setProjectedMetrics({
      healthScore: Math.round(newHealthScore),
      bloodPressure: newBloodPressure,
      bloodSugar: Math.round(newBloodSugar),
      cholesterol: Math.round(newCholesterol)
    });
    
    // Check for medication interactions
    const warnings: {
      medication1: string;
      medication2: string;
      severity: string;
      effect: string;
    }[] = [];
    
    // Compare each pair of selected medications
    for (let i = 0; i < selectedMedications.length; i++) {
      for (let j = i + 1; j < selectedMedications.length; j++) {
        const med1 = MEDICATIONS.find(med => med.id === selectedMedications[i]);
        const med2 = MEDICATIONS.find(med => med.id === selectedMedications[j]);
        
        if (!med1 || !med2) continue;
        
        // Check if med1 has interactions with med2
        const interaction = med1.interactions.find(
          int => int.medication.toLowerCase() === med2.name.toLowerCase() ||
                med2.category.toLowerCase().includes(int.medication.toLowerCase())
        );
        
        if (interaction) {
          warnings.push({
            medication1: med1.name,
            medication2: med2.name,
            severity: interaction.severity,
            effect: interaction.effect
          });
        }
        
        // Also check if med2 has interactions with med1
        const reverseInteraction = med2.interactions.find(
          int => int.medication.toLowerCase() === med1.name.toLowerCase() ||
                med1.category.toLowerCase().includes(int.medication.toLowerCase())
        );
        
        if (reverseInteraction && !interaction) {
          warnings.push({
            medication1: med2.name,
            medication2: med1.name,
            severity: reverseInteraction.severity,
            effect: reverseInteraction.effect
          });
        }
      }
    }
    
    setInteractionWarnings(warnings);
  }, [selectedMedications, initialHealthData]);
  
  // Toggle medication selection
  const toggleMedication = (medId: number) => {
    if (selectedMedications.includes(medId)) {
      setSelectedMedications(selectedMedications.filter(id => id !== medId));
    } else {
      setSelectedMedications([...selectedMedications, medId]);
    }
  };
  
  // Toggle medication details expansion
  const toggleExpand = (medId: number) => {
    if (expandedMedication === medId) {
      setExpandedMedication(null);
    } else {
      setExpandedMedication(medId);
    }
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'text-yellow-500';
      case 'moderate':
        return 'text-orange-500';
      case 'severe':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get probability description
  const getProbabilityDescription = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'very common':
        return t('medication.veryCommon', 'Very common (>10%)');
      case 'common':
        return t('medication.common', 'Common (1-10%)');
      case 'uncommon':
        return t('medication.uncommon', 'Uncommon (0.1-1%)');
      case 'rare':
        return t('medication.rare', 'Rare (<0.1%)');
      default:
        return probability;
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('medication.simulationTitle', 'Medication Effect Simulation')}
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <button
              onClick={() => setFdaDataEnabled(!fdaDataEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                fdaDataEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  fdaDataEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              FDA Data
            </span>
            <Database className="w-4 h-4 ml-1 text-blue-500" />
          </div>
          {loadingFdaData && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Loading FDA data...
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {t('medication.simulationDescription', 'Select medications to see how they might affect your health metrics and learn about potential side effects and interactions.')}
        {fdaDataEnabled && (
          <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400">
            <Shield className="w-4 h-4 inline mr-1" />
            Enhanced with real FDA adverse event data and safety information.
          </span>
        )}
      </p>

      {/* FDA Safety Alerts */}
      {fdaDataEnabled && safetyAlerts.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h4 className="font-medium text-red-700 dark:text-red-400">
              Recent FDA Safety Alerts
            </h4>
          </div>
          <div className="space-y-2">
            {safetyAlerts.map((alert, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-100 dark:border-red-900">
                <p className="text-sm text-gray-700 dark:text-gray-300">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Medication selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            {t('medication.availableMedications', 'Available Medications')}
          </h4>
          <div className="space-y-3">
            {MEDICATIONS.map(medication => (
              <div 
                key={medication.id} 
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedMedications.includes(medication.id) 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleMedication(medication.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
                          selectedMedications.includes(medication.id)
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedMedications.includes(medication.id) && <Check className="w-3 h-3" />}
                      </button>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{medication.name}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{medication.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(medication.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {expandedMedication === medication.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{medication.primaryEffect}</span>
                  </div>
                </div>
                
                {expandedMedication === medication.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {/* FDA Risk Assessment */}
                    {fdaDataEnabled && fdaAnalysis && (
                      <div className="mb-4">
                        {(() => {
                          const medicationRisk = fdaAnalysis.medicationRisks.find(
                            risk => risk.medication.toLowerCase() === medication.name.toLowerCase()
                          );

                          if (!medicationRisk) return null;

                          return (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                  <Shield className="w-4 h-4 mr-1 text-blue-500" />
                                  FDA Risk Assessment
                                </h6>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  medicationRisk.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                  medicationRisk.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                                  medicationRisk.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                }`}>
                                  {medicationRisk.riskLevel.toUpperCase()} RISK
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                <div>Adverse Events: {medicationRisk.adverseEventCount} reported</div>
                                <div>Serious Events: {medicationRisk.seriousEventCount} reported</div>
                                {medicationRisk.recalls.length > 0 && (
                                  <div className="text-red-600 dark:text-red-400">
                                    Active Recalls: {medicationRisk.recalls.length}
                                  </div>
                                )}
                              </div>
                              {medicationRisk.commonSideEffects.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Most Reported Side Effects:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {medicationRisk.commonSideEffects.slice(0, 3).map((effect, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                                        {effect}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="mb-3">
                      <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {t('medication.sideEffects', 'Potential Side Effects')}
                      </h6>
                      <ul className="space-y-1">
                        {medication.sideEffects.map((effect, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className={`mr-1 ${getSeverityColor(effect.severity)}`}>•</span>
                            <span className="text-gray-600 dark:text-gray-300">
                              {effect.name}
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                ({getProbabilityDescription(effect.probability)})
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {t('medication.interactions', 'Known Interactions')}
                      </h6>
                      <ul className="space-y-1">
                        {medication.interactions.map((interaction, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className={`mr-1 ${getSeverityColor(interaction.severity)}`}>•</span>
                            <span className="text-gray-600 dark:text-gray-300">
                              <strong>{interaction.medication}</strong>: {interaction.effect}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            {t('medication.projectedEffects', 'Projected Effects')}
          </h4>
          
          {/* FDA Warnings */}
          {fdaDataEnabled && fdaAnalysis && fdaAnalysis.warnings.length > 0 && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <h5 className="font-medium text-red-700 dark:text-red-400">
                  FDA Safety Warnings
                </h5>
              </div>
              <ul className="space-y-2">
                {fdaAnalysis.warnings.map((warning, index) => (
                  <li key={index} className="text-sm bg-white dark:bg-gray-800 rounded p-2 border border-red-100 dark:border-red-900">
                    <p className="text-gray-700 dark:text-gray-300">{warning}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interaction warnings */}
          {interactionWarnings.length > 0 && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h5 className="font-medium text-red-700 dark:text-red-400">
                  {t('medication.interactionWarning', 'Potential Medication Interactions')}
                </h5>
              </div>
              <ul className="space-y-2">
                {interactionWarnings.map((warning, index) => (
                  <li key={index} className="text-sm bg-white dark:bg-gray-800 rounded p-2 border border-red-100 dark:border-red-900">
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        warning.severity === 'severe' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                        warning.severity === 'moderate' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      } mr-2`}>
                        {warning.severity.toUpperCase()}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {warning.medication1} + {warning.medication2}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">{warning.effect}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Health metrics changes */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                {t('medication.healthScore', 'Health Score')}
              </h5>
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                projectedMetrics.healthScore > initialHealthData.healthScore
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : projectedMetrics.healthScore < initialHealthData.healthScore
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {projectedMetrics.healthScore > initialHealthData.healthScore
                  ? `+${projectedMetrics.healthScore - initialHealthData.healthScore}`
                  : projectedMetrics.healthScore < initialHealthData.healthScore
                  ? projectedMetrics.healthScore - initialHealthData.healthScore
                  : '0'}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-blue-500" 
                  style={{ width: `${projectedMetrics.healthScore}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {projectedMetrics.healthScore}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('medication.bloodPressure', 'Blood Pressure')}
              </h5>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('common.from')}: 
                  </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {initialHealthData.metrics.bloodPressure}
                  </span>
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {projectedMetrics.bloodPressure}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('medication.bloodSugar', 'Blood Sugar')}
              </h5>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('common.from')}: 
                  </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {initialHealthData.metrics.bloodSugar}
                  </span>
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {projectedMetrics.bloodSugar}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('medication.cholesterol', 'Cholesterol')}
              </h5>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('common.from')}: 
                  </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {initialHealthData.metrics.cholesterol}
                  </span>
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {projectedMetrics.cholesterol}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('medication.timeToEffect', 'Time to Full Effect')}
              </h5>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-900 dark:text-white">
                  {selectedMedications.length > 0 ? '2-4 weeks' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* FDA Recommendations */}
          {fdaDataEnabled && fdaAnalysis && fdaAnalysis.recommendations.length > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Shield className="w-5 h-5 text-green-500 mr-2" />
                <h5 className="font-medium text-green-700 dark:text-green-400">
                  FDA Safety Recommendations
                </h5>
              </div>
              <ul className="space-y-1">
                {fdaAnalysis.recommendations.slice(0, 5).map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Selected medications summary */}
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('medication.selectedMedications', 'Selected Medications')}
            </h5>
            {selectedMedications.length > 0 ? (
              <div className="space-y-2">
                {selectedMedications.map(medId => {
                  const medication = MEDICATIONS.find(med => med.id === medId);
                  if (!medication) return null;

                  // Get FDA risk level for this medication
                  const medicationRisk = fdaDataEnabled && fdaAnalysis
                    ? fdaAnalysis.medicationRisks.find(risk =>
                        risk.medication.toLowerCase() === medication.name.toLowerCase()
                      )
                    : null;

                  return (
                    <div key={medication.id} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 px-3">
                      <div className="flex items-center">
                        <Pill className="w-4 h-4 text-blue-500 mr-2" />
                        <div>
                          <span className="text-gray-900 dark:text-white">{medication.name}</span>
                          {medicationRisk && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                              medicationRisk.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                              medicationRisk.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                              medicationRisk.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            }`}>
                              {medicationRisk.riskLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMedication(medication.id)}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {t('medication.noMedicationsSelected', 'No medications selected')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center mb-1">
          <AlertCircle className="w-4 h-4 text-blue-500 mr-2" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('medication.disclaimer', 'Medical Disclaimer')}
          </span>
        </div>
        <p className="mb-2">
          {t('medication.disclaimerText', 'This simulation is for educational purposes only and does not constitute medical advice. Always consult with a healthcare provider before starting or changing medications.')}
        </p>
        {fdaDataEnabled && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <ExternalLink className="w-3 h-3 inline mr-1" />
            FDA data sourced from openFDA API. Adverse event reports are voluntary and do not establish causation.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default MedicationSimulation;
