import { db } from './firebaseConfig';
import firebase from '../firebase-compat';

// Create a hashtag in the database
export const createHashtag = async (name: string) => {
  try {
    // Check if hashtag already exists
    const hashtagSnapshot = await db.collection('hashtags')
      .where('name', '==', name.toLowerCase())
      .get();

    if (hashtagSnapshot.empty) {
      // Create new hashtag
      const hashtagData = {
        name: name.toLowerCase(),
        count: 1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('hashtags').add(hashtagData);
      return { id: docRef.id, ...hashtagData };
    } else {
      // Update existing hashtag count
      const hashtagDoc = hashtagSnapshot.docs[0];
      const currentCount = hashtagDoc.data().count || 0;

      await hashtagDoc.ref.update({
        count: currentCount + 1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return {
        id: hashtagDoc.id,
        ...hashtagDoc.data(),
        count: currentCount + 1,
        updatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('Error creating hashtag:', error);
    // Return a default object to prevent errors
    return {
      id: `temp-${Date.now()}`,
      name: name.toLowerCase(),
      count: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (limit = 10) => {
  try {
    const hashtagsSnapshot = await db.collection('hashtags')
      .orderBy('count', 'desc')
      .limit(limit)
      .get();

    if (hashtagsSnapshot.empty) {
      return getDefaultHashtags(limit);
    }

    return hashtagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      name: doc.data().name.replace(/^#/, '') // Remove # if present
    }));
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return getDefaultHashtags(limit);
  }
};

// Get hashtag by name
export const getHashtagByName = async (name: string) => {
  try {
    const hashtagSnapshot = await db.collection('hashtags')
      .where('name', '==', name.toLowerCase())
      .get();

    if (hashtagSnapshot.empty) {
      return null;
    }

    const doc = hashtagSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting hashtag:', error);
    return null;
  }
};

// Get hashtag analytics
export const getHashtagAnalytics = async (limit = 20) => {
  try {
    const hashtagsSnapshot = await db.collection('hashtags')
      .orderBy('count', 'desc')
      .limit(limit)
      .get();

    if (hashtagsSnapshot.empty) {
      return getDefaultHashtags(limit);
    }

    return hashtagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      name: doc.data().name.replace(/^#/, '') // Remove # if present
    }));
  } catch (error) {
    console.error('Error getting hashtag analytics:', error);
    return getDefaultHashtags(limit);
  }
};

// Process hashtags from post content
export const processHashtagsFromPost = async (content: string, hashtags: string[] = []) => {
  try {
    // Extract hashtags from content - improved regex to handle more characters
    // This regex matches hashtags that can include letters, numbers, underscores
    // and some international characters
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const matches = Array.from(content.matchAll(hashtagRegex) || [])
      .map(match => `#${match[1]}`);

    console.log('Extracted hashtags from content:', matches);

    // Clean up provided hashtags
    const cleanedHashtags = hashtags
      .filter(tag => tag && tag.trim() !== '')
      .map(tag => tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`);

    console.log('Cleaned provided hashtags:', cleanedHashtags);

    // Combine all hashtags and remove duplicates
    const allHashtags = new Set([
      ...matches.map(tag => tag.toLowerCase()),
      ...cleanedHashtags
    ]);

    console.log('All combined hashtags:', Array.from(allHashtags));

    // Create or update each hashtag in the database
    const promises = Array.from(allHashtags).map(tag =>
      createHashtag(tag.replace(/^#/, '')) // Remove # if present
    );

    await Promise.all(promises);

    // Return hashtags without # prefix
    const result = Array.from(allHashtags).map(tag => tag.replace(/^#/, ''));
    console.log('Final processed hashtags:', result);
    return result;
  } catch (error) {
    console.error('Error processing hashtags from post:', error);
    return [];
  }
};

// Get default hashtags
const getDefaultHashtags = (limit = 10) => {
  const defaultHashtags = [
    { id: '1', name: 'health', count: 128 },
    { id: '2', name: 'mentalhealth', count: 96 },
    { id: '3', name: 'nutrition', count: 87 },
    { id: '4', name: 'fitness', count: 76 },
    { id: '5', name: 'wellness', count: 65 },
    { id: '6', name: 'selfcare', count: 54 },
    { id: '7', name: 'mindfulness', count: 48 },
    { id: '8', name: 'healthcare', count: 42 },
    { id: '9', name: 'medicine', count: 39 },
    { id: '10', name: 'doctor', count: 35 },
    { id: '11', name: 'healthy', count: 32 },
    { id: '12', name: 'diet', count: 29 },
    { id: '13', name: 'exercise', count: 27 },
    { id: '14', name: 'yoga', count: 25 },
    { id: '15', name: 'meditation', count: 23 },
    { id: '16', name: 'healthylifestyle', count: 21 },
    { id: '17', name: 'healthyliving', count: 19 },
    { id: '18', name: 'healthyeating', count: 17 },
    { id: '19', name: 'healthyfood', count: 15 },
    { id: '20', name: 'healthtips', count: 13 }
  ];

  return defaultHashtags.slice(0, limit);
};

export const hashtagService = {
  createHashtag,
  getTrendingHashtags,
  getHashtagByName,
  getHashtagAnalytics,
  processHashtagsFromPost
};

export default hashtagService;
