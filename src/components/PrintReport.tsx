import React, { useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Heart, Activity, Stethoscope, User, Calendar, Droplet, CheckCircle2 } from 'lucide-react';

interface PrintReportProps {
  title: string;
  icon: 'heart' | 'diabetes' | 'symptoms';
  parameters: Record<string, any>;
  results: Record<string, any>;
  parameterLabels?: Record<string, string>;
}

const PrintReport: React.FC<PrintReportProps> = ({ 
  title, 
  icon, 
  parameters, 
  results,
  parameterLabels = {}
}) => {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Format date as DD/MM/YYYY
  const formattedDate = format(new Date(), 'dd/MM/yyyy');
  
  // Get user information or use placeholder
  const patientName = user?.user_metadata?.full_name || 'Patient';
  const patientAge = user?.user_metadata?.age || 'N/A';
  const patientBloodGroup = user?.user_metadata?.blood_group || 'N/A';
  
  // Function to render the appropriate icon
  const renderIcon = () => {
    switch (icon) {
      case 'heart':
        return <Heart className="h-10 w-10 text-red-600" />;
      case 'diabetes':
        return <Activity className="h-10 w-10 text-blue-600" />;
      case 'symptoms':
        return <Stethoscope className="h-10 w-10 text-green-600" />;
      default:
        return null;
    }
  };
  
  // Function to format parameter values for display
  const formatParameterValue = (key: string, value: any) => {
    if (value === undefined || value === null) return 'N/A';
    
    // Handle boolean values
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Handle numeric values
    if (typeof value === 'number') {
      // Special case for specific parameters
      if (key === 'bmi') return `${value} kg/m²`;
      if (key.includes('pressure')) return `${value} mmHg`;
      if (key === 'glucose') return `${value} mg/dL`;
      if (key === 'insulin') return `${value} μU/mL`;
      return value.toString();
    }
    
    // Handle arrays (like symptoms)
    if (Array.isArray(value)) return value.join(', ');
    
    // Default to string representation
    return value.toString();
  };
  
  // Get a human-readable label for a parameter
  const getParameterLabel = (key: string) => {
    if (parameterLabels[key]) return parameterLabels[key];
    
    // Default formatting: capitalize and add spaces
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  return (
    <div 
      ref={reportRef} 
      className="print-report bg-white p-8 max-w-4xl mx-auto"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Report Header */}
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div className="flex items-center">
          {renderIcon()}
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500">Assessment Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500">Report Date: {formattedDate}</p>
          <p className="text-gray-500">Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
        </div>
      </div>
      
      {/* Patient Information */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-gray-600" />
          Patient Information
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Full Name</p>
            <p className="font-medium">{patientName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Age</p>
            <p className="font-medium">{patientAge}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Blood Group</p>
            <p className="font-medium">{patientBloodGroup}</p>
          </div>
        </div>
      </div>
      
      {/* Assessment Parameters */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-600" />
          Assessment Parameters
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">Parameter</th>
                <th className="px-4 py-2 text-left text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parameters).map(([key, value], index) => (
                <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border-t">{getParameterLabel(key)}</td>
                  <td className="px-4 py-2 border-t">{formatParameterValue(key, value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Assessment Results */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2 text-gray-600" />
          Assessment Results
        </h2>
        
        {/* Risk Level */}
        {results.risk_level && (
          <div className={`p-4 mb-4 rounded-lg flex items-center ${
            results.risk_level === 'High' ? 'bg-red-50 text-red-800' : 
            results.risk_level === 'Moderate' ? 'bg-yellow-50 text-yellow-800' : 
            'bg-green-50 text-green-800'
          }`}>
            <div className={`p-2 rounded-full mr-3 ${
              results.risk_level === 'High' ? 'bg-red-100' : 
              results.risk_level === 'Moderate' ? 'bg-yellow-100' : 
              'bg-green-100'
            }`}>
              {results.risk_level === 'High' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="font-bold text-lg">{results.risk_level} Risk</h4>
              {results.probability && (
                <p className="text-sm opacity-90">Probability: {results.probability}%</p>
              )}
            </div>
          </div>
        )}
        
        {/* Predictions for Symptoms */}
        {results.top_predictions && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Possible Conditions:</h3>
            <div className="space-y-2">
              {results.top_predictions.map((prediction: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{prediction.disease}</span>
                    <span className="text-blue-600">{prediction.confidence}% match</span>
                  </div>
                  {prediction.description && (
                    <p className="text-sm text-gray-600 mt-1">{prediction.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {results.recommendations && results.recommendations.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Recommendations:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {results.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="text-blue-800">{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Symptom Severity */}
        {results.symptom_severity && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Symptom Severity:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(results.symptom_severity).map(([symptom, severity]: [string, any]) => (
                <div key={symptom} className="flex justify-between items-center p-2 border rounded-lg">
                  <span>{symptom}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    severity >= 7 ? 'bg-red-100 text-red-800' : 
                    severity >= 4 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {severity >= 7 ? 'High' : severity >= 4 ? 'Medium' : 'Low'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Disclaimer */}
      <div className="mb-8 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
        <p className="font-medium mb-1">Disclaimer:</p>
        <p>
          This assessment is based on the information provided and should not be considered as a medical diagnosis.
          Please consult with a healthcare professional for proper evaluation and treatment recommendations.
        </p>
      </div>
      
      {/* Signature */}
      <div className="mt-12 pt-6 border-t">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Generated by</p>
            <p className="font-medium">CareAI Health Assessment System</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Model Developers</p>
            <p className="font-medium">CareAiX Team</p>
          </div>
        </div>
      </div>
      
      {/* Print Styles - Only applied when printing */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-report, .print-report * {
            visibility: visible;
          }
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintReport;
