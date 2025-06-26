import firebase from '../firebase-compat';
import { db, storage } from './firebaseConfig';
import { supabase } from './supabaseClient';

import { uploadFile, deleteFile } from "./uploadFile";
type Timestamp = firebase.firestore.Timestamp;

// Types
export interface Post {
  id?: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp | Date;
  likes: number;
  comments: number;
  hashtags?: string[];
}

export interface Comment {
  id?: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Timestamp | Date;
}

export interface Like {
  id?: string;
  postId: string;
  userId: string;
  createdAt: Timestamp | Date;
}

export interface ChatGroup {
  id?: string;
  name: string;
  description: string;
  type: 'anatomy' | 'food' | 'fitness';
  createdAt: Timestamp | Date;
  memberCount: number;
  lastMessage?: {
    content: string;
    userId: string;
    timestamp: Timestamp | Date;
  };
}

export interface ChatGroupMember {
  id?: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Timestamp | Date;
}

export interface ChatGroupMessage {
  id?: string;
  groupId: string;
  userId: string;
  content: string;
  isSticker: boolean;
  createdAt: Timestamp | Date;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  isSticker: boolean;
  createdAt: Timestamp | Date;
  read: boolean;
}

export interface Friendship {
  id?: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: Timestamp | Date;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp | Date;
}

