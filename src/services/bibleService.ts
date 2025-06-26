import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Using local KJV Bible data
const TRANSLATION = 'KJV'; // King James Version

// Types for Bible data structure
export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  abbrev: string;
  name: string;
  chapters: BibleChapter[];
}

export interface BibleData {
  books: BibleBook[];
}

export interface ReadingProgress {
  book: string;
  chapter: number;
  verse?: number;
}

export interface BibleBookmark {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse: number;
  note_text?: string;
  created_at: string;
}

export interface BibleNote {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  note_text: string;
  created_at: string;
  updated_at: string;
}

// Load Bible data from JSON file
export const useBibleData = () => {
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        const response = await fetch('/en_kjv.json');
        if (!response.ok) {
          throw new Error(`Failed to load Bible data: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();

        // Transform the raw data into our structured format
        const books: BibleBook[] = rawData.map((book: any) => {
          return {
            abbrev: book.abbrev,
            name: book.name || getBookNameFromAbbrev(book.abbrev),
            chapters: book.chapters.map((chapter: string[], chapterIndex: number) => {
              return {
                chapter: chapterIndex + 1,
                verses: chapter.map((verseText: string, verseIndex: number) => {
                  return {
                    verse: verseIndex + 1,
                    text: cleanVerseText(verseText)
                  };
                })
              };
            })
          };
        });

        setBibleData({ books });
      } catch (err) {
        console.error('Error loading Bible data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading Bible data'));
      } finally {
        setLoading(false);
      }
    };

    loadBibleData();
  }, []);

  return { bibleData, loading, error };
};

// Clean up verse text by removing annotations in curly braces
const cleanVerseText = (text: string): string => {
  return text.replace(/\{[^}]*\}/g, '');
};

// Get book name from abbreviation
const getBookNameFromAbbrev = (abbrev: string): string => {
  const bookNames: Record<string, string> = {
    'gn': 'Genesis',
    'ex': 'Exodus',
    'lv': 'Leviticus',
    'nm': 'Numbers',
    'dt': 'Deuteronomy',
    'js': 'Joshua',
    'jg': 'Judges',
    'rt': 'Ruth',
    '1s': '1 Samuel',
    '2s': '2 Samuel',
    '1k': '1 Kings',
    '2k': '2 Kings',
    '1c': '1 Chronicles',
    '2c': '2 Chronicles',
    'er': 'Ezra',
    'ne': 'Nehemiah',
    'et': 'Esther',
    'jb': 'Job',
    'ps': 'Psalms',
    'pr': 'Proverbs',
    'ec': 'Ecclesiastes',
    'so': 'Song of Solomon',
    'is': 'Isaiah',
    'je': 'Jeremiah',
    'la': 'Lamentations',
    'ez': 'Ezekiel',
    'dn': 'Daniel',
    'ho': 'Hosea',
    'jl': 'Joel',
    'am': 'Amos',
    'ob': 'Obadiah',
    'jn': 'Jonah',
    'mi': 'Micah',
    'na': 'Nahum',
    'hk': 'Habakkuk',
    'zp': 'Zephaniah',
    'hg': 'Haggai',
    'zc': 'Zechariah',
    'ml': 'Malachi',
    'mt': 'Matthew',
    'mk': 'Mark',
    'lk': 'Luke',
    'jn': 'John',
    'ac': 'Acts',
    'rm': 'Romans',
    '1c': '1 Corinthians',
    '2c': '2 Corinthians',
    'gl': 'Galatians',
    'ep': 'Ephesians',
    'ph': 'Philippians',
    'cl': 'Colossians',
    '1t': '1 Thessalonians',
    '2t': '2 Thessalonians',
    '1m': '1 Timothy',
    '2m': '2 Timothy',
    'tt': 'Titus',
    'pm': 'Philemon',
    'hb': 'Hebrews',
    'jm': 'James',
    '1p': '1 Peter',
    '2p': '2 Peter',
    '1j': '1 John',
    '2j': '2 John',
    '3j': '3 John',
    'jd': 'Jude',
    'rv': 'Revelation'
  };

  return bookNames[abbrev] || abbrev.toUpperCase();
};

// Search the Bible
export const searchBible = (
  bibleData: BibleData,
  query: string
): { book: string, chapter: number, verse: number, text: string }[] => {
  if (!bibleData || !query || query.trim() === '') {
    return [];
  }

  const results: { book: string, chapter: number, verse: number, text: string }[] = [];
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  bibleData.books.forEach(book => {
    book.chapters.forEach(chapter => {
      chapter.verses.forEach(verse => {
        const verseText = verse.text.toLowerCase();

        // Check if all search terms are in the verse
        const allTermsFound = searchTerms.every(term => verseText.includes(term));

        if (allTermsFound) {
          results.push({
            book: book.name,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text
          });
        }
      });
    });
  });

  return results;
};

// Parse a Bible reference (e.g., "John 3:16" or "Genesis 1:1-10")
export const parseReference = (reference: string): { book: string, chapter: number, verse?: number, endVerse?: number } | null => {
  // Match patterns like "John 3:16" or "Genesis 1:1-10" or "Psalms 23"
  const regex = /^([a-zA-Z0-9\s]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;
  const match = reference.match(regex);

  if (!match) {
    return null;
  }

  const [, bookName, chapterStr, verseStr, endVerseStr] = match;
  const chapter = parseInt(chapterStr, 10);
  const verse = verseStr ? parseInt(verseStr, 10) : undefined;
  const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : undefined;

  return {
    book: bookName.trim(),
    chapter,
    verse,
    endVerse
  };
};

// Get the book abbreviation from the book name
export const getBookAbbrevFromName = (bookName: string): string | null => {
  const bookAbbrevs: Record<string, string> = {
    'genesis': 'gn',
    'exodus': 'ex',
    'leviticus': 'lv',
    'numbers': 'nm',
    'deuteronomy': 'dt',
    'joshua': 'js',
    'judges': 'jg',
    'ruth': 'rt',
    '1 samuel': '1s',
    '2 samuel': '2s',
    '1 kings': '1k',
    '2 kings': '2k',
    '1 chronicles': '1c',
    '2 chronicles': '2c',
    'ezra': 'er',
    'nehemiah': 'ne',
    'esther': 'et',
    'job': 'jb',
    'psalms': 'ps',
    'psalm': 'ps',
    'proverbs': 'pr',
    'ecclesiastes': 'ec',
    'song of solomon': 'so',
    'isaiah': 'is',
    'jeremiah': 'je',
    'lamentations': 'la',
    'ezekiel': 'ez',
    'daniel': 'dn',
    'hosea': 'ho',
    'joel': 'jl',
    'amos': 'am',
    'obadiah': 'ob',
    'jonah': 'jn',
    'micah': 'mi',
    'nahum': 'na',
    'habakkuk': 'hk',
    'zephaniah': 'zp',
    'haggai': 'hg',
    'zechariah': 'zc',
    'malachi': 'ml',
    'matthew': 'mt',
    'mark': 'mk',
    'luke': 'lk',
    'john': 'jn',
    'acts': 'ac',
    'romans': 'rm',
    '1 corinthians': '1c',
    '2 corinthians': '2c',
    'galatians': 'gl',
    'ephesians': 'ep',
    'philippians': 'ph',
    'colossians': 'cl',
    '1 thessalonians': '1t',
    '2 thessalonians': '2t',
    '1 timothy': '1m',
    '2 timothy': '2m',
    'titus': 'tt',
    'philemon': 'pm',
    'hebrews': 'hb',
    'james': 'jm',
    '1 peter': '1p',
    '2 peter': '2p',
    '1 john': '1j',
    '2 john': '2j',
    '3 john': '3j',
    'jude': 'jd',
    'revelation': 'rv'
  };

  const normalizedName = bookName.toLowerCase();
  return bookAbbrevs[normalizedName] || null;
};

// Save reading progress
export const saveReadingProgress = async (
  userId: string,
  book: string,
  chapter: number,
  verse?: number
): Promise<void> => {
  try {
    // Check if a record already exists
    const { data: existingProgress } = await supabase
      .from('bible_user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'progress')
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
            user_id: userId,
            data_type: 'progress',
            book,
            chapter,
            verse
          }
        ]);
    }
  } catch (error) {
    console.error('Error saving reading progress:', error);
    throw error;
  }
};

// Get reading progress
export const getReadingProgress = async (
  userId: string
): Promise<ReadingProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('bible_user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'progress')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return null;
      }
      throw error;
    }

    return {
      book: data.book,
      chapter: data.chapter,
      verse: data.verse
    };
  } catch (error) {
    console.error('Error getting reading progress:', error);
    throw error;
  }
};

// Add a bookmark
export const addBookmark = async (
  userId: string,
  book: string,
  chapter: number,
  verse: number,
  note?: string
): Promise<void> => {
  try {
    await supabase
      .from('bible_user_data')
      .insert([
        {
          user_id: userId,
          data_type: 'bookmark',
          book,
          chapter,
          verse,
          note_text: note
        }
      ]);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

// Get bookmarks
export const getBookmarks = async (userId: string): Promise<BibleBookmark[]> => {
  try {
    const { data, error } = await supabase
      .from('bible_user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'bookmark')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as BibleBookmark[];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
};

// Delete a bookmark
export const deleteBookmark = async (bookmarkId: string): Promise<void> => {
  try {
    await supabase
      .from('bible_user_data')
      .delete()
      .eq('id', bookmarkId);
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
};

// Add a note
export const addNote = async (
  userId: string,
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  noteText: string
): Promise<void> => {
  try {
    await supabase
      .from('bible_user_data')
      .insert([
        {
          user_id: userId,
          data_type: 'note',
          book,
          chapter,
          verse_start: verseStart,
          verse_end: verseEnd,
          note_text: noteText
        }
      ]);
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Get notes
export const getNotes = async (userId: string): Promise<BibleNote[]> => {
  try {
    const { data, error } = await supabase
      .from('bible_user_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', 'note')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data as BibleNote[];
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
};

// Update a note
export const updateNote = async (
  noteId: string,
  noteText: string
): Promise<void> => {
  try {
    await supabase
      .from('bible_user_data')
      .update({
        note_text: noteText,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await supabase
      .from('bible_user_data')
      .delete()
      .eq('id', noteId);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export default {
  useBibleData,
  saveReadingProgress,
  getReadingProgress,
  addBookmark,
  getBookmarks,
  deleteBookmark,
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  searchBible,
  parseReference,
  getBookAbbrevFromName
};
