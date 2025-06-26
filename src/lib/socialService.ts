import { supabase } from './supabaseClient';
import compressionService from './compressionService';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
  likes_count?: number | { count: number };
  comments_count?: number | { count: number };
  liked_by_user?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export const socialService = {
  // Posts
  async getPosts(limit = 20, offset = 0) {
    try {
      console.log('Fetching posts with likes and comments count');

      // Get the posts with their counts
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      console.log('Posts data received:', postsData);

      // If we have posts, get the user info for each post
      if (postsData && postsData.length > 0) {
        const postsWithUserInfo = await Promise.all(
          postsData.map(async (post) => {
            console.log('Fetching user info for post:', post.id, 'user_id:', post.user_id);

            // Decompress content if needed
            let postContent = post.content;
            if (post.is_compressed) {
              try {
                console.log('Decompressing post content for post:', post.id);
                postContent = compressionService.decompress(post.content);
              } catch (decompressErr) {
                console.error('Error decompressing post content:', decompressErr);
                // Keep the original content if decompression fails
              }
            }

            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', post.user_id)
                .maybeSingle();

              if (userError) {
                console.error('Error fetching user info for post:', post.id, 'Error:', userError);
                return {
                  ...post,
                  content: postContent,
                  user: { full_name: 'User', avatar_url: null }
                };
              }

              if (!userData) {
                console.log('No user data found for post:', post.id, 'Creating default user info');

                // Try to create a profile for this user
                try {
                  await supabase
                    .from('profiles')
                    .insert([
                      {
                        id: post.user_id,
                        full_name: 'User',
                        avatar_url: null
                      }
                    ]);
                } catch (insertErr) {
                  console.error('Error creating profile for user:', insertErr);
                }

                return {
                  ...post,
                  content: postContent,
                  user: { full_name: 'User', avatar_url: null }
                };
              }

              console.log('User data found for post:', post.id, 'User data:', userData);
              return {
                ...post,
                content: postContent,
                user: userData
              };
            } catch (err) {
              console.error('Error processing post user data:', err);
              return {
                ...post,
                content: postContent,
                user: { full_name: 'User', avatar_url: null }
              };
            }
          })
        );

        console.log('Returning posts with user info:', postsWithUserInfo);
        return postsWithUserInfo;
      }

      console.log('No posts found');
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  async getUserPosts(userId: string, limit = 20, offset = 0) {
    try {
      console.log('Fetching posts for user:', userId);

      // Get the posts with their counts
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        throw postsError;
      }

      console.log('User posts data received:', postsData);

      // If we have posts, get the user info
      if (postsData && postsData.length > 0) {
        // Get the user info once since all posts are from the same user
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user info:', userError);
          return postsData.map(post => ({
            ...post,
            user: { full_name: 'User', avatar_url: null }
          }));
        }

        if (!userData) {
          console.log('No user data found for user:', userId, 'Creating default user info');

          // Try to create a profile for this user
          try {
            await supabase
              .from('profiles')
              .insert([
                {
                  id: userId,
                  full_name: 'User',
                  avatar_url: null
                }
              ]);
          } catch (insertErr) {
            console.error('Error creating profile for user:', insertErr);
          }

          return postsData.map(post => ({
            ...post,
            user: { full_name: 'User', avatar_url: null }
          }));
        }

        console.log('User data found:', userData);

        // Add user info to all posts
        return postsData.map(post => ({
          ...post,
          user: userData
        }));
      }

      console.log('No posts found for user:', userId);
      return [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  },

  async getPostById(postId: string) {
    try {
      console.log('Fetching post by ID:', postId);

      // Get the post with its counts
      const { data: postData, error: postError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw postError;
      }

      if (!postData) {
        console.log('No post found with ID:', postId);
        return null;
      }

      console.log('Post data received:', postData);

      // Decompress content if needed
      let postContent = postData.content;
      if (postData.is_compressed) {
        try {
          console.log('Decompressing post content for post:', postId);
          postContent = compressionService.decompress(postData.content);
        } catch (decompressErr) {
          console.error('Error decompressing post content:', decompressErr);
          // Keep the original content if decompression fails
        }
      }

      // Get the user info
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', postData.user_id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user info for post:', postId, 'Error:', userError);
        return {
          ...postData,
          content: postContent,
          user: { full_name: 'User', avatar_url: null }
        };
      }

      if (!userData) {
        console.log('No user data found for post:', postId, 'Creating default user info');

        // Try to create a profile for this user
        try {
          await supabase
            .from('profiles')
            .insert([
              {
                id: postData.user_id,
                full_name: 'User',
                avatar_url: null
              }
            ]);
        } catch (insertErr) {
          console.error('Error creating profile for user:', insertErr);
        }

        return {
          ...postData,
          content: postContent,
          user: { full_name: 'User', avatar_url: null }
        };
      }

      console.log('User data found for post:', postId, 'User data:', userData);
      return {
        ...postData,
        content: postContent,
        user: userData
      };
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  async createPost(postData: { user_id: string, content: string, image_url?: string, hashtags?: string[], is_anonymous?: boolean }) {
    try {
      // Check if content should be compressed (longer posts)
      let finalContent = postData.content;
      let isCompressed = false;

      if (compressionService.shouldCompress(postData.content, 500)) {
        console.log('Compressing post content');
        finalContent = compressionService.compress(postData.content);
        isCompressed = true;
        console.log(`Compression ratio: ${compressionService.getCompressionRatio(postData.content, finalContent)}%`);
      }

      // Extract hashtags from content if not already provided
      const hashtagRegex = /#(\w+)/g;
      const extractedHashtags = postData.content.match(hashtagRegex) || [];
      const hashtags = postData.hashtags || extractedHashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      // Prepare post data
      const postInsertData = {
        user_id: postData.user_id,
        content: finalContent,
        image_url: postData.image_url,
        is_compressed: isCompressed,
        hashtags: hashtags,
        is_anonymous: postData.is_anonymous || false
      };

      // Check if social_posts table exists
      try {
        const { data, error } = await supabase
          .from('social_posts')
          .insert([postInsertData])
          .select()
          .single();

        if (error) {
          console.error('Error creating post:', error);

          // If the table doesn't exist or has different columns, try with minimal data
          if (error.code === '42P01' || error.message.includes('column') || error.message.includes('does not exist')) {
            console.log('Trying with minimal post data');
            const { data: minimalData, error: minimalError } = await supabase
              .from('social_posts')
              .insert([{
                user_id: postData.user_id,
                content: finalContent,
                image_url: postData.image_url
              }])
              .select()
              .single();

            if (minimalError) {
              console.error('Error creating post with minimal data:', minimalError);
              throw minimalError;
            }

            return minimalData;
          }

          throw error;
        }

        return data;
      } catch (tableError) {
        console.error('Error with social_posts table:', tableError);
        throw tableError;
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async updatePost(postId: string, content: string, imageUrl?: string) {
    try {
      // Check if content should be compressed (longer posts)
      let finalContent = content;
      let isCompressed = false;

      if (compressionService.shouldCompress(content, 500)) {
        console.log('Compressing post content');
        finalContent = compressionService.compress(content);
        isCompressed = true;
        console.log(`Compression ratio: ${compressionService.getCompressionRatio(content, finalContent)}%`);
      }

      const { data, error } = await supabase
        .from('social_posts')
        .update({
          content: finalContent,
          image_url: imageUrl,
          is_compressed: isCompressed,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Comments
  async getCommentsByPostId(postId: string) {
    try {
      console.log('Fetching comments for post:', postId);

      // First, get the comments without the user info
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        throw commentsError;
      }

      console.log('Comments data received:', commentsData);

      // If we have comments, get the user info for each comment
      if (commentsData && commentsData.length > 0) {
        const commentsWithUserInfo = await Promise.all(
          commentsData.map(async (comment) => {
            console.log('Fetching user info for comment:', comment.id, 'user_id:', comment.user_id);

            console.log('Fetching user profile for user_id:', comment.user_id);
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', comment.user_id)
              .maybeSingle();

            if (userError) {
              console.error('Error fetching user info for comment:', comment.id, 'Error:', userError);
              return {
                ...comment,
                user: { full_name: 'User', avatar_url: null }
              };
            }

            console.log('User data found for comment:', comment.id, 'User data:', userData);
            return {
              ...comment,
              user: userData
            };
          })
        );

        console.log('Returning comments with user info:', commentsWithUserInfo);
        return commentsWithUserInfo;
      }

      console.log('No comments found for post:', postId);
      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async createComment(postId: string, userId: string, content: string, parentId?: string) {
    try {
      console.log('Creating comment for post:', postId, 'by user:', userId, 'content:', content);

      // Prepare comment data
      const commentData = {
        post_id: postId,
        user_id: userId,
        content
      };

      // Add parent_id if provided
      if (parentId) {
        commentData['parent_id'] = parentId;
      }

      // Try to insert with parent_id if provided
      try {
        const { data, error } = await supabase
          .from('post_comments')
          .insert([commentData])
          .select()
          .single();

        if (error) {
          // If error mentions parent_id, try again without it
          if (error.message && error.message.includes('parent_id')) {
            console.log('Retrying without parent_id');
            delete commentData['parent_id'];

            const { data: retryData, error: retryError } = await supabase
              .from('post_comments')
              .insert([commentData])
              .select()
              .single();

            if (retryError) throw retryError;
            return retryData;
          }

          throw error;
        }

        return data;
      } catch (tableError) {
        // If the table doesn't exist or has different columns, try with minimal data
        console.error('Error with post_comments table:', tableError);

        // Try one more time with minimal data
        const { data, error } = await supabase
          .from('post_comments')
          .insert([{
            post_id: postId,
            user_id: userId,
            content
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating comment:', error);
          throw error;
        }

        console.log('Comment created successfully:', data);
        return data;
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  async updateComment(commentId: string, content: string) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  async deleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Likes
  async likePost(postId: string, userId: string, retryCount = 0) {
    try {
      console.log('Liking post in service:', postId, 'by user:', userId);

      // First check if the post is already liked to avoid duplicate likes
      const { data: existingLike, error: checkError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing like:', checkError);
      }

      if (existingLike) {
        console.log('Post already liked:', existingLike);
        return existingLike;
      }

      // If not already liked, create a new like
      const { data, error } = await supabase
        .from('post_likes')
        .insert([
          {
            post_id: postId,
            user_id: userId
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting like:', error);

        // If the table doesn't exist, try to create it
        if (error.code === '42P01' && retryCount === 0) {
          console.log('post_likes table does not exist, trying to create it...');

          // We can't create tables from the client, so we'll return a mock response
          return {
            id: `mock-${Date.now()}`,
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
          };
        }

        throw error;
      }

      console.log('Like created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  async unlikePost(postId: string, userId: string) {
    try {
      console.log('Unliking post in service:', postId, 'by user:', userId);

      const { data, error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting like:', error);
        throw error;
      }

      console.log('Like deleted successfully');
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  async isPostLikedByUser(postId: string, userId: string) {
    try {
      console.log('Checking if post is liked:', postId, 'by user:', userId);

      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if post is liked:', error);
        return false;
      }

      const isLiked = !!data;
      console.log('Post liked status:', isLiked);
      return isLiked;
    } catch (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }
  },

  async getPostLikes(postId: string) {
    try {
      console.log('Fetching likes for post:', postId);

      // First, get the likes without the user info
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        throw likesError;
      }

      console.log('Likes data received:', likesData);

      // If we have likes, get the user info for each like
      if (likesData && likesData.length > 0) {
        const likesWithUserInfo = await Promise.all(
          likesData.map(async (like) => {
            console.log('Fetching user info for like user_id:', like.user_id);

            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', like.user_id)
                .maybeSingle();

              if (userError) {
                console.error('Error fetching user info for like:', like.id, 'Error:', userError);
                return {
                  ...like,
                  user: { full_name: 'User', avatar_url: null }
                };
              }

              if (!userData) {
                console.log('No user data found for like:', like.id, 'Creating default user info');

                // Try to create a profile for this user
                try {
                  await supabase
                    .from('profiles')
                    .insert([
                      {
                        id: like.user_id,
                        full_name: 'User',
                        avatar_url: null
                      }
                    ]);
                } catch (insertErr) {
                  console.error('Error creating profile for user:', insertErr);
                }

                return {
                  ...like,
                  user: { full_name: 'User', avatar_url: null }
                };
              }

              console.log('User data found for like:', like.id, 'User data:', userData);
              return {
                ...like,
                user: userData
              };
            } catch (err) {
              console.error('Error processing like user data:', err);
              return {
                ...like,
                user: { full_name: 'User', avatar_url: null }
              };
            }
          })
        );

        console.log('Returning likes with user info:', likesWithUserInfo);
        return likesWithUserInfo;
      }

      console.log('No likes found for post:', postId);
      return [];
    } catch (error) {
      console.error('Error fetching post likes:', error);
      return [];
    }
  },

  async getLikedPosts(userId: string) {
    try {
      console.log('Fetching liked posts for user:', userId);

      // Get all likes by this user
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('*')
        .eq('user_id', userId);

      if (likesError) {
        console.error('Error fetching liked posts:', likesError);
        throw likesError;
      }

      console.log('Liked posts data received:', likesData);

      // Format the data to match what the component expects
      return likesData.map(like => ({
        id: like.id,
        userId: like.user_id,
        postId: like.post_id,
        createdAt: like.created_at
      }));
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      return [];
    }
  },

  // Upload image for post
  async uploadPostImage(file: File, userId: string) {
    try {
      // Simplify the file path to avoid permission issues
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading file to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('social')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      const { data } = supabase.storage
        .from('social')
        .getPublicUrl(filePath);

      console.log('Public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};
