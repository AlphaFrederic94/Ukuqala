import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HashtagInput = ({
  hashtags,
  onChange,
  placeholder = 'Add hashtags...',
  disabled = false,
  maxTags = 10,
  suggestedTags = [],
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() && suggestedTags.length > 0) {
      const filtered = suggestedTags
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !hashtags.includes(tag)
        )
        .slice(0, 5); // Limit to 5 suggestions
      
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, suggestedTags, hashtags]);
  
  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Remove # if user types it (we add it automatically)
    if (value.startsWith('#')) {
      setInputValue(value.substring(1));
    } else {
      setInputValue(value);
    }
  };
  
  // Handle key down
  const handleKeyDown = (e) => {
    // Add tag on Enter, comma, or space
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
    
    // Remove last tag on Backspace if input is empty
    if (e.key === 'Backspace' && inputValue === '' && hashtags.length > 0) {
      removeTag(hashtags.length - 1);
    }
  };
  
  // Add tag
  const addTag = () => {
    const tag = inputValue.trim();
    
    if (tag && hashtags.length < maxTags) {
      // Format tag with # prefix if not already present
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      
      // Check if tag already exists
      if (!hashtags.includes(formattedTag)) {
        onChange([...hashtags, formattedTag]);
      }
      
      setInputValue('');
      setShowSuggestions(false);
    }
  };
  
  // Remove tag
  const removeTag = (index) => {
    const newTags = [...hashtags];
    newTags.splice(index, 1);
    onChange(newTags);
  };
  
  // Add suggested tag
  const addSuggestedTag = (tag) => {
    if (hashtags.length < maxTags && !hashtags.includes(tag)) {
      onChange([...hashtags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <Hash className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
        
        <div className="flex flex-wrap gap-2 flex-grow">
          {/* Hashtag Pills */}
          {hashtags.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1 text-sm"
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(filteredSuggestions.length > 0)}
            onBlur={() => setTimeout(() => addTag(), 200)}
            placeholder={hashtags.length === 0 ? placeholder : ''}
            className="flex-grow min-w-[120px] bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm py-1"
            disabled={disabled || hashtags.length >= maxTags}
          />
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-2" />
        )}
        
        {/* Max tags indicator */}
        {hashtags.length >= maxTags && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {t('social.maxTagsReached', { max: maxTags })}
          </span>
        )}
      </div>
      
      {/* Tag suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-40 overflow-y-auto"
          >
            <div className="py-1">
              {filteredSuggestions.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Hash className="w-4 h-4 mr-2 text-blue-500" />
                  {tag.replace('#', '')}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>
          {t('social.pressEnterToAddTag', 'Press Enter to add tag')}
        </span>
        <span>
          {hashtags.length}/{maxTags}
        </span>
      </div>
    </div>
  );
};

export default HashtagInput;
