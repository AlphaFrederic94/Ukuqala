import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Book, Bookmark, Heart, Settings, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
// Using console.log instead of toast for notifications

const BiblePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('read');
  const [translation, setTranslation] = useState(i18n.language === 'fr' ? 'LSG' : 'NIV');
  const [bookmarks, setBookmarks] = useState([]);
  const [readingProgress, setReadingProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [reference, setReference] = useState('');

  // Bible.com embed URLs
  const bibleEmbedUrl = {
    NIV: `https://www.bible.com/bible/111/${readingProgress?.book || 'GEN'}.${readingProgress?.chapter || '1'}.NIV`,
    LSG: `https://www.bible.com/bible/93/${readingProgress?.book || 'GEN'}.${readingProgress?.chapter || '1'}.LSG`
  };

  // Fetch user's bookmarks and reading progress
  useEffect(() => {
    if (user) {
      fetchBookmarks();
      fetchReadingProgress();
    } else {
      setIsLoading(false);
    }
  }, [user, translation]);

  // Update translation when language changes
  useEffect(() => {
    setTranslation(i18n.language === 'fr' ? 'LSG' : 'NIV');
  }, [i18n.language]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('bible_user_data')
        .select('*')
        .eq('user_id', user?.id)
        .eq('data_type', 'bookmark')
        .eq('translation', translation)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      console.log(t('bible.errorFetchingBookmarks'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadingProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('bible_user_data')
        .select('*')
        .eq('user_id', user?.id)
        .eq('data_type', 'progress')
        .eq('translation', translation)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          throw error;
        }
        // Set default reading progress if none exists
        setReadingProgress({
          book: 'GEN',
          chapter: 1,
          translation
        });
      } else {
        setReadingProgress({
          book: data.book,
          chapter: data.chapter,
          verse: data.verse,
          translation: data.translation
        });
      }
    } catch (error) {
      console.error('Error fetching reading progress:', error);
      console.log(t('bible.errorFetchingProgress'));
      // Set default reading progress
      setReadingProgress({
        book: 'GEN',
        chapter: 1,
        translation
      });
    }
  };

  const saveReadingProgress = async (book, chapter, verse) => {
    if (!user) return;

    try {
      // Check if a record already exists
      const { data: existingProgress } = await supabase
        .from('bible_user_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('data_type', 'progress')
        .eq('translation', translation)
        .single();

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('bible_user_data')
          .update({
            book,
            chapter,
            verse,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
      } else {
        // Insert new record
        await supabase
          .from('bible_user_data')
          .insert([
            {
              user_id: user.id,
              data_type: 'progress',
              book,
              chapter,
              verse,
              translation
            }
          ]);
      }

      setReadingProgress({
        book,
        chapter,
        verse,
        translation
      });

      console.log(t('bible.progressSaved'));
    } catch (error) {
      console.error('Error saving reading progress:', error);
      console.log(t('bible.errorSavingProgress'));
    }
  };

  const handleReferenceSearch = () => {
    if (!reference) return;

    try {
      // Parse reference (e.g., "John 3:16")
      const parts = reference.split(' ');
      const book = parts[0].toUpperCase();
      const chapterVerse = parts[1]?.split(':');

      if (!chapterVerse) {
        // Just chapter provided (e.g., "John 3")
        const chapter = parseInt(parts[1]);
        if (isNaN(chapter)) {
          console.log(t('bible.invalidReference'));
          return;
        }

        saveReadingProgress(book, chapter);
        // Update the iframe URL
        window.open(
          `https://www.bible.com/bible/${translation === 'NIV' ? '111' : '93'}/${book}.${chapter}.${translation}`,
          'bible-iframe'
        );
      } else {
        // Chapter and verse provided
        const chapter = parseInt(chapterVerse[0]);
        const verse = parseInt(chapterVerse[1]);

        if (isNaN(chapter) || isNaN(verse)) {
          console.log(t('bible.invalidReference'));
          return;
        }

        saveReadingProgress(book, chapter, verse);
        // Update the iframe URL
        window.open(
          `https://www.bible.com/bible/${translation === 'NIV' ? '111' : '93'}/${book}.${chapter}.${translation}#${verse}`,
          'bible-iframe'
        );
      }

      setReference('');
    } catch (error) {
      console.log(t('bible.invalidReference'));
    }
  };

  const navigateToBookmark = (bookmark) => {
    saveReadingProgress(bookmark.book, bookmark.chapter, bookmark.verse);
    // Update the iframe URL
    window.open(
      `https://www.bible.com/bible/${translation === 'NIV' ? '111' : '93'}/${bookmark.book}.${bookmark.chapter}.${translation}#${bookmark.verse}`,
      'bible-iframe'
    );
    setActiveTab('read');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-1/4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Book className="w-5 h-5 mr-2" />
              {t('bible.holyBible')}
            </h2>

            <div className="flex space-x-2 mb-4">
              <button
                className={`flex-1 py-2 px-3 rounded-md ${activeTab === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setActiveTab('read')}
              >
                {t('bible.read')}
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md ${activeTab === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setActiveTab('bookmarks')}
              >
                {t('bible.bookmarks')}
              </button>
            </div>

            {activeTab === 'read' && (
              <div className="space-y-4">
                <div className="relative">
                  <button
                    className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <span>{translation === 'NIV' ? 'New International Version' : 'Louis Segond'}</span>
                    {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSettings && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setTranslation('NIV');
                          setShowSettings(false);
                        }}
                      >
                        New International Version (NIV)
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setTranslation('LSG');
                          setShowSettings(false);
                        }}
                      >
                        Louis Segond (LSG)
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('bible.enterReference')}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleReferenceSearch()}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    onClick={handleReferenceSearch}
                  >
                    {t('bible.go')}
                  </button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('bible.exampleReference')}</p>
                </div>

                {readingProgress && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300">{t('bible.continueReading')}</h3>
                    <p className="text-blue-600 dark:text-blue-400">
                      {readingProgress.book} {readingProgress.chapter}
                      {readingProgress.verse ? `:${readingProgress.verse}` : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : bookmarks.length > 0 ? (
                    bookmarks.map((bookmark) => (
                      <div
                        key={bookmark.id}
                        className="p-3 bg-white dark:bg-gray-750 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start">
                          <button
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() => navigateToBookmark(bookmark)}
                          >
                            {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                          </button>
                        </div>
                        {bookmark.note_text && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {bookmark.note_text}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(bookmark.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      {t('bible.noBookmarks')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content - Bible reader */}
        <div className="w-full md:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-[800px] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {translation === 'NIV' ? 'New International Version' : 'Louis Segond'}
              </h2>
              <a
                href={bibleEmbedUrl[translation]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                {t('bible.openInNewTab')}
              </a>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-900">
              <iframe
                name="bible-iframe"
                src={bibleEmbedUrl[translation]}
                className="w-full h-full border-0"
                title="Bible Reader"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiblePage;
