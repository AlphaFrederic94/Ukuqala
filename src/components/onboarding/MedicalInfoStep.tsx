import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Ruler, Weight, AlertTriangle, Plus, X, Info } from 'lucide-react';

interface MedicalInfoStepProps {
  data: {
    medicalInfo: {
      bloodGroup: string;
      height: number;
      weight: number;
      allergies: string[];
      medications: string[];
    };
  };
  updatePersonalInfo: (data: any) => void;
  updateMedicalInfo: (data: any) => void;
  updatePreferences: (data: any) => void;
  onStartTour: () => void;
  onSkipTour: () => void;
}

const MedicalInfoStep: React.FC<MedicalInfoStepProps> = ({ 
  data, 
  updateMedicalInfo 
}) => {
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert height and weight to numbers
    if (name === 'height' || name === 'weight') {
      updateMedicalInfo({ [name]: parseFloat(value) || 0 });
    } else {
      updateMedicalInfo({ [name]: value });
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      updateMedicalInfo({
        allergies: [...data.medicalInfo.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const updatedAllergies = [...data.medicalInfo.allergies];
    updatedAllergies.splice(index, 1);
    updateMedicalInfo({ allergies: updatedAllergies });
  };

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      updateMedicalInfo({
        medications: [...data.medicalInfo.medications, newMedication.trim()]
      });
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...data.medicalInfo.medications];
    updatedMedications.splice(index, 1);
    updateMedicalInfo({ medications: updatedMedications });
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'allergy' | 'medication') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'allergy') {
        handleAddAllergy();
      } else {
        handleAddMedication();
      }
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Medical Information
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This information helps us provide more accurate health assessments and recommendations.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Blood Group
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Heart className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="bloodGroup"
                  value={data.medicalInfo.bloodGroup}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height (cm)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Ruler className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="height"
                  value={data.medicalInfo.height || ''}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="175"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (kg)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Weight className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="weight"
                  value={data.medicalInfo.weight || ''}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="70"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allergies
            </label>
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'allergy')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add allergy (e.g., Peanuts, Penicillin)"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAllergy}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {/* Allergies List */}
            <div className="mt-2 flex flex-wrap gap-2">
              {data.medicalInfo.allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(index)}
                    className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {data.medicalInfo.allergies.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">No allergies added</span>
              )}
            </div>
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Medications
            </label>
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'medication')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add medication (e.g., Aspirin, Insulin)"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {/* Medications List */}
            <div className="mt-2 flex flex-wrap gap-2">
              {data.medicalInfo.medications.map((medication, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                >
                  {medication}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {data.medicalInfo.medications.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">No medications added</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">Privacy Notice</h4>
            <p className="text-sm text-blue-600 dark:text-blue-200">
              Your medical information is encrypted and securely stored. We use this data to provide 
              more accurate health assessments and personalized recommendations. This information is 
              never shared with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MedicalInfoStep;
