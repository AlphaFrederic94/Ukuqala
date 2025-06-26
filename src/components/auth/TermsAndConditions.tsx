import React from 'react';

export default function TermsAndConditions({ onAccept, onDecline }: { 
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Terms and Conditions</h2>
          
          <div className="prose dark:prose-invert prose-sm max-h-[50vh] overflow-y-auto mb-6">
            <h3>1. Introduction</h3>
            <p>
              Welcome to Care AI. By using our application, you agree to these terms and conditions.
              Please read them carefully before proceeding.
            </p>

            <h3>2. Privacy and Data Protection</h3>
            <p>
              We take your privacy seriously. Your medical data is encrypted and stored securely.
              We comply with HIPAA and other relevant healthcare privacy regulations.
            </p>

            <h3>3. Medical Disclaimer</h3>
            <p>
              Care AI is not a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or other qualified health provider.
            </p>

            <h3>4. User Responsibilities</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account and PIN.
              Do not share your login credentials with others.
            </p>

            <h3>5. Data Usage</h3>
            <p>
              We collect and analyze your health data to provide personalized recommendations.
              Your data may be used in anonymized form for research purposes.
            </p>

            <h3>6. Service Availability</h3>
            <p>
              While we strive for 24/7 availability, we cannot guarantee uninterrupted access to the service.
              Maintenance and updates may occasionally affect availability.
            </p>

            <h3>7. Termination</h3>
            <p>
              We reserve the right to terminate or suspend access to our service immediately,
              without prior notice or liability, for any reason.
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}