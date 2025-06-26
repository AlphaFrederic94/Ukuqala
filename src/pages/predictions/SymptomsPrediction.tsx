import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle2, Loader2, Stethoscope, Printer } from 'lucide-react';
import PrintReport from '../../components/PrintReport';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../lib/predictionService';
import { modelsApiClient } from '../../lib/modelsApiClient';

interface Symptom {
  name: string;
}

interface DiseaseInfo {
  disease: string;
  confidence: number;
  description: string;
  precautions: string[];
  matching_symptoms: string[];
  total_disease_symptoms: number;
}

interface PredictionResult {
  predicted_disease?: string;
  confidence?: number;
  description?: string;
  precautions?: string[];
  symptom_severity?: Record<string, number>;
  matching_symptoms?: string[];
  total_disease_symptoms?: number;
  top_predictions?: DiseaseInfo[];
}

export default function SymptomsPrediction() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);

  // Fetch available symptoms on component mount
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const data = await modelsApiClient.symptoms.getAllSymptoms();
        setAvailableSymptoms(data.symptoms);
        setLoadingSymptoms(false);
      } catch (err) {
        console.error('Error fetching symptoms:', err);
        setError('Failed to load symptoms. Please try again later.');
        setLoadingSymptoms(false);
      }
    };

    fetchSymptoms();
  }, []);

  // Filter symptoms based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSymptoms([]);
      return;
    }

    const fetchSimilarSymptoms = async () => {
      try {
        // Use the models API client to get similar symptoms
        const data = await modelsApiClient.post(`/api/advanced/symptoms/symptoms/similar`, {
          partial_symptom: searchTerm,
          limit: 10
        });
        setFilteredSymptoms(data.matches);
      } catch (err) {
        console.error('Error fetching similar symptoms:', err);
        // Fallback to client-side filtering if API fails
        const filtered = availableSymptoms.filter(symptom =>
          symptom.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
        setFilteredSymptoms(filtered);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchSimilarSymptoms();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, availableSymptoms]);

  const addSymptom = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setSearchTerm('');
    setFilteredSymptoms([]);
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const handlePrediction = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setLoading(true);
    setPrediction(null);
    setError(null);

    try {
      // Get top predictions using the models API client
      const result = await modelsApiClient.symptoms.predictTopDiseases(selectedSymptoms, 3);
      setPrediction(result);

      // Save prediction to database
      if (user && result && result.top_predictions && result.top_predictions.length > 0) {
        try {
          const topPrediction = result.top_predictions[0];
          await predictionService.savePrediction({
            user_id: user.id,
            prediction_type: 'symptoms',
            title: 'Symptoms Analysis',
            result: `${topPrediction.disease} (${topPrediction.confidence}% match)`,
            risk_level: topPrediction.confidence > 70 ? 'high' : topPrediction.confidence > 40 ? 'moderate' : 'low',
            result_details: {
              top_predictions: result.top_predictions,
              symptoms: selectedSymptoms
            }
          });
          console.log('Symptoms prediction saved to database');
        } catch (saveError) {
          console.error('Error saving prediction to database:', saveError);
          // Continue with the UI flow even if saving fails
        }
      }
    } catch (err) {
      console.error('Error during prediction:', err);
      setError('Failed to process the symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 7) return 'High';
    if (severity >= 4) return 'Medium';
    return 'Low';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'text-red-600 bg-red-100';
    if (severity >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Symptoms Prediction</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced AI model analyzes your symptoms to predict possible conditions.
              Enter your symptoms below to get started.
            </p>
          </div>

          {/* Symptom Search */}
          <div className="mb-8">
            <div className="relative">
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <Search className="h-5 w-5 ml-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for symptoms..."
                  className="flex-1 p-3 outline-none dark:bg-gray-800 dark:text-white"
                  disabled={loadingSymptoms}
                />
              </div>

              {/* Dropdown for search results */}
              {filteredSymptoms.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSymptoms.map((symptom) => (
                    <div
                      key={symptom}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-white"
                      onClick={() => addSymptom(symptom)}
                    >
                      {symptom}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Symptoms */}
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 dark:text-white">Selected Symptoms:</h3>
              {selectedSymptoms.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No symptoms selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom) => (
                    <div
                      key={symptom}
                      className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full"
                    >
                      <span>{symptom}</span>
                      <button
                        onClick={() => removeSymptom(symptom)}
                        className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Predict Button */}
            <div className="mt-6">
              <button
                onClick={handlePrediction}
                disabled={selectedSymptoms.length === 0 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Symptoms...
                  </>
                ) : (
                  'Predict Condition'
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Prediction Results Modal */}
          {prediction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center">
                    <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                    <h3 className="text-xl font-semibold dark:text-white">Symptoms Analysis Results</h3>
                  </div>
                  <button
                    onClick={() => setPrediction(null)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  {/* Selected Symptoms Summary */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Analyzed Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map((symptom) => (
                        <span key={symptom} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Predictions */}
                  {prediction.top_predictions && prediction.top_predictions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold dark:text-white mb-4">Possible Conditions</h4>

                      <div className="space-y-4">
                        {prediction.top_predictions.map((pred, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden dark:border-gray-700">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-between items-center">
                              <h5 className="text-lg font-medium dark:text-white">{pred.disease}</h5>
                              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                {pred.confidence}% match
                              </span>
                            </div>

                            <div className="p-4">
                              <p className="text-gray-600 dark:text-gray-300 mb-4">{pred.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Matching Symptoms */}
                                <div>
                                  <h6 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Matching Symptoms ({pred.matching_symptoms.length} of {pred.total_disease_symptoms})
                                  </h6>
                                  <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    {pred.matching_symptoms.map((symptom) => (
                                      <span
                                        key={symptom}
                                        className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full"
                                      >
                                        {symptom}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Precautions */}
                                {pred.precautions && pred.precautions.length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Precautions</h6>
                                    <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                      {pred.precautions.map((precaution, i) => (
                                        <li key={i}>{precaution}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symptom Severity */}
                  {prediction.symptom_severity && Object.keys(prediction.symptom_severity).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold dark:text-white mb-3">Symptom Severity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        {Object.entries(prediction.symptom_severity).map(([symptom, severity]) => (
                          <div key={symptom} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="dark:text-white">{symptom}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(severity)}`}>
                              {getSeverityLabel(severity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-900 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Disclaimer</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          This prediction is based on the symptoms you provided and should not be considered as a medical diagnosis.
                          Please consult with a healthcare professional for proper evaluation and treatment.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => setPrediction(null)}
                      className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // Get user information from context or use defaults
                        const patientName = user?.user_metadata?.full_name || 'Patient';
                        const patientAge = user?.user_metadata?.age || 'N/A';
                        const patientBloodGroup = user?.user_metadata?.blood_group || 'N/A';

                        // Format parameters for display
                        const parameters = [
                          { name: 'Reported Symptoms', value: selectedSymptoms.join(', ') },
                        ];

                        // Get top predictions
                        let topPredictionsHtml = '';
                        if (prediction.top_predictions && prediction.top_predictions.length > 0) {
                          topPredictionsHtml = `
                            <div class="mb-4">
                              <h3 class="font-medium text-gray-700 mb-2">Possible Conditions:</h3>
                              <div class="space-y-2">
                                ${prediction.top_predictions.map((pred, index) => `
                                  <div class="p-3 border rounded-lg">
                                    <div class="flex justify-between">
                                      <span class="font-medium">${pred.disease}</span>
                                      <span class="text-blue-600">${pred.confidence}% match</span>
                                    </div>
                                    ${pred.description ? `<p class="text-sm text-gray-600 mt-1">${pred.description}</p>` : ''}
                                  </div>
                                `).join('')}
                              </div>
                            </div>
                          `;
                        }

                        // Create recommendations HTML
                        let recommendationsHtml = '';
                        const recommendations = prediction.top_predictions && prediction.top_predictions.length > 0 &&
                          prediction.top_predictions[0].precautions ? prediction.top_predictions[0].precautions : [];

                        if (recommendations.length > 0) {
                          recommendationsHtml = `
                            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                              <h3 class="font-medium text-blue-800 mb-2">Recommendations:</h3>
                              <ul class="list-disc pl-5 space-y-1">
                                ${recommendations.map(rec => `<li class="text-blue-800">${rec}</li>`).join('')}
                              </ul>
                            </div>
                          `;
                        }

                        // Create symptom severity HTML
                        let severityHtml = '';
                        if (prediction.symptom_severity && Object.keys(prediction.symptom_severity).length > 0) {
                          severityHtml = `
                            <div class="mb-4">
                              <h3 class="font-medium text-gray-700 mb-2">Symptom Severity:</h3>
                              <div class="grid grid-cols-2 gap-2">
                                ${Object.entries(prediction.symptom_severity).map(([symptom, severity]) => `
                                  <div class="flex justify-between items-center p-2 border rounded-lg">
                                    <span>${symptom}</span>
                                    <span class="px-2 py-1 text-xs rounded-full ${severity >= 7 ? 'bg-red-100 text-red-800' : severity >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                      ${severity >= 7 ? 'High' : severity >= 4 ? 'Medium' : 'Low'}
                                    </span>
                                  </div>
                                `).join('')}
                              </div>
                            </div>
                          `;
                        }

                        // Calculate risk level and probability
                        const riskLevel = prediction.top_predictions && prediction.top_predictions.length > 0 ?
                          (prediction.top_predictions[0].confidence > 70 ? 'High' :
                           prediction.top_predictions[0].confidence > 40 ? 'Moderate' : 'Low') : 'Low';

                        const probability = prediction.top_predictions && prediction.top_predictions.length > 0 ?
                          prediction.top_predictions[0].confidence : 0;

                        // Get risk level color
                        const getRiskColor = (level) => {
                          if (level === 'High') return 'bg-red-50 text-red-800';
                          if (level === 'Moderate') return 'bg-yellow-50 text-yellow-800';
                          return 'bg-green-50 text-green-800';
                        };

                        // Open a new window with the print report
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          // Get current date in DD/MM/YYYY format
                          const today = new Date();
                          const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

                          // Generate a random report ID
                          const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();

                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Symptoms Analysis Report</title>
                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                <style>
                                  @media print {
                                    @page { margin: 20mm; }
                                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                                  }
                                  body { font-family: Arial, sans-serif; }
                                </style>
                              </head>
                              <body class="bg-white p-8 max-w-4xl mx-auto">
                                <!-- Report Header -->
                                <div class="flex justify-between items-center border-b pb-6 mb-6">
                                  <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    <div class="ml-4">
                                      <h1 class="text-2xl font-bold text-gray-800">Symptoms Analysis</h1>
                                      <p class="text-gray-500">Assessment Report</p>
                                    </div>
                                  </div>
                                  <div class="text-right">
                                    <p class="text-gray-500">Report Date: ${formattedDate}</p>
                                    <p class="text-gray-500">Report ID: ${reportId}</p>
                                  </div>
                                </div>

                                <!-- Patient Information -->
                                <div class="mb-8 p-4 bg-gray-50 rounded-lg">
                                  <h2 class="text-lg font-semibold mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Patient Information
                                  </h2>
                                  <div class="grid grid-cols-3 gap-4">
                                    <div>
                                      <p class="text-gray-500 text-sm">Full Name</p>
                                      <p class="font-medium">${patientName}</p>
                                    </div>
                                    <div>
                                      <p class="text-gray-500 text-sm">Age</p>
                                      <p class="font-medium">${patientAge}</p>
                                    </div>
                                    <div>
                                      <p class="text-gray-500 text-sm">Blood Group</p>
                                      <p class="font-medium">${patientBloodGroup}</p>
                                    </div>
                                  </div>
                                </div>

                                <!-- Assessment Parameters -->
                                <div class="mb-8">
                                  <h2 class="text-lg font-semibold mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Assessment Parameters
                                  </h2>
                                  <div class="border rounded-lg overflow-hidden">
                                    <table class="w-full">
                                      <thead class="bg-gray-50">
                                        <tr>
                                          <th class="px-4 py-2 text-left text-gray-600">Parameter</th>
                                          <th class="px-4 py-2 text-left text-gray-600">Value</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${parameters.map((param, index) => `
                                          <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                            <td class="px-4 py-2 border-t">${param.name}</td>
                                            <td class="px-4 py-2 border-t">${param.value}</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <!-- Assessment Results -->
                                <div class="mb-8">
                                  <h2 class="text-lg font-semibold mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Assessment Results
                                  </h2>

                                  <!-- Risk Level -->
                                  <div class="p-4 mb-4 rounded-lg flex items-center ${getRiskColor(riskLevel)}">
                                    <div class="p-2 rounded-full mr-3 bg-opacity-50 ${riskLevel === 'High' ? 'bg-red-200' : riskLevel === 'Moderate' ? 'bg-yellow-200' : 'bg-green-200'}">
                                      ${riskLevel === 'High' ? `
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                      ` : `
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                      `}
                                    </div>
                                    <div>
                                      <h4 class="font-bold text-lg">${riskLevel} Risk</h4>
                                      <p class="text-sm opacity-90">Probability: ${probability}%</p>
                                    </div>
                                  </div>

                                  <!-- Top Predictions -->
                                  ${topPredictionsHtml}

                                  <!-- Symptom Severity -->
                                  ${severityHtml}

                                  <!-- Recommendations -->
                                  ${recommendationsHtml}
                                </div>

                                <!-- Disclaimer -->
                                <div class="mb-8 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                  <p class="font-medium mb-1">Disclaimer:</p>
                                  <p>
                                    This assessment is based on the information provided and should not be considered as a medical diagnosis.
                                    Please consult with a healthcare professional for proper evaluation and treatment recommendations.
                                  </p>
                                </div>

                                <!-- Signature -->
                                <div class="mt-12 pt-6 border-t">
                                  <div class="flex justify-between items-center">
                                    <div>
                                      <p class="text-gray-500 text-sm">Generated by</p>
                                      <p class="font-medium">CareAI Health Assessment System</p>
                                    </div>
                                    <div class="text-right">
                                      <p class="text-gray-500 text-sm">Model Developers</p>
                                      <p class="font-medium">CareAiX Team</p>
                                    </div>
                                  </div>
                                </div>

                                <script>
                                  // Auto-print when loaded
                                  window.onload = function() {
                                    window.print();
                                    // Close after printing
                                    window.addEventListener('afterprint', function() {
                                      window.close();
                                    });
                                  }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
