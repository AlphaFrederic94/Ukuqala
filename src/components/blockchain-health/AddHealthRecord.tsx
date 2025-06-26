import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import blockchainService from '../../lib/blockchainService';
import { supabase } from '../../lib/supabaseClient';
import {
  FileText,
  Plus,
  Calendar,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  File,
  X
} from 'lucide-react';

const AddHealthRecord: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recordType, setRecordType] = useState('medical_test');
  const [recordName, setRecordName] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [recordDetails, setRecordDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t('healthRecords.fileTooLarge', 'File is too large. Maximum size is 10MB.'));
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(t('healthRecords.invalidFileType', 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create file preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // For PDFs, just show an icon
      setFilePreview(null);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file to storage
  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;

    try {
      console.log('Starting file upload...');

      // Create a folder structure: health_records/user_id/record_type/
      const folderPath = `${user.id}/${recordType}`;
      const filePath = `${folderPath}/${Date.now()}_${file.name}`;

      console.log(`Uploading to path: ${filePath}`);

      // Upload the file
      const { data, error } = await supabase.storage
        .from('health_records')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const progressPercent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${progressPercent}%`);
            setUploadProgress(progressPercent);
          }
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully, getting URL...');

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health_records')
        .getPublicUrl(filePath);

      console.log(`File public URL: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError(t('common.notLoggedIn', 'You must be logged in to add a health record.'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // Validate form
      if (!recordName.trim()) {
        setError(t('healthRecords.nameRequired', 'Record name is required.'));
        return;
      }

      if (!recordDate) {
        setError(t('healthRecords.dateRequired', 'Record date is required.'));
        return;
      }

      if (!recordDetails.trim()) {
        setError(t('healthRecords.detailsRequired', 'Record details are required.'));
        return;
      }

      // Upload file if selected
      let fileUrl = null;
      if (file) {
        try {
          fileUrl = await uploadFile();
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError(t('healthRecords.fileUploadError', 'Failed to upload file. Please try again.'));
          setLoading(false);
          return;
        }
      }

      // Create record data
      const recordData = {
        name: recordName,
        date: recordDate,
        details: recordDetails,
        created_by: user.id,
        file_name: file?.name,
        file_type: file?.type,
        file_size: file?.size
      };

      console.log('Storing health record with data:', recordData);
      console.log('File URL:', fileUrl);

      // Store record on blockchain
      try {
        const result = await blockchainService.storeHealthRecord(
          user.id,
          recordType,
          recordData,
          fileUrl
        );

        console.log('Health record stored successfully:', result);

        // Show success message with animation
        setSuccess(true);

        // Reset form
        setRecordName('');
        setRecordDate('');
        setRecordDetails('');
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } catch (storeError) {
        console.error('Error storing health record:', storeError);
        setError(t('healthRecords.storeError', 'Failed to store health record. Please try again.'));
      }
    } catch (error) {
      console.error('Error adding health record:', error);
      setError(t('healthRecords.generalError', 'An unexpected error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('healthRecords.addRecord', 'Add Health Record')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('healthRecords.addRecordDescription', 'Add a new health record to your secure blockchain storage')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Record Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('healthRecords.recordType', 'Record Type')}
          </label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            required
          >
            <option value="medical_test">{t('healthRecords.medicalTest', 'Medical Test')}</option>
            <option value="vaccination">{t('healthRecords.vaccination', 'Vaccination')}</option>
            <option value="prescription">{t('healthRecords.prescription', 'Prescription')}</option>
            <option value="diagnosis">{t('healthRecords.diagnosis', 'Diagnosis')}</option>
          </select>
        </div>

        {/* Record Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('healthRecords.recordName', 'Record Name')}
          </label>
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            placeholder={t('healthRecords.recordNamePlaceholder', 'e.g., Blood Test, COVID-19 Vaccination')}
            required
          />
        </div>

        {/* Record Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('healthRecords.recordDate', 'Record Date')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Record Details */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('healthRecords.recordDetails', 'Record Details')}
          </label>
          <textarea
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={recordDetails}
            onChange={(e) => setRecordDetails(e.target.value)}
            rows={4}
            placeholder={t('healthRecords.recordDetailsPlaceholder', 'Enter details about the health record...')}
            required
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('healthRecords.attachFile', 'Attach File (Optional)')}
          </label>

          {!file ? (
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const droppedFile = e.dataTransfer.files[0];
                  // Create a synthetic event to reuse handleFileChange
                  const event = {
                    target: {
                      files: [droppedFile]
                    }
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileChange(event);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>{t('healthRecords.uploadFile', 'Upload a file')}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="pl-1">{t('healthRecords.dragAndDrop', 'or drag and drop')}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('healthRecords.fileTypes', 'PDF, JPG, PNG up to 10MB')}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-1 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="File preview"
                      className="w-16 h-16 object-cover rounded mr-3"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center mr-3">
                      <File className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                    </p>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700 dark:text-green-300">
                {t('healthRecords.recordAdded', 'Health record added successfully!')}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.processing', 'Processing...')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('healthRecords.addRecord', 'Add Record')}
              </>
            )}
          </button>
        </div>
      </form>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {t('healthRecords.secureStorage', 'Secure Blockchain Storage')}
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {t('healthRecords.secureStorageDescription', 'Your health records are encrypted and stored securely using blockchain technology. Only you can access your records, and you control who you share them with.')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AddHealthRecord;
