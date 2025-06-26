import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Database,
  Shield,
  Pill,
  FileText,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { medicationVerificationSystem, VerificationResult, MedicationVerification, MedicationError } from '../../lib/medicationVerificationSystem';
import { toast } from 'react-hot-toast';

interface MedicationInput {
  id: string;
  name: string;
  dosage: string;
  route: string;
}

const MedicationVerification: React.FC = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<MedicationInput[]>([
    { id: '1', name: '', dosage: '', route: '' }
  ]);
  const [verificationResults, setVerificationResults] = useState<Map<string, VerificationResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);

  const addMedication = () => {
    const newMedication: MedicationInput = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      route: ''
    };
    setMedications([...medications, newMedication]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
      verificationResults.delete(id);
      setVerificationResults(new Map(verificationResults));
    }
  };

  const updateMedication = (id: string, field: keyof MedicationInput, value: string) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const verifyMedication = async (medication: MedicationInput) => {
    if (!medication.name.trim()) return;

    setLoading(true);
    try {
      const result = await medicationVerificationSystem.verifyMedication(
        medication.name,
        medication.dosage || undefined,
        medication.route || undefined
      );

      setVerificationResults(new Map(verificationResults.set(medication.id, result)));
      
      if (result.verification.status === 'verified') {
        toast.success(`${medication.name} verified successfully`);
      } else if (result.verification.status === 'partial_match') {
        toast(`${medication.name} partially matched`, { icon: '⚠️' });
      } else {
        toast.error(`Could not verify ${medication.name}`);
      }
    } catch (error) {
      console.error('Error verifying medication:', error);
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyAllMedications = async () => {
    const medicationsToVerify = medications.filter(med => med.name.trim());
    if (medicationsToVerify.length === 0) return;

    setLoading(true);
    try {
      const results = await medicationVerificationSystem.batchVerifyMedications(
        medicationsToVerify.map(med => ({
          name: med.name,
          dosage: med.dosage || undefined,
          route: med.route || undefined
        }))
      );

      const newResults = new Map(verificationResults);
      medicationsToVerify.forEach((med, index) => {
        newResults.set(med.id, results[index]);
      });
      setVerificationResults(newResults);

      const verified = results.filter(r => r.verification.status === 'verified').length;
      toast.success(`Verified ${verified} of ${results.length} medications`);
    } catch (error) {
      console.error('Error batch verifying medications:', error);
      toast.error('Batch verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'partial_match': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'multiple_matches': return 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 'not_found': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      default: return 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5" />;
      case 'partial_match': return <AlertCircle className="w-5 h-5" />;
      case 'multiple_matches': return <Search className="w-5 h-5" />;
      case 'not_found': return <AlertTriangle className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  const getErrorSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Medication Verification
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={addMedication}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </button>
            <button
              onClick={verifyAllMedications}
              disabled={loading || medications.every(med => !med.name.trim())}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Verifying...' : 'Verify All'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Database className="w-4 h-4 mr-2" />
            <span>Powered by FDA NDC Directory for accurate medication identification</span>
          </div>
        </div>
      </div>

      {/* Medication Input Forms */}
      <div className="space-y-4">
        {medications.map((medication, index) => (
          <motion.div
            key={medication.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Medication {index + 1}
              </h3>
              {medications.length > 1 && (
                <button
                  onClick={() => removeMedication(medication.id)}
                  className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={medication.name}
                  onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                  placeholder="Enter medication name"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dosage
                </label>
                <input
                  type="text"
                  value={medication.dosage}
                  onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                  placeholder="e.g., 10mg"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Route
                </label>
                <select
                  value={medication.route}
                  onChange={(e) => updateMedication(medication.id, 'route', e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select route</option>
                  <option value="oral">Oral</option>
                  <option value="injection">Injection</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                  <option value="sublingual">Sublingual</option>
                  <option value="rectal">Rectal</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => verifyMedication(medication)}
                disabled={!medication.name.trim() || loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4 mr-2" />
                Verify
              </button>

              {verificationResults.has(medication.id) && (
                <button
                  onClick={() => setSelectedMedication(selectedMedication === medication.id ? null : medication.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {selectedMedication === medication.id ? 'Hide Details' : 'View Details'}
                </button>
              )}
            </div>

            {/* Verification Result */}
            {verificationResults.has(medication.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                {(() => {
                  const result = verificationResults.get(medication.id)!;
                  const verification = result.verification;
                  
                  return (
                    <div className="space-y-4">
                      {/* Status */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(verification.status)}`}>
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(verification.status)}
                          <div>
                            <p className="font-medium">
                              {verification.status === 'verified' ? 'Verified' :
                               verification.status === 'partial_match' ? 'Partial Match' :
                               verification.status === 'multiple_matches' ? 'Multiple Matches' :
                               'Not Found'}
                            </p>
                            {verification.verifiedName !== verification.inputName && (
                              <p className="text-sm">Verified as: {verification.verifiedName}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {Math.round(verification.confidence * 100)}% confidence
                          </p>
                          {verification.ndc && (
                            <p className="text-xs">NDC: {verification.ndc}</p>
                          )}
                        </div>
                      </div>

                      {/* Errors */}
                      {result.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Issues Found:</h4>
                          {result.errors.map((error, idx) => (
                            <div key={idx} className={`p-3 rounded-lg ${getErrorSeverityColor(error.severity)}`}>
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                <div>
                                  <p className="font-medium">{error.message}</p>
                                  <p className="text-sm mt-1">{error.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings and Suggestions */}
                      {(verification.warnings.length > 0 || verification.suggestions.length > 0) && (
                        <div className="space-y-2">
                          {verification.warnings.map((warning, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">{warning}</span>
                            </div>
                          ))}
                          {verification.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                              <Info className="w-4 h-4" />
                              <span className="text-sm">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Detailed Information */}
                      <AnimatePresence>
                        {selectedMedication === medication.id && result.ndcProduct && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4"
                          >
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                              FDA Product Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Generic Name:</strong> {result.ndcProduct.generic_name}</p>
                                <p><strong>Brand Name:</strong> {result.ndcProduct.brand_name}</p>
                                <p><strong>Labeler:</strong> {result.ndcProduct.labeler_name}</p>
                                <p><strong>Dosage Form:</strong> {result.ndcProduct.dosage_form}</p>
                              </div>
                              <div>
                                <p><strong>Product Type:</strong> {result.ndcProduct.product_type}</p>
                                <p><strong>Route:</strong> {result.ndcProduct.route?.join(', ')}</p>
                                {result.ndcProduct.dea_schedule && (
                                  <p><strong>DEA Schedule:</strong> {result.ndcProduct.dea_schedule}</p>
                                )}
                              </div>
                            </div>
                            
                            {result.ndcProduct.active_ingredients && result.ndcProduct.active_ingredients.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Active Ingredients:</h5>
                                <div className="space-y-1">
                                  {result.ndcProduct.active_ingredients.map((ingredient, idx) => (
                                    <p key={idx} className="text-sm">
                                      {ingredient.name} - {ingredient.strength}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      {verificationResults.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verification Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { status: 'verified', label: 'Verified', color: 'text-green-600' },
              { status: 'partial_match', label: 'Partial Match', color: 'text-yellow-600' },
              { status: 'multiple_matches', label: 'Multiple Matches', color: 'text-blue-600' },
              { status: 'not_found', label: 'Not Found', color: 'text-red-600' }
            ].map(({ status, label, color }) => {
              const count = Array.from(verificationResults.values())
                .filter(result => result.verification.status === status).length;
              
              return (
                <div key={status} className="text-center">
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MedicationVerification;