// Posts
export const createPost = async (post: Omit<Post, 'createdAt' | 'likes' | 'comments' | 'userName' | 'userPhotoURL'>) => {
  try {
    // Get user information from Supabase
    let userName = '';
    let userPhotoURL = '';

    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', post.userId)
        .single();

      if (userData) {
        userName = userData.full_name || '';
        userPhotoURL = userData.avatar_url || '';
      }
    } catch (userError) {
      console.error('Error fetching user data for post:', userError);
      // Continue with post creation even if user data fetch fails
    }

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = post.content.match(hashtagRegex) || [];
    const hashtags = matches.map(tag => tag);

    // Ensure imageUrl is never undefined
    const postData = {
      ...post,
      userName,
      userPhotoURL,
      hashtags,
      imageUrl: post.imageUrl || null, // Convert undefined to null
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      likes: 0,
      comments: 0
    };

    const docRef = await db.collection('social_posts').add(postData);
    return { id: docRef.id, ...postData };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (limit = 20) => {
  try {
    const querySnapshot = await db.collection('social_posts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

export const subscribeToPostUpdates = (callback: (posts: Post[]) => void, limit = 20) => {
  try {
    return db.collection('social_posts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot((querySnapshot) => {
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        callback(posts);
      });
  } catch (error) {
    console.error('Error subscribing to posts:', error);
    throw error;
  }
};

export const getUserPosts = async (userId: string, limit = 20) => {
  try {
    const querySnapshot = await db.collection('social_posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
};

// Comments
export const createComment = async (comment: Omit<Comment, 'createdAt'>) => {
  try {
    const commentData = {
      ...comment,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('post_comments').add(commentData);

    // Update comment count on post
    const postRef = db.collection('social_posts').doc(comment.postId);
    const postDoc = await postRef.get();

    if (postDoc.exists) {
      const postData = postDoc.data();
      await postRef.update({
        comments: (postData?.comments || 0) + 1
      });
    }

    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getPostComments = async (postId: string) => {
  try {
    const querySnapshot = await db.collection('post_comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'asc')
      .get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
  } catch (error) {
    console.error('Error getting post comments:', error);
    throw error;
  }
};

// Create a comment with separate parameters for backward compatibility
export const createCommentWithParams = async (postId: string, userId: string, content: string) => {
  try {
    return await createComment({
      postId,
      userId,
      content,
      userName: 'User', // This will be updated with actual user data
      userAvatar: '/images/default_user.jpg' // Default avatar
    });
  } catch (error) {
    console.error('Error creating comment with params:', error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (commentId: string) => {
  try {
    // Get the comment to find its post
    const commentDoc = await db.collection('post_comments').doc(commentId).get();

    if (!commentDoc.exists) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    const postId = commentData?.postId;

    // Delete the comment
    await db.collection('post_comments').doc(commentId).delete();

    // Update comment count on post if we have the post ID
    if (postId) {
      const postRef = db.collection('social_posts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        const postData = postDoc.data();
        await postRef.update({
          comments: Math.max((postData?.comments || 0) - 1, 0) // Ensure it doesn't go below 0
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Likes
export const likePost = async (postId: string, userId: string) => {
  try {
    // Check if already liked
    const querySnapshot = await db.collection('post_likes')
      .where('postId', '==', postId)
      .where('userId', '==', userId)
      .get();

    if (querySnapshot.empty) {
      // Create like
      const likeData = {
        postId,
        userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('post_likes').add(likeData);

      // Update like count on post
      const postRef = db.collection('social_posts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        const postData = postDoc.data();
        await postRef.update({
          likes: (postData?.likes || 0) + 1
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    // Find like document
    const querySnapshot = await db.collection('post_likes')
      .where('postId', '==', postId)
      .where('userId', '==', userId)
      .get();

    if (!querySnapshot.empty) {
      // Delete like
      await db.collection('post_likes').doc(querySnapshot.docs[0].id).delete();

      // Update like count on post
      const postRef = db.collection('social_posts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        const postData = postDoc.data();
        await postRef.update({
          likes: Math.max((postData?.likes || 0) - 1, 0)
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const checkIfLiked = async (postId: string, userId: string) => {
  try {
    const querySnapshot = await db.collection('post_likes')
      .where('postId', '==', postId)
      .where('userId', '==', userId)
      .get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if post is liked:', error);
    throw error;
  }
};

// Chat Groups
export const getChatGroups = async () => {
  try {
    const querySnapshot = await db.collection('chat_groups')
      .orderBy('name', 'asc')
      .get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatGroup[];
  } catch (error) {
    console.error('Error getting chat groups:', error);
    throw error;
  }
};

export const getUserChatGroups = async (userId: string) => {
  try {
    // Get groups where user is a member
    const membershipSnapshot = await db.collection('chat_group_members')
      .where('userId', '==', userId)
      .get();
    const groupIds = membershipSnapshot.docs.map(doc => doc.data().groupId);

    if (groupIds.length === 0) {
      return [];
    }

    // Get group details
    const groups: ChatGroup[] = [];

    for (const groupId of groupIds) {
      const groupDoc = await db.collection('chat_groups').doc(groupId).get();

      if (groupDoc.exists) {
        groups.push({
          id: groupDoc.id,
          ...groupDoc.data()
        } as ChatGroup);
      }
    }

    return groups;
  } catch (error) {
    console.error('Error getting user chat groups:', error);
    throw error;
  }
};

export const joinChatGroup = async (groupId: string, userId: string) => {
  try {
    // Check if already a member
    const querySnapshot = await db.collection('chat_group_members')
      .where('groupId', '==', groupId)
      .where('userId', '==', userId)
      .get();

    if (querySnapshot.empty) {
      // Add user to group
      const memberData = {
        groupId,
        userId,
        role: 'member',
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('chat_group_members').add(memberData);

      // Update member count
      const groupRef = db.collection('chat_groups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (groupDoc.exists) {
        const groupData = groupDoc.data();
        await groupRef.update({
          memberCount: (groupData?.memberCount || 0) + 1
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error joining chat group:', error);
    throw error;
  }
};

export const leaveChatGroup = async (groupId: string, userId: string) => {
  try {
    // Find membership document
    const querySnapshot = await db.collection('chat_group_members')
      .where('groupId', '==', groupId)
      .where('userId', '==', userId)
      .get();

    if (!querySnapshot.empty) {
      // Remove user from group
      await db.collection('chat_group_members').doc(querySnapshot.docs[0].id).delete();

      // Update member count
      const groupRef = db.collection('chat_groups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (groupDoc.exists) {
        const groupData = groupDoc.data();
        await groupRef.update({
          memberCount: Math.max((groupData?.memberCount || 0) - 1, 0)
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error leaving chat group:', error);
    throw error;
  }
};

// Chat Group Messages
export const sendChatGroupMessage = async (
  groupId: string,
  userId: string,
  content: string,
  isSticker = false
) => {
  try {
    // Check if user is a member of the group
    const membershipSnapshot = await db.collection('chat_group_members')
      .where('groupId', '==', groupId)
      .where('userId', '==', userId)
      .get();

    if (membershipSnapshot.empty) {
      throw new Error('User is not a member of this group');
    }

    // Create message
    const messageData = {
      groupId,
      userId,
      content,
      isSticker,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('chat_group_messages').add(messageData);

    // Update last message in group
    await db.collection('chat_groups').doc(groupId).update({
      lastMessage: {
        content,
        userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }
    });

    return { id: docRef.id, ...messageData };
  } catch (error) {
    console.error('Error sending chat group message:', error);
    throw error;
  }
};

export const getChatGroupMessages = async (groupId: string, limit = 50) => {
  try {
    const querySnapshot = await db.collection('chat_group_messages')
      .where('groupId', '==', groupId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatGroupMessage[];
  } catch (error) {
    console.error('Error getting chat group messages:', error);
    throw error;
  }
};

export const subscribeToChatGroupMessages = (
  groupId: string,
  callback: (messages: ChatGroupMessage[]) => void
) => {
  return db.collection('chat_group_messages')
    .where('groupId', '==', groupId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot((querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatGroupMessage[];

    callback(messages);
  });
};

// Direct Messages
export const sendDirectMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  isSticker = false
) => {
  try {
    // Check if users are friends
    const friendshipQuery1 = db.collection('user_friendships')
      .where('userId', '==', senderId)
      .where('friendId', '==', receiverId)
      .where('status', '==', 'accepted');

    const friendshipQuery2 = db.collection('user_friendships')
      .where('userId', '==', receiverId)
      .where('friendId', '==', senderId)
      .where('status', '==', 'accepted');

    const [snapshot1, snapshot2] = await Promise.all([
      friendshipQuery1.get(),
      friendshipQuery2.get()
    ]);

    const areFriends = !snapshot1.empty || !snapshot2.empty;

    // If not friends, check if sender has sent less than 2 messages
    if (!areFriends) {
      const previousMessagesSnapshot = await db.collection('chat_messages')
        .where('senderId', '==', senderId)
        .where('receiverId', '==', receiverId)
        .get();

      if (previousMessagesSnapshot.size >= 2) {
        throw new Error('You can only send 2 messages to a user before they accept your friend request');
      }
    }

    // Create message
    const messageData = {
      senderId,
      receiverId,
      content,
      isSticker,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    };

    const docRef = await db.collection('chat_messages').add(messageData);
    return { id: docRef.id, ...messageData };
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

export const getDirectMessages = async (userId1: string, userId2: string, limit = 50) => {
  try {
    const q1 = db.collection('chat_messages')
      .where('senderId', '==', userId1)
      .where('receiverId', '==', userId2)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const q2 = db.collection('chat_messages')
      .where('senderId', '==', userId2)
      .where('receiverId', '==', userId1)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const [snapshot1, snapshot2] = await Promise.all([
      q1.get(),
      q2.get()
    ]);

    const messages1 = snapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    const messages2 = snapshot2.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    return [...messages1, ...messages2].sort((a, b) => {
      const dateA = a.createdAt as any;
      const dateB = b.createdAt as any;
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error getting direct messages:', error);
    throw error;
  }
};

export const subscribeToDirectMessages = (
  userId1: string,
  userId2: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q1 = db.collection('chat_messages')
    .where('senderId', '==', userId1)
    .where('receiverId', '==', userId2)
    .orderBy('createdAt', 'desc')
    .limit(50);

  const q2 = db.collection('chat_messages')
    .where('senderId', '==', userId2)
    .where('receiverId', '==', userId1)
    .orderBy('createdAt', 'desc')
    .limit(50);

  const unsubscribe1 = q1.onSnapshot((snapshot1) => {
    const unsubscribe2 = q2.onSnapshot((snapshot2) => {
      const messages1 = snapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];

      const messages2 = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];

      const allMessages = [...messages1, ...messages2].sort((a, b) => {
        const dateA = a.createdAt as any;
        const dateB = b.createdAt as any;
        return dateA - dateB;
      });

      callback(allMessages);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  });

  return unsubscribe1;
};

// Friendships
export const sendFriendRequest = async (userId: string, friendId: string) => {
  try {
    // Check if request already exists
    const existingRequestSnapshot = await db.collection('user_friendships')
      .where('userId', '==', userId)
      .where('friendId', '==', friendId)
      .get();

    if (!existingRequestSnapshot.empty) {
      return { success: false, message: 'Friend request already sent' };
    }

    // Check if other user already sent a request
    const reverseRequestSnapshot = await db.collection('user_friendships')
      .where('userId', '==', friendId)
      .where('friendId', '==', userId)
      .get();

    if (!reverseRequestSnapshot.empty) {
      const reverseRequest = reverseRequestSnapshot.docs[0];
      const reverseRequestData = reverseRequest.data();

      if (reverseRequestData.status === 'pending') {
        // Accept the reverse request instead
        await db.collection('user_friendships').doc(reverseRequest.id).update({
          status: 'accepted'
        });

        return { success: true, message: 'Friend request accepted' };
      }

      if (reverseRequestData.status === 'accepted') {
        return { success: false, message: 'Already friends' };
      }
    }

    // Create new friend request
    const friendshipData = {
      userId,
      friendId,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('user_friendships').add(friendshipData);

    // Create notification for the recipient
    await db.collection('notifications').add({
      userId: friendId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: 'You have a new friend request',
      link: `/social/profile/${userId}`,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Friend request sent' };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (userId: string, friendId: string) => {
  try {
    // Find the friend request
    const requestSnapshot = await db.collection('user_friendships')
      .where('userId', '==', friendId)
      .where('friendId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (requestSnapshot.empty) {
      return { success: false, message: 'Friend request not found' };
    }

    // Update the request status
    await db.collection('user_friendships').doc(requestSnapshot.docs[0].id).update({
      status: 'accepted'
    });

    // Create notification for the sender
    await db.collection('notifications').add({
      userId: friendId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: 'Your friend request was accepted',
      link: `/social/profile/${userId}`,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Friend request accepted' };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

export const getFriendRequests = async (userId: string) => {
  try {
    const querySnapshot = await db.collection('user_friendships')
      .where('friendId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Friendship[];
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const query1 = db.collection('user_friendships')
      .where('userId', '==', userId)
      .where('status', '==', 'accepted');

    const query2 = db.collection('user_friendships')
      .where('friendId', '==', userId)
      .where('status', '==', 'accepted');

    const [snapshot1, snapshot2] = await Promise.all([
      query1.get(),
      query2.get()
    ]);

    const friends1 = snapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      friendId: doc.data().friendId
    })) as (Friendship & { friendId: string })[];

    const friends2 = snapshot2.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      friendId: doc.data().userId
    })) as (Friendship & { friendId: string })[];

    return [...friends1, ...friends2];
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'createdAt' | 'read'>) => {
  try {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('notifications').add(notificationData);
    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string, limit = 20) => {
  try {
    // Use a simple query without ordering to avoid index errors
    const querySnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .limit(limit)
      .get();

    // Sort manually in memory
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];

    // Sort by createdAt in descending order
    return notifications.sort((a, b) => {
      // Handle different timestamp formats
      let dateA: number;
      let dateB: number;

      if (a.createdAt instanceof firebase.firestore.Timestamp) {
        dateA = a.createdAt.toMillis();
      } else if (typeof a.createdAt === 'string') {
        dateA = new Date(a.createdAt).getTime();
      } else if (typeof a.createdAt === 'number') {
        dateA = a.createdAt;
      } else {
        dateA = Date.now(); // Fallback
      }

      if (b.createdAt instanceof firebase.firestore.Timestamp) {
        dateB = b.createdAt.toMillis();
      } else if (typeof b.createdAt === 'string') {
        dateB = new Date(b.createdAt).getTime();
      } else if (typeof b.createdAt === 'number') {
        dateB = b.createdAt;
      } else {
        dateB = Date.now(); // Fallback
      }

      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await db.collection('notifications').doc(notificationId).update({
      read: true
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const querySnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// File Upload
/* These functions are imported from ./uploadFile.js
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (path: string) => {
  try {
    const storageRef = storage.ref(path);
    await storageRef.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
*/

// Initialize Firebase collections
export const initializeFirebaseCollections = async () => {
  try {
    console.log('Initializing Firebase collections...');

    // Create collections if they don't exist
    const collections = [
      'social_posts',
      'post_comments',
      'post_likes',
      'chat_groups',
      'chat_group_members',
      'chat_group_messages',
      'chat_messages',
      'user_friendships',
      'user_profiles',
      'notifications',
      'channel_subscriptions',
      'channel_policies'
    ];

    // For each collection, create a dummy document if it doesn't exist
    // and then delete it to ensure the collection exists
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.limit(1).get();

      if (snapshot.empty) {
        console.log(`Creating collection: ${collectionName}`);
        // Add a temporary document
        const tempDoc = await collectionRef.add({
          _temp: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Delete the temporary document
        await tempDoc.delete();
      }
    }

    console.log('Firebase collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
    return false;
  }
};

// Initialize channel policies
export const initializeChannelPolicies = async () => {
  try {
    const policiesSnapshot = await db.collection('channel_policies').get();

    if (policiesSnapshot.empty) {
      const defaultPolicies = [
        {
          channelType: 'fitness',
          policies: [
            'Share workout routines and fitness tips',
            'Be respectful of different fitness levels',
            'No promotion of unhealthy or extreme diets',
            'No spamming or self-promotion',
            'Keep discussions focused on fitness and health'
          ],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          channelType: 'food',
          policies: [
            'Share healthy recipes and nutrition information',
            'Be respectful of different dietary preferences',
            'No promotion of extreme or dangerous diets',
            'No spamming or self-promotion',
            'Keep discussions focused on food and nutrition'
          ],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          channelType: 'anatomy',
          policies: [
            'Share accurate health and anatomy information',
            'Be respectful and considerate when discussing sensitive topics',
            'No medical advice - general information only',
            'No spamming or self-promotion',
            'Keep discussions focused on health and anatomy'
          ],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      ];

      for (const policy of defaultPolicies) {
        await db.collection('channel_policies').add(policy);
      }

      console.log('Default channel policies created');
    }
  } catch (error) {
    console.error('Error initializing channel policies:', error);
  }
};

// Get channel policies
export const getChannelPolicies = async (channelType: string) => {
  try {
    const policySnapshot = await db.collection('channel_policies')
      .where('channelType', '==', channelType)
      .limit(1)
      .get();

    if (!policySnapshot.empty) {
      return policySnapshot.docs[0].data().policies || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting channel policies:', error);
    return [];
  }
};

// Check if user is subscribed to a channel
export const isUserSubscribedToChannel = async (userId: string, channelId: string) => {
  try {
    const subscriptionSnapshot = await db.collection('channel_subscriptions')
      .where('userId', '==', userId)
      .where('channelId', '==', channelId)
      .limit(1)
      .get();

    return !subscriptionSnapshot.empty;
  } catch (error) {
    console.error('Error checking channel subscription:', error);
    return false;
  }
};

// Subscribe user to a channel
export const subscribeToChannel = async (userId: string, channelId: string) => {
  try {
    // Check if already subscribed
    const isSubscribed = await isUserSubscribedToChannel(userId, channelId);

    if (isSubscribed) {
      return {
        success: true,
        message: 'Already subscribed to this channel'
      };
    }

    // Get channel details
    const channelDoc = await db.collection('chat_groups').doc(channelId).get();

    if (!channelDoc.exists) {
      return {
        success: false,
        message: 'Channel not found'
      };
    }

    const channelData = channelDoc.data();

    // Create subscription
    await db.collection('channel_subscriptions').add({
      userId,
      channelId,
      subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update member count
    await db.collection('chat_groups').doc(channelId).update({
      memberCount: firebase.firestore.FieldValue.increment(1)
    });

    // Send welcome message
    await sendChatGroupMessage(
      channelId,
      'system',
      `Welcome to ${channelData?.name || 'the channel'}! ${channelData?.description || ''}`
    );

    return {
      success: true,
      message: `Successfully subscribed to ${channelData?.name || 'the channel'}`
    };
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    return {
      success: false,
      message: 'Failed to subscribe to channel: ' + (error instanceof Error ? error.message : String(error))
    };
  }
};

// Unsubscribe user from a channel
export const unsubscribeFromChannel = async (userId: string, channelId: string) => {
  try {
    // Find subscription
    const subscriptionSnapshot = await db.collection('channel_subscriptions')
      .where('userId', '==', userId)
      .where('channelId', '==', channelId)
      .limit(1)
      .get();

    if (subscriptionSnapshot.empty) {
      return {
        success: false,
        message: 'Not subscribed to this channel'
      };
    }

    // Delete subscription
    await db.collection('channel_subscriptions').doc(subscriptionSnapshot.docs[0].id).delete();

    // Update member count
    await db.collection('chat_groups').doc(channelId).update({
      memberCount: firebase.firestore.FieldValue.increment(-1)
    });

    return {
      success: true,
      message: 'Successfully unsubscribed from channel'
    };
  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
    return {
      success: false,
      message: 'Failed to unsubscribe from channel: ' + (error instanceof Error ? error.message : String(error))
    };
  }
};

// This function is already defined elsewhere in the file
// Keeping this comment as a placeholder

// Get trending hashtags from posts
export const getTrendingHashtags = async (limit = 5) => {
  try {
    // Get the most recent 100 posts
    const postsSnapshot = await db.collection('social_posts')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    // Extract hashtags from posts
    const hashtags: {[key: string]: number} = {};

    postsSnapshot.docs.forEach(doc => {
      const post = doc.data();

      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      const matches = post.content?.match(hashtagRegex);

      if (matches) {
        matches.forEach((tag: string) => {
          hashtags[tag] = (hashtags[tag] || 0) + 1;
        });
      }

      // Also check for hashtags in the hashtags array
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          // Ensure the tag has a # prefix
          const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
          hashtags[formattedTag] = (hashtags[formattedTag] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const topicsArray = Object.entries(hashtags).map(([name, count], index) => ({
      id: index + 1,
      name: name.replace('#', ''), // Remove # prefix for consistency
      count
    }));

    // Sort by count (descending)
    topicsArray.sort((a, b) => b.count - a.count);

    // Take top N
    return topicsArray.slice(0, limit);
  } catch (error) {
    console.error('Error getting trending hashtags:', error);

    // Return default hashtags if there's an error
    return [
      { id: 101, name: 'HealthyLiving', count: 128 },
      { id: 102, name: 'MentalHealth', count: 96 },
      { id: 103, name: 'Nutrition', count: 87 },
      { id: 104, name: 'Fitness', count: 76 },
      { id: 105, name: 'Wellness', count: 65 }
    ];
  }
};

// Get user's subscribed channels
export const getUserSubscribedChannels = async (userId: string) => {
  try {
    const subscriptionsSnapshot = await db.collection('channel_subscriptions')
      .where('userId', '==', userId)
      .get();

    const channelIds = subscriptionsSnapshot.docs.map(doc => doc.data().channelId);

    if (channelIds.length === 0) {
      return [];
    }

    // Get channel details for each subscription
    const channels = [];

    for (const channelId of channelIds) {
      const channelDoc = await db.collection('chat_groups').doc(channelId).get();

      if (channelDoc.exists) {
        channels.push({
          id: channelDoc.id,
          ...channelDoc.data()
        });
      }
    }

    return channels;
  } catch (error) {
    console.error('Error getting user subscribed channels:', error);
    return [];
  }
};

// Initialize default chat groups if they don't exist
export const initializeDefaultChatGroups = async () => {
  try {
    const groupsSnapshot = await db.collection('chat_groups').get();

    if (groupsSnapshot.empty) {
      const defaultGroups = [
        {
          name: 'Fitness',
          description: 'Discuss fitness routines, exercises, and tips',
          type: 'fitness',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          memberCount: 0
        },
        {
          name: 'Food & Nutrition',
          description: 'Share healthy recipes and nutrition advice',
          type: 'food',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          memberCount: 0
        },
        {
          name: 'Anatomy & Health',
          description: 'Learn about human anatomy and general health topics',
          type: 'anatomy',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          memberCount: 0
        }
      ];

      for (const group of defaultGroups) {
        await db.collection('chat_groups').add(group);
      }

      console.log('Default chat groups created');
    }
  } catch (error) {
    console.error('Error initializing default chat groups:', error);
  }
};

// Get friend suggestions
export const getFriendSuggestions = async (userId: string, limit = 10) => {
  try {
    // Try to get users from user_profiles collection
    const usersSnapshot = await db.collection('user_profiles').limit(limit * 3).get();

    // If no users found, create some mock users
    if (usersSnapshot.empty) {
      console.log('No users found in user_profiles collection, creating mock users');
      return getRandomUserSuggestions(limit);
    }

    // Get current user's friends
    const friends = await getFriends(userId);
    const friendIds = new Set(friends.map(f => f.friendId));

    // Get pending friend requests
    const sentRequestsSnapshot = await db.collection('user_friendships')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const receivedRequestsSnapshot = await db.collection('user_friendships')
      .where('friendId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    // Add pending request IDs to exclude list
    sentRequestsSnapshot.forEach(doc => {
      friendIds.add(doc.data().friendId);
    });

    receivedRequestsSnapshot.forEach(doc => {
      friendIds.add(doc.data().userId);
    });

    // Add current user to exclude list
    friendIds.add(userId);

    // Filter users who are not friends or have pending requests
    const suggestions = usersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => !friendIds.has(user.id))
      .slice(0, limit);

    // If we don't have enough suggestions, get random users
    if (suggestions.length < limit) {
      console.log('Not enough suggestions, using random users');
      const randomUsers = await getRandomUserSuggestions(limit - suggestions.length);
      return [...suggestions, ...randomUsers];
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    return getRandomUserSuggestions(limit);
  }
};

// Generate random user suggestions
const getRandomUserSuggestions = (limit = 5) => {
  // Create mock users with random data
  const mockUsers = [];
  const names = ['Alex Johnson', 'Jamie Smith', 'Taylor Brown', 'Jordan Wilson', 'Casey Miller', 'Riley Davis', 'Morgan Clark', 'Quinn Moore', 'Avery Anderson', 'Dakota Thomas'];
  const avatars = [
    'https://randomuser.me/api/portraits/men/1.jpg',
    'https://randomuser.me/api/portraits/women/2.jpg',
    'https://randomuser.me/api/portraits/men/3.jpg',
    'https://randomuser.me/api/portraits/women/4.jpg',
    'https://randomuser.me/api/portraits/men/5.jpg',
    'https://randomuser.me/api/portraits/women/6.jpg',
    'https://randomuser.me/api/portraits/men/7.jpg',
    'https://randomuser.me/api/portraits/women/8.jpg',
    'https://randomuser.me/api/portraits/men/9.jpg',
    'https://randomuser.me/api/portraits/women/10.jpg'
  ];

  // Generate random users
  for (let i = 0; i < Math.min(limit, names.length); i++) {
    const randomId = 'random_' + Math.random().toString(36).substring(2, 10);
    mockUsers.push({
      id: randomId,
      full_name: names[i],
      avatar_url: avatars[i],
      mutual_friends: Math.floor(Math.random() * 5)
    });
  }

  return mockUsers;
};

// Get user by ID
export const getUserById = async (userId: string) => {
  try {
    const userDoc = await db.collection('user_profiles').doc(userId).get();

    if (userDoc.exists) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }

    // If user profile doesn't exist in Firestore, we can't get it directly from Auth in client-side
    // Instead, try to get from Supabase as a fallback
    try {
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', userId)
        .single();

      if (!error && userProfile) {
        // Create a basic profile from Supabase data
        const basicProfile = {
          id: userId,
          displayName: userProfile.full_name || `User ${userId.substring(0, 4)}`,
          photoURL: userProfile.avatar_url || null,
          email: userProfile.email || null
        };

        // Save this basic profile to Firestore for future use
        await db.collection('user_profiles').doc(userId).set({
          ...basicProfile,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return basicProfile;
      }
    } catch (supabaseError) {
      console.error('Error getting user from Supabase:', supabaseError);
    }

    // If we couldn't get the user from Firestore or Supabase, create a minimal profile
    const minimalProfile = {
      id: userId,
      displayName: `User ${userId.substring(0, 4)}`,
      photoURL: null,
      email: null
    };

    // Save this minimal profile to Firestore for future use
    try {
      await db.collection('user_profiles').doc(userId).set({
        ...minimalProfile,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (saveError) {
      console.error('Error saving minimal profile to Firestore:', saveError);
    }

    return minimalProfile;
  } catch (error) {
    console.error('Error getting user by ID:', error);

    // Return a placeholder user object
    return {
      id: userId,
      displayName: `User ${userId.substring(0, 4)}`,
      photoURL: null,
      email: null
    };
  }
};

// This function is already defined elsewhere in the file
// Keeping this comment as a placeholder

// Get posts by hashtag
export const getPostsByHashtag = async (hashtag: string, limit = 20) => {
  try {
    // Remove # if present
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
    const formattedHashtag = `#${cleanHashtag}`;

    // Get posts that contain the hashtag in content
    const contentQuery = db.collection('social_posts')
      .where('content', '>=', formattedHashtag)
      .where('content', '<=', formattedHashtag + '\uf8ff')
      .limit(limit);

    // Get posts that have the hashtag in their hashtags array
    const arrayQuery = db.collection('social_posts')
      .where('hashtags', 'array-contains', formattedHashtag)
      .limit(limit);

    const [contentSnapshot, arraySnapshot] = await Promise.all([
      contentQuery.get(),
      arrayQuery.get()
    ]);

    // Combine results and remove duplicates
    const postsMap = new Map();

    contentSnapshot.docs.forEach(doc => {
      postsMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      });
    });

    arraySnapshot.docs.forEach(doc => {
      if (!postsMap.has(doc.id)) {
        postsMap.set(doc.id, {
          id: doc.id,
          ...doc.data()
        });
      }
    });

    return Array.from(postsMap.values());
  } catch (error) {
    console.error('Error getting posts by hashtag:', error);
    return [];
  }
};

// Remove test posts from the database
export const removeTestPosts = async () => {
  try {
    console.log('Searching for test posts to remove...');

    // First check if the social_posts collection exists
    const collectionRef = db.collection('social_posts');
    const checkSnapshot = await collectionRef.limit(1).get();

    if (!checkSnapshot.exists && checkSnapshot.empty) {
      console.log('social_posts collection does not exist or is empty, creating it...');
      // Create the collection with a temporary document
      const tempDoc = await collectionRef.add({
        _temp: true,
        content: 'Temporary document to create collection',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Delete the temporary document
      await tempDoc.delete();

      return {
        success: true,
        message: 'No test posts found. Collection was empty and has been initialized.'
      };
    }

    // Query posts that contain test-related content
    try {
      // Try a simple query first to test if the collection is working
      const testQuery = await collectionRef.limit(5).get();
      console.log(`Collection access test: Found ${testQuery.size} posts`);
    } catch (queryError) {
      console.error('Error accessing social_posts collection:', queryError);
      return {
        success: false,
        message: 'Error accessing social_posts collection. Database may not be properly set up.',
        error: queryError
      };
    }

    // Now proceed with the actual test post queries
    const testPostsQuery = collectionRef
      .where('content', '>=', 'test')
      .where('content', '<=', 'test\uf8ff');

    const firebaseTestQuery = collectionRef
      .where('content', '>=', 'Firebase test')
      .where('content', '<=', 'Firebase test\uf8ff');

    let testPostsSnapshot, firebaseTestSnapshot;

    try {
      [testPostsSnapshot, firebaseTestSnapshot] = await Promise.all([
        testPostsQuery.get(),
        firebaseTestQuery.get()
      ]);
    } catch (queryError) {
      console.error('Error querying for test posts:', queryError);

      // Try a simpler approach - get all posts and filter in memory
      try {
        const allPostsSnapshot = await collectionRef.get();
        console.log(`Fallback method: Retrieved ${allPostsSnapshot.size} total posts`);

        // Combine results and remove duplicates
        const postsToDelete = new Map();

        allPostsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.content && typeof data.content === 'string' &&
              data.content.toLowerCase().includes('test')) {
            postsToDelete.set(doc.id, doc.ref);
          }
        });

        console.log(`Found ${postsToDelete.size} test posts to remove using fallback method`);

        if (postsToDelete.size === 0) {
          return {
            success: true,
            message: 'No test posts found to remove.'
          };
        }

        // Delete the posts in batches
        const batch = db.batch();
        let count = 0;

        postsToDelete.forEach((ref) => {
          batch.delete(ref);
          count++;

          // Firestore batches are limited to 500 operations
          if (count >= 400) {
            // Commit the batch and start a new one
            batch.commit();
            count = 0;
          }
        });

        // Commit any remaining operations
        if (count > 0) {
          await batch.commit();
        }

        return {
          success: true,
          message: `Successfully removed ${postsToDelete.size} test posts using fallback method`
        };
      } catch (fallbackError) {
        console.error('Error with fallback method:', fallbackError);
        return {
          success: false,
          message: 'Failed to remove test posts using both methods',
          error: fallbackError
        };
      }
    }

    // Combine results and remove duplicates
    const postsToDelete = new Map();

    testPostsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Only delete if it's clearly a test post
      if (data.content && typeof data.content === 'string' &&
          data.content.toLowerCase().includes('test')) {
        postsToDelete.set(doc.id, doc.ref);
      }
    });

    firebaseTestSnapshot.docs.forEach(doc => {
      postsToDelete.set(doc.id, doc.ref);
    });

    console.log(`Found ${postsToDelete.size} test posts to remove`);

    if (postsToDelete.size === 0) {
      return {
        success: true,
        message: 'No test posts found to remove.'
      };
    }

    // Delete the posts in batches
    const batch = db.batch();
    let count = 0;

    postsToDelete.forEach((ref) => {
      batch.delete(ref);
      count++;

      // Firestore batches are limited to 500 operations
      if (count >= 400) {
        // Commit the batch and start a new one
        batch.commit();
        count = 0;
      }
    });

    // Commit any remaining operations
    if (count > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: `Successfully removed ${postsToDelete.size} test posts`
    };
  } catch (error) {
    console.error('Error removing test posts:', error);
    return {
      success: false,
      message: 'Failed to remove test posts: ' + (error instanceof Error ? error.message : String(error)),
      error
    };
  }
};

// Clean the entire Firebase database
export const cleanFirebaseDatabase = async () => {
  try {
    console.log('Starting database cleanup...');

    // Collections to clean
    const collections = [
      'social_posts',
      'post_comments',
      'post_likes',
      'chat_messages',
      'notifications',
      'chat_group_messages',
      'user_friendships'
    ];

    let totalDeleted = 0;

    for (const collectionName of collections) {
      try {
        console.log(`Cleaning collection: ${collectionName}`);

        // Get all documents in the collection
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
          console.log(`Collection ${collectionName} is already empty`);
          continue;
        }

        console.log(`Found ${snapshot.size} documents to delete in ${collectionName}`);
        totalDeleted += snapshot.size;

        // Delete in batches (Firestore has a limit of 500 operations per batch)
        const batchSize = 400;
        let count = 0;
        let batch = db.batch();

        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          count++;

          if (count >= batchSize) {
            console.log(`Committing batch of ${count} deletions...`);
            await batch.commit();
            batch = db.batch();
            count = 0;
          }
        }

        // Commit any remaining deletions
        if (count > 0) {
          console.log(`Committing final batch of ${count} deletions...`);
          await batch.commit();
        }

        console.log(`Successfully cleaned collection: ${collectionName}`);
      } catch (error) {
        console.error(`Error cleaning collection ${collectionName}:`, error);
      }
    }

    console.log('Database cleanup completed!');
    return {
      success: true,
      message: `Successfully deleted ${totalDeleted} documents from the database`
    };
  } catch (error) {
    console.error('Error cleaning database:', error);
    return {
      success: false,
      message: 'Failed to clean database: ' + (error instanceof Error ? error.message : String(error)),
      error
    };
  }
};

// Create a test post for testing purposes
export const createTestPost = async (userId: string) => {
  try {
    // Get user information from Supabase
    let userName = '';
    let userPhotoURL = '';

    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (userData) {
        userName = userData.full_name || '';
        userPhotoURL = userData.avatar_url || '';
      }
    } catch (userError) {
      console.error('Error fetching user data for test post:', userError);
      // Continue with post creation even if user data fetch fails
    }

    const testPost = {
      userId,
      userName,
      userPhotoURL,
      content: 'This is a test post from Firebase. #health #wellness',
      hashtags: ['#health', '#wellness'],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      likes: 0,
      comments: 0
    };

    const docRef = await db.collection('social_posts').add(testPost);
    return {
      success: true,
      message: 'Test post created successfully',
      postId: docRef.id
    };
  } catch (error) {
    console.error('Error creating test post:', error);
    return {
      success: false,
      message: 'Failed to create test post: ' + (error instanceof Error ? error.message : String(error)),
      error
    };
  }
};

// Export the service
const firebaseSocialService = {
  // Firebase references
  db,
  storage,

  // Posts
  createPost,
  getPosts,
  getUserPosts,
  removeTestPosts,
  createTestPost,
  subscribeToPostUpdates,
  cleanFirebaseDatabase,

  // Comments
  createComment,
  getPostComments,
  createCommentWithParams,
  deleteComment,

  // Likes
  likePost,
  unlikePost,
  checkIfLiked,

  // Chat Groups
  getChatGroups,
  getUserChatGroups,
  joinChatGroup,
  leaveChatGroup,

  // Chat Group Messages
  sendChatGroupMessage,
  getChatGroupMessages,
  subscribeToChatGroupMessages,

  // Direct Messages
  sendDirectMessage,
  getDirectMessages,
  subscribeToDirectMessages,

  // Friendships
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  getFriendSuggestions,
  getUserById,

  // Hashtags
  getTrendingHashtags,
  getPostsByHashtag,

  // Notifications
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // File Upload
  uploadFile,
  deleteFile,
  uploadPostImage: async (file: File, userId: string) => {
    const path = `social/posts/${userId}/${Date.now()}_${file.name}`;
    return await uploadFile(file, path);
  },

  // Initialization
  initializeFirebaseCollections,
  initializeDefaultChatGroups,
  initializeChannelPolicies,

  // Channel subscriptions
  isUserSubscribedToChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
  getUserSubscribedChannels,
  getChannelPolicies,

  // Saved Posts
  savePost: async (postId: string, userId: string) => {
    try {
      // Check if already saved
      const querySnapshot = await db.collection('saved_posts')
        .where('postId', '==', postId)
        .where('userId', '==', userId)
        .get();

      if (querySnapshot.empty) {
        // Create saved post record
        const savedPostData = {
          postId,
          userId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('saved_posts').add(savedPostData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  },

  // Get liked posts for a user
  getLikedPosts: async (userId: string) => {
    try {
      // Get all likes by this user
      const querySnapshot = await db.collection('post_likes')
        .where('userId', '==', userId)
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        postId: doc.data().postId,
        createdAt: doc.data().createdAt
      }));
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      return [];
    }
  },

  unsavePost: async (postId: string, userId: string) => {
    try {
      // Find saved post document
      const querySnapshot = await db.collection('saved_posts')
        .where('postId', '==', postId)
        .where('userId', '==', userId)
        .get();

      if (!querySnapshot.empty) {
        // Delete saved post record
        await db.collection('saved_posts').doc(querySnapshot.docs[0].id).delete();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsaving post:', error);
      throw error;
    }
  },

  getSavedPosts: async (userId: string) => {
    try {
      const querySnapshot = await db.collection('saved_posts')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting saved posts:', error);
      throw error;
    }
  },

  // Comments
  getComments: async (postId: string) => {
    try {
      return await getPostComments(postId);
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  },

  addComment: async (comment: Omit<Comment, 'createdAt'>) => {
    try {
      return await createComment(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Trending topics
  fetchTrendingHashtags: getTrendingHashtags
};

export { firebaseSocialService };
export default firebaseSocialService;
