import React from 'react';
import { Activity, Droplet, Ruler, Weight, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MedicalInfoSectionProps {
  medicalData: {
    blood_group: string;
    height: number;
    weight: number;
    allergies: string[];
    medications: string[];
  };
  editMode: boolean;
  onMedicalChange: (field: string, value: any) => void;
  onAddAllergy: () => void;
  onRemoveAllergy: (index: number) => void;
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
}

const MedicalInfoSection: React.FC<MedicalInfoSectionProps> = ({
  medicalData,
  editMode,
  onMedicalChange,
  onAddAllergy,
  onRemoveAllergy,
  onAddMedication,
  onRemoveMedication
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold dark:text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Medical Information
        </h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Basic Medical Info */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Group */}
            <div className="group">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors">
                    <Droplet className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={medicalData.blood_group}
                    onChange={(e) => onMedicalChange('blood_group', e.target.value)}
                    disabled={!editMode}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Height */}
            <div className="group">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                    <Ruler className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={medicalData.height || ''}
                    onChange={(e) => onMedicalChange('height', Number(e.target.value))}
                    disabled={!editMode}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter height"
                  />
                </div>
              </div>
            </div>

            {/* Weight */}
            <div className="group">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                    <Weight className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={medicalData.weight || ''}
                    onChange={(e) => onMedicalChange('weight', Number(e.target.value))}
                    disabled={!editMode}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter weight"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Allergies */}
        <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium dark:text-white">Allergies</h4>
            {editMode && (
              <button
                onClick={onAddAllergy}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Allergy
              </button>
            )}
          </div>
          
          {medicalData.allergies.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">No allergies recorded</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {medicalData.allergies.map((allergy, index) => (
                <div 
                  key={index} 
                  className="group relative px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm flex items-center"
                >
                  {editMode ? (
                    <input
                      type="text"
                      value={allergy}
                      onChange={(e) => {
                        const newAllergies = [...medicalData.allergies];
                        newAllergies[index] = e.target.value;
                        onMedicalChange('allergies', newAllergies);
                      }}
                      className="bg-transparent border-none focus:ring-0 p-0 w-full"
                    />
                  ) : (
                    allergy
                  )}
                  
                  {editMode && (
                    <button
                      onClick={() => onRemoveAllergy(index)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Medications */}
        <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium dark:text-white">Current Medications</h4>
            {editMode && (
              <button
                onClick={onAddMedication}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </button>
            )}
          </div>
          
          {medicalData.medications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">No medications recorded</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {medicalData.medications.map((medication, index) => (
                <div 
                  key={index} 
                  className="group relative px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm flex items-center"
                >
                  {editMode ? (
                    <input
                      type="text"
                      value={medication}
                      onChange={(e) => {
                        const newMedications = [...medicalData.medications];
                        newMedications[index] = e.target.value;
                        onMedicalChange('medications', newMedications);
                      }}
                      className="bg-transparent border-none focus:ring-0 p-0 w-full"
                    />
                  ) : (
                    medication
                  )}
                  
                  {editMode && (
                    <button
                      onClick={() => onRemoveMedication(index)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MedicalInfoSection;
