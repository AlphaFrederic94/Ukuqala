import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Brain, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../lib/predictionService';

export default function BrainCancer() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      handlePrediction(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1
  });

  const handlePrediction = async (file: File) => {
    setLoading(true);
    setPrediction(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/predict/brain', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process the image');
      }

      const result = await response.json();
      setPrediction(result);

      // Save prediction to database
      if (user && result) {
        try {
          await predictionService.savePrediction({
            user_id: user.id,
            prediction_type: 'brain_cancer',
            title: 'Brain Cancer MRI Analysis',
            result: result.prediction === 1 ? 'Tumor Detected' : 'No Tumor Detected',
            risk_level: result.prediction === 1 ? 'high' : 'low',
            result_details: {
              confidence: result.confidence,
              prediction: result.prediction
            }
          });
          console.log('Brain cancer prediction saved to database');
        } catch (saveError) {
          console.error('Error saving prediction to database:', saveError);
          // Continue with the UI flow even if saving fails
        }
      }
    } catch (err) {
      setError('Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Brain Cancer Detection</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced AI model analyzes MRI scans to detect various types of brain tumors with high accuracy.
              Early detection can significantly improve treatment outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Why Use AI Detection?</h2>
              <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Early detection increases survival rates
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  High accuracy in tumor classification
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Quick results for faster decision making
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Non-invasive screening method
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Detectable Tumor Types</h2>
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Glioma Tumor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Starts in the glial cells of the brain or spine
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Meningioma Tumor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Forms in the meninges, the brain's outer covering
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Pituitary Tumor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Develops in the pituitary gland
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="MRI Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drop another image to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2 dark:text-white">
                    Drop your MRI scan here
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    or click to select a file
                  </p>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Analyzing MRI scan...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-xl">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {prediction && prediction.probabilities && (
            <div className="bg-green-50 dark:bg-green-900/50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-green-100">
                Analysis Results
              </h3>
              <p className="text-green-800 dark:text-green-200 text-lg">
                Prediction: {prediction.prediction}
              </p>
              <p className="text-green-800 dark:text-green-200">
                Confidence: {(prediction.confidence * 100).toFixed(2)}%
              </p>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Detailed Probabilities:</h4>
                {Object.entries(prediction.probabilities || {}).map(([className, prob]: [string, any]) => (
                  <div key={className} className="flex justify-between">
                    <span>{className}:</span>
                    <span>{(prob * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-green-700 dark:text-green-300">
                Please consult with a healthcare professional for proper diagnosis and treatment options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
