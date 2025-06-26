import React, { useState, useRef } from 'react';
import { Heart, AlertCircle, CheckCircle2, Loader2, Printer } from 'lucide-react';
import PrintReport from '../../components/PrintReport';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../lib/predictionService';
import { useTranslation } from 'react-i18next';
import SocialShare from '../../components/social/SocialShare';

interface HeartDiseaseForm {
  age: string;
  sex: string;
  cp: string; // chest pain type
  trestbps: string; // resting blood pressure
  chol: string; // serum cholesterol
  fbs: string; // fasting blood sugar
  restecg: string; // resting electrocardiographic results
  thalach: string; // maximum heart rate achieved
  exang: string; // exercise induced angina
  oldpeak: string; // ST depression induced by exercise
  slope: string; // slope of the peak exercise ST segment
  ca: string; // number of major vessels colored by fluoroscopy
  thal: string; // thalassemia
}

interface HeartDiseasePrediction {
  prediction: number;
  probability: number;
  risk_level: string;
  recommendations: string[];
}

export default function HeartDisease() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState<HeartDiseaseForm>({
    age: '',
    sex: '',
    cp: '0',
    trestbps: '',
    chol: '',
    fbs: '0',
    restecg: '0',
    thalach: '',
    exang: '0',
    oldpeak: '0',
    slope: '0',
    ca: '0',
    thal: '1'
  });
  const [prediction, setPrediction] = useState<HeartDiseasePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/heart/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(form.age),
          sex: parseInt(form.sex),
          cp: parseInt(form.cp),
          trestbps: parseInt(form.trestbps),
          chol: parseInt(form.chol),
          fbs: parseInt(form.fbs),
          restecg: parseInt(form.restecg),
          thalach: parseInt(form.thalach),
          exang: parseInt(form.exang),
          oldpeak: parseFloat(form.oldpeak),
          slope: parseInt(form.slope),
          ca: parseInt(form.ca),
          thal: parseInt(form.thal)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process the data');
      }

      const result = await response.json();
      setPrediction(result);

      // Save prediction to database
      if (user && result) {
        try {
          await predictionService.savePrediction({
            user_id: user.id,
            prediction_type: 'heart_disease',
            title: 'Heart Disease Risk Assessment',
            result: result.risk_level,
            risk_level: result.risk_level.toLowerCase(),
            result_details: {
              probability: result.probability,
              recommendations: result.recommendations,
              prediction: result.prediction
            }
          });
          console.log('Heart disease prediction saved to database');
        } catch (saveError) {
          console.error('Error saving prediction to database:', saveError);
          // Continue with the UI flow even if saving fails
        }
      }
    } catch (err) {
      setError('Failed to process the data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Heart className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Heart Disease Risk Assessment</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI model analyzes various cardiovascular health metrics to assess your risk of heart disease.
              Early detection can help prevent complications and improve management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-red-900 dark:text-red-100">Why Heart Health Matters</h2>
              <ul className="space-y-3 text-red-800 dark:text-red-200">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Heart disease is the leading cause of death globally
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Early detection can prevent serious complications
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Lifestyle changes can significantly reduce risk
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Regular monitoring improves long-term outcomes
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Risk Factors</h2>
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">High Blood Pressure</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Damages arteries and increases heart workload
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">High Cholesterol</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Builds up in arteries, restricting blood flow
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Age &amp; Family History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Risk increases with age and genetic factors
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                  min="1"
                  max="120"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sex
                </label>
                <select
                  name="sex"
                  value={form.sex}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chest Pain Type
                </label>
                <select
                  name="cp"
                  value={form.cp}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">Typical Angina</option>
                  <option value="1">Atypical Angina</option>
                  <option value="2">Non-anginal Pain</option>
                  <option value="3">Asymptomatic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resting Blood Pressure (mm Hg)
                </label>
                <input
                  type="number"
                  name="trestbps"
                  value={form.trestbps}
                  onChange={handleChange}
                  required
                  min="80"
                  max="200"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter resting blood pressure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Serum Cholesterol (mg/dl)
                </label>
                <input
                  type="number"
                  name="chol"
                  value={form.chol}
                  onChange={handleChange}
                  required
                  min="100"
                  max="600"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter cholesterol level"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fasting Blood Sugar &gt; 120 mg/dl
                </label>
                <select
                  name="fbs"
                  value={form.fbs}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resting ECG Results
                </label>
                <select
                  name="restecg"
                  value={form.restecg}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">Normal</option>
                  <option value="1">ST-T Wave Abnormality</option>
                  <option value="2">Left Ventricular Hypertrophy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Heart Rate Achieved
                </label>
                <input
                  type="number"
                  name="thalach"
                  value={form.thalach}
                  onChange={handleChange}
                  required
                  min="60"
                  max="220"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter maximum heart rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exercise Induced Angina
                </label>
                <select
                  name="exang"
                  value={form.exang}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ST Depression Induced by Exercise
                </label>
                <input
                  type="number"
                  name="oldpeak"
                  value={form.oldpeak}
                  onChange={handleChange}
                  required
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter ST depression value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slope of Peak Exercise ST Segment
                </label>
                <select
                  name="slope"
                  value={form.slope}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">Upsloping</option>
                  <option value="1">Flat</option>
                  <option value="2">Downsloping</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Major Vessels Colored by Fluoroscopy
                </label>
                <select
                  name="ca"
                  value={form.ca}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thalassemia
                </label>
                <select
                  name="thal"
                  value={form.thal}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="1">Normal</option>
                  <option value="2">Fixed Defect</option>
                  <option value="3">Reversible Defect</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Assess Heart Disease Risk'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Modal - Always visible when prediction is available */}
          {prediction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                    <h3 className="text-xl font-semibold dark:text-white">Assessment Results</h3>
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
                  {/* Risk Level Banner */}
                  <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${prediction.risk_level === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : prediction.risk_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}`}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${prediction.risk_level === 'High' ? 'bg-red-200 dark:bg-red-800' : prediction.risk_level === 'Moderate' ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-green-200 dark:bg-green-800'}`}>
                        {prediction.risk_level === 'High' ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{prediction.risk_level} Risk</h4>
                        <p className="text-sm opacity-90">Probability: {prediction.probability}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-lg">Recommendations</h4>
                      <ul className="space-y-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {prediction.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg">
                    <p className="mb-2">
                      <strong>Note:</strong> This assessment is based on the information you provided and should not be considered as a medical diagnosis.
                    </p>
                    <p>
                      Please consult with a healthcare professional for proper evaluation and treatment recommendations.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => setPrediction(null)}
                      className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t('common.close')}
                    </button>
                    <button
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <SocialShare
                        title={`Heart Disease Risk Assessment: ${prediction.risk_level} Risk`}
                        text={`My heart disease risk assessment shows a ${prediction.risk_level.toLowerCase()} risk level with a ${(prediction.probability * 100).toFixed(1)}% probability. #HeartHealth #CareAI`}
                        platforms={['facebook', 'twitter', 'email', 'copy']}
                        buttonSize="md"
                        showLabel={true}
                      />
                    </button>
                    <button
                      onClick={() => {
                        // Get user information from context or use defaults
                        const patientName = user?.user_metadata?.full_name || 'Patient';
                        const patientAge = user?.user_metadata?.age || 'N/A';
                        const patientBloodGroup = user?.user_metadata?.blood_group || 'N/A';

                        // Format parameters for display
                        const parameters = [
                          { name: 'Age', value: form.age },
                          { name: 'Sex', value: form.sex === '1' ? 'Male' : 'Female' },
                          { name: 'Chest Pain Type', value: ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'][parseInt(form.cp)] },
                          { name: 'Resting Blood Pressure', value: `${form.trestbps} mmHg` },
                          { name: 'Serum Cholesterol', value: `${form.chol} mg/dl` },
                          { name: 'Fasting Blood Sugar > 120 mg/dl', value: form.fbs === '1' ? 'Yes' : 'No' },
                          { name: 'Resting ECG', value: ['Normal', 'ST-T Wave Abnormality', 'Left Ventricular Hypertrophy'][parseInt(form.restecg)] },
                          { name: 'Maximum Heart Rate', value: form.thalach },
                          { name: 'Exercise Induced Angina', value: form.exang === '1' ? 'Yes' : 'No' },
                          { name: 'ST Depression', value: form.oldpeak },
                          { name: 'ST Slope', value: ['Upsloping', 'Flat', 'Downsloping'][parseInt(form.slope)] },
                          { name: 'Number of Major Vessels', value: form.ca },
                          { name: 'Thalassemia', value: ['Normal', 'Fixed Defect', 'Reversible Defect'][parseInt(form.thal) - 1] }
                        ];

                        // Create recommendations HTML
                        let recommendationsHtml = '';
                        if (prediction.recommendations && prediction.recommendations.length > 0) {
                          recommendationsHtml = `
                            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                              <h3 class="font-medium text-blue-800 mb-2">Recommendations:</h3>
                              <ul class="list-disc pl-5 space-y-1">
                                ${prediction.recommendations.map(rec => `<li class="text-blue-800">${rec}</li>`).join('')}
                              </ul>
                            </div>
                          `;
                        }

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
                                <title>Heart Disease Assessment Report</title>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <div class="ml-4">
                                      <h1 class="text-2xl font-bold text-gray-800">Heart Disease Assessment</h1>
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
                                  <div class="p-4 mb-4 rounded-lg flex items-center ${getRiskColor(prediction.risk_level)}">
                                    <div class="p-2 rounded-full mr-3 bg-opacity-50 ${prediction.risk_level === 'High' ? 'bg-red-200' : prediction.risk_level === 'Moderate' ? 'bg-yellow-200' : 'bg-green-200'}">
                                      ${prediction.risk_level === 'High' ? `
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
                                      <h4 class="font-bold text-lg">${prediction.risk_level} Risk</h4>
                                      <p class="text-sm opacity-90">Probability: ${prediction.probability}%</p>
                                    </div>
                                  </div>

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
