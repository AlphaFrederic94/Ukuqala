import React, { useState } from 'react';
import { X, Hash } from 'lucide-react';

const SimpleHashtagInput = ({ hashtags, onChange, placeholder = 'Add hashtags...' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    } else if (e.key === 'Backspace' && inputValue === '' && hashtags.length > 0) {
      // Remove the last hashtag when backspace is pressed and input is empty
      const newHashtags = [...hashtags];
      newHashtags.pop();
      onChange(newHashtags);
    }
  };

  const addHashtag = () => {
    const tag = inputValue.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag) && !hashtags.includes(`#${tag}`)) {
      const newTag = tag.startsWith('#') ? tag : `#${tag}`;
      onChange([...hashtags, newTag]);
      setInputValue('');
    } else {
      setInputValue('');
    }
  };

  const removeHashtag = (index) => {
    const newHashtags = [...hashtags];
    newHashtags.splice(index, 1);
    onChange(newHashtags);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
      <Hash className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
      
      <div className="flex flex-wrap gap-2 flex-grow">
        {hashtags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1 text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => removeHashtag(index)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={addHashtag}
          placeholder={hashtags.length === 0 ? placeholder : ''}
          className="flex-grow min-w-[120px] bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm py-1"
        />
      </div>
    </div>
  );
};

export default SimpleHashtagInput;
