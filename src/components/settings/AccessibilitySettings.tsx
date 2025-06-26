import React from 'react';
import { useSettings, ContrastMode } from '../../contexts/SettingsContext';
import { Eye, Type, Contrast, Minus, Plus } from 'lucide-react';

const AccessibilitySettings: React.FC = () => {
  const { contrastMode, fontSize, setContrastMode, setFontSize } = useSettings();

  const handleContrastChange = (mode: ContrastMode) => {
    setContrastMode(mode);
  };

  const handleFontSizeChange = (change: number) => {
    // Limit font size between 12 and 24
    const newSize = Math.min(Math.max(fontSize + change, 12), 24);
    setFontSize(newSize);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        <Eye className="mr-2 h-5 w-5 text-blue-500" />
        Accessibility Settings
      </h2>

      <div className="space-y-6">
        {/* Contrast Mode */}
        <div>
          <h3 className="text-md font-medium mb-2 flex items-center text-gray-800 dark:text-gray-200">
            <Contrast className="mr-2 h-4 w-4 text-blue-500" />
            Contrast Mode
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleContrastChange('normal')}
              className={`px-4 py-2 rounded-md ${
                contrastMode === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => handleContrastChange('high')}
              className={`px-4 py-2 rounded-md ${
                contrastMode === 'high'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              High Contrast
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            High contrast mode improves readability by increasing color contrast between elements.
          </p>
        </div>

        {/* Font Size */}
        <div>
          <h3 className="text-md font-medium mb-2 flex items-center text-gray-800 dark:text-gray-200">
            <Type className="mr-2 h-4 w-4 text-blue-500" />
            Font Size
          </h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleFontSizeChange(-1)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              aria-label="Decrease font size"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="w-12 text-center font-medium text-gray-800 dark:text-gray-200">
              {fontSize}px
            </div>
            <button
              onClick={() => handleFontSizeChange(1)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              aria-label="Increase font size"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Adjust the text size for better readability.
          </p>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">Preview</h4>
          <p className="text-gray-800 dark:text-gray-200">
            This is how text will appear with your current settings.
          </p>
          <div className="mt-2 flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md">Button</button>
            <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md">
              Secondary
            </button>
          </div>
          <div className="mt-2">
            <a href="#" className="text-blue-600 dark:text-blue-400">
              This is a link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
