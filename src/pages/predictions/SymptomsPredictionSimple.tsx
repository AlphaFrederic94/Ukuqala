import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Loader2, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../lib/predictionService';
import { apiClient } from '../../lib/apiClient';

interface DiseaseInfo {
  disease: string;
  confidence: number;
  description: string;
  precautions: string[];
  matching_symptoms: string[];
  total_disease_symptoms: number;
}

interface PredictionResult {
  top_predictions?: DiseaseInfo[];
  symptom_severity?: Record<string, number>;
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
        const data = await apiClient.get('/api/advanced/symptoms/symptoms');
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

    // Simple client-side filtering
    const filtered = availableSymptoms.filter(symptom =>
      symptom.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
    setFilteredSymptoms(filtered);
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
      // Get top predictions using the API client
      const result = await apiClient.post('/api/advanced/symptoms/predict/top', {
        symptoms: selectedSymptoms,
        top_n: 3
      });
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
        }
      }
    } catch (err) {
      console.error('Error during prediction:', err);
      setError('Failed to process the symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Prediction Results */}
          {prediction && prediction.top_predictions && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Prediction Results</h2>

              <div className="space-y-4">
                {prediction.top_predictions.map((pred, index) => (
                  <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium dark:text-white">{pred.disease}</h3>
                      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {pred.confidence}% match
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{pred.description}</p>

                    {pred.precautions && pred.precautions.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Precautions:</h4>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                          {pred.precautions.map((precaution, i) => (
                            <li key={i}>{precaution}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
