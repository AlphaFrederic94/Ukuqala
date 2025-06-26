import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Microscope, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../lib/predictionService';

export default function SkinCancer() {
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
      const response = await fetch('http://localhost:5000/api/predict/skin', {
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
            prediction_type: 'skin_cancer',
            title: 'Skin Cancer Analysis',
            result: result.prediction === 1 ? 'Malignant' : 'Benign',
            risk_level: result.prediction === 1 ? 'high' : 'low',
            result_details: {
              confidence: result.confidence,
              prediction: result.prediction
            }
          });
          console.log('Skin cancer prediction saved to database');
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
            <Microscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Skin Cancer Detection</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI-powered system analyzes skin lesion images to detect potential skin cancer.
              Early detection is crucial for successful treatment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Benefits of Early Detection</h2>
              <ul className="space-y-3 text-blue-800 dark:text-blue-200">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Higher cure rates with early treatment
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Less invasive treatment options
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Better cosmetic outcomes
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Reduced treatment costs
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Types of Skin Cancer</h2>
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Benign Tumors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Non-cancerous growths that don't spread to other parts of the body
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium dark:text-white">Malignant Tumors</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cancerous growths that can spread if not treated early
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
                    alt="Skin Lesion Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drop another image to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2 dark:text-white">
                    Drop your skin lesion image here
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
              <p className="text-gray-600 dark:text-gray-300">Analyzing image...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {prediction && (
            <div className="bg-green-50 dark:bg-green-900/50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-green-100">
                Analysis Results
              </h3>
              <p className="text-green-800 dark:text-green-200 text-lg">
                {prediction}
              </p>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                Please consult with a dermatologist for proper diagnosis and treatment options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
