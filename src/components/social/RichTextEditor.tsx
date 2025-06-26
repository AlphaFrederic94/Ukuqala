import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Smile, Code, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = '100px',
  maxHeight = '300px',
  disabled = false,
  autoFocus = false,
  onSubmit
}) => {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, []);
  
  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    
    // Bold: Ctrl+B
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
      handleContentChange();
      return;
    }
    
    // Italic: Ctrl+I
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic', false);
      handleContentChange();
      return;
    }
    
    // Underline: Ctrl+U
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline', false);
      handleContentChange();
      return;
    }
  };
  
  // Format commands
  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Insert link
  const insertLink = () => {
    if (linkUrl && linkText) {
      document.execCommand('insertHTML', false, `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`);
      handleContentChange();
      setShowLinkInput(false);
      setLinkUrl('');
      setLinkText('');
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };
  
  // Insert emoji
  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    handleContentChange();
    setShowEmojiPicker(false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Common emojis
  const commonEmojis = ['😊', '👍', '❤️', '🎉', '👏', '🙏', '😂', '🤔', '😍', '🔥', '💯', '⭐', '✅', '❌', '⚠️', '🚀'];
  
  return (
    <div className="rich-text-editor border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.bold')}
          disabled={disabled}
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.italic')}
          disabled={disabled}
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.underline')}
          disabled={disabled}
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <div className="h-4 border-r border-gray-300 dark:border-gray-600 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.bulletList')}
          disabled={disabled}
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.numberedList')}
          disabled={disabled}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <div className="h-4 border-r border-gray-300 dark:border-gray-600 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatText('justifyLeft')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.alignLeft')}
          disabled={disabled}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('justifyCenter')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.alignCenter')}
          disabled={disabled}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => formatText('justifyRight')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.alignRight')}
          disabled={disabled}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        
        <div className="h-4 border-r border-gray-300 dark:border-gray-600 mx-1"></div>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
            title={t('editor.insertLink')}
            disabled={disabled}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-64">
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder={t('editor.linkText')}
                className="w-full p-1.5 mb-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={t('editor.linkUrl')}
                className="w-full p-1.5 mb-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="flex justify-end space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded-md"
                  disabled={!linkUrl || !linkText}
                >
                  {t('common.insert')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
            title={t('editor.insertEmoji')}
            disabled={disabled}
          >
            <Smile className="w-4 h-4" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="grid grid-cols-8 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<pre>')}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mr-1"
          title={t('editor.codeBlock')}
          disabled={disabled}
        >
          <Code className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        className="p-3 outline-none text-gray-800 dark:text-gray-200 overflow-auto"
        style={{ minHeight, maxHeight }}
        placeholder={placeholder}
        suppressContentEditableWarning={true}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default RichTextEditor;
