import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../lib/socialService';
import { supabase } from '../../lib/supabaseClient';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import EnhancedPostCard from '../../components/social/EnhancedPostCard';
import EnhancedCommentSection from '../../components/social/EnhancedCommentSection';
import { 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Settings, 
  Calendar, 
  MapPin, 
  Link, 
  Grid, 
  List, 
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Camera,
  X
} from 'lucide-react';

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showBio, setShowBio] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [newCoverPhoto, setNewCoverPhoto] = useState<File | null>(null);
  const [newCoverPhotoPreview, setNewCoverPhotoPreview] = useState<string | null>(null);
  
  const isOwnProfile = user && id === user.id;
  
  // Load profile and posts
  useEffect(() => {
    const loadProfileAndPosts = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        setEditedProfile(profileData);
        
        // Load posts
        const postsData = await socialService.getUserPosts(id);
        
        // Check if user has liked each post
        if (user) {
          const postsWithLikeStatus = await Promise.all(
            postsData.map(async (post) => {
              const isLiked = await socialService.isPostLikedByUser(post.id, user.id);
              return { ...post, liked_by_user: isLiked };
            })
          );
          setPosts(postsWithLikeStatus);
        } else {
          setPosts(postsData);
        }
        
        // Load follow status (mock data for now)
        setIsFollowing(false);
        setFollowersCount(Math.floor(Math.random() * 500) + 10);
        setFollowingCount(Math.floor(Math.random() * 300) + 5);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || t('social.errorLoadingProfile'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileAndPosts();
  }, [id, user]);
  
  // Handle like/unlike
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      await socialService.likePost(postId, user.id);
      
      // Update local state
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                liked_by_user: true, 
                likes_count: (post.likes_count || 0) + 1 
              } 
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };
  
  const handleUnlike = async (postId: string) => {
    if (!user) return;
    
    try {
      await socialService.unlikePost(postId, user.id);
      
      // Update local state
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                liked_by_user: false, 
                likes_count: Math.max(0, (post.likes_count || 0) - 1) 
              } 
            : post
        )
      );
    } catch (err) {
      console.error('Error unliking post:', err);
    }
  };
  
  // Handle comment
  const handleComment = (postId: string) => {
    setActiveCommentPostId(postId);
  };
  
  // Handle share
  const handleShare = (postId: string) => {
    // In a real app, you would implement sharing functionality
    console.log('Sharing post:', postId);
  };
  
  // Handle delete
  const handleDelete = async (postId: string) => {
    if (!user) return;
    if (!window.confirm(t('social.confirmDeletePost'))) return;
    
    try {
      await socialService.deletePost(postId);
      
      // Update local state
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = () => {
    // In a real app, you would call a service to follow/unfollow the user
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
  };
  
  // Handle message
  const handleMessage = () => {
    // In a real app, you would navigate to a chat page or open a chat modal
    navigate(`/social/messages/${id}`);
  };
  
  // Handle profile edit
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle cover photo change
  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewCoverPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCoverPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload avatar if changed
      let avatarUrl = profile.avatar_url;
      if (newAvatar) {
        const fileExt = newAvatar.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, newAvatar, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        avatarUrl = data.publicUrl;
      }
      
      // Upload cover photo if changed
      let coverPhotoUrl = profile.cover_photo_url;
      if (newCoverPhoto) {
        const fileExt = newCoverPhoto.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `covers/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, newCoverPhoto, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        coverPhotoUrl = data.publicUrl;
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...editedProfile,
          avatar_url: avatarUrl,
          cover_photo_url: coverPhotoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProfile({
        ...editedProfile,
        avatar_url: avatarUrl,
        cover_photo_url: coverPhotoUrl,
        updated_at: new Date().toISOString()
      });
      
      // Reset edit state
      setIsEditingProfile(false);
      setNewAvatar(null);
      setNewAvatarPreview(null);
      setNewCoverPhoto(null);
      setNewCoverPhotoPreview(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(err.message || t('social.errorUpdatingProfile'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel profile edit
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile(profile);
    setNewAvatar(null);
    setNewAvatarPreview(null);
    setNewCoverPhoto(null);
    setNewCoverPhotoPreview(null);
  };
  
  if (isLoading) {
    return (
      <NewSocialLayout>
        <div className="social-card p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">{t('social.loadingProfile')}</p>
          </div>
        </div>
      </NewSocialLayout>
    );
  }
  
  if (error || !profile) {
    return (
      <NewSocialLayout>
        <div className="social-card p-6">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <p className="font-medium">{t('common.error')}</p>
            <p className="mt-1">{error || t('social.profileNotFound')}</p>
            <button 
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => navigate('/social')}
            >
              {t('social.backToFeed')}
            </button>
          </div>
        </div>
      </NewSocialLayout>
    );
  }
  
  return (
    <NewSocialLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="social-card overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-blue-400 to-indigo-500">
            {(profile.cover_photo_url || newCoverPhotoPreview) && (
              <img 
                src={newCoverPhotoPreview || profile.cover_photo_url} 
                alt={profile.full_name} 
                className="w-full h-full object-cover"
              />
            )}
            
            {isEditingProfile && (
              <label className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleCoverPhotoChange}
                />
                <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </label>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="relative px-4 sm:px-6 pb-6">
            {/* Avatar */}
            <div className="absolute -top-16 left-4 sm:left-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-white dark:bg-gray-800">
                  <img 
                    src={newAvatarPreview || profile.avatar_url || '/images/default_user.jpg'} 
                    alt={profile.full_name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {isEditingProfile && (
                  <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </label>
                )}
              </div>
            </div>
            
            {/* Profile Actions */}
            <div className="flex justify-end mt-4">
              {isOwnProfile ? (
                isEditingProfile ? (
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      onClick={handleSaveProfile}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                ) : (
                  <button 
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {t('social.editProfile')}
                  </button>
                )
              ) : (
                <div className="flex space-x-2">
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      isFollowing 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        {t('social.following')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('social.follow')}
                      </>
                    )}
                  </button>
                  <button 
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                    onClick={handleMessage}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('social.message')}
                  </button>
                </div>
              )}
            </div>
            
            {/* Profile Details */}
            <div className="mt-16">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('social.fullName')}
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      className="social-input"
                      value={editedProfile.full_name || ''}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('social.bio')}
                    </label>
                    <textarea
                      name="bio"
                      className="social-input min-h-[100px] resize-none"
                      value={editedProfile.bio || ''}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('social.location')}
                    </label>
                    <input
                      type="text"
                      name="location"
                      className="social-input"
                      value={editedProfile.location || ''}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('social.website')}
                    </label>
                    <input
                      type="text"
                      name="website"
                      className="social-input"
                      value={editedProfile.website || ''}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.full_name}
                  </h1>
                  
                  <div className="flex items-center mt-1 text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {t('social.joinedDate', { 
                        date: new Date(profile.created_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long' 
                        }) 
                      })}
                    </span>
                  </div>
                  
                  {profile.bio && (
                    <div className="mt-4">
                      <div className={`text-gray-700 dark:text-gray-300 whitespace-pre-line ${
                        !showBio && profile.bio.length > 150 ? 'line-clamp-3' : ''
                      }`}>
                        {profile.bio}
                      </div>
                      
                      {profile.bio.length > 150 && (
                        <button 
                          className="mt-1 text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center"
                          onClick={() => setShowBio(!showBio)}
                        >
                          {showBio ? (
                            <>
                              {t('social.showLess')}
                              <ChevronUp className="w-4 h-4 ml-1" />
                            </>
                          ) : (
                            <>
                              {t('social.showMore')}
                              <ChevronDown className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-y-2">
                    {profile.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mr-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    
                    {profile.website && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Link className="w-4 h-4 mr-1" />
                        <a 
                          href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-4">
                    <button 
                      className="text-gray-700 dark:text-gray-300 hover:underline"
                      onClick={() => navigate(`/social/profile/${id}/followers`)}
                    >
                      <span className="font-semibold">{followersCount}</span> {t('social.followers')}
                    </button>
                    <button 
                      className="text-gray-700 dark:text-gray-300 hover:underline"
                      onClick={() => navigate(`/social/profile/${id}/following`)}
                    >
                      <span className="font-semibold">{followingCount}</span> {t('social.following')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Tabs */}
        <div className="social-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {posts.length} {posts.length === 1 ? t('social.post') : t('social.posts')}
            </div>
          </div>
        </div>
        
        {/* Posts */}
        {posts.length === 0 ? (
          <div className="social-card p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isOwnProfile ? t('social.youHaveNoPosts') : t('social.userHasNoPosts')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {isOwnProfile ? t('social.createFirstPostPrompt') : t('social.emptyProfileDescription')}
              </p>
              {isOwnProfile && (
                <button 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => navigate('/social')}
                >
                  {t('social.createPost')}
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <EnhancedPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onComment={handleComment}
                onShare={handleShare}
                onDelete={handleDelete}
                isCommentSectionOpen={activeCommentPostId === post.id}
              />
            ))}
          </div>
        ) : (
          <div className="social-card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div 
                  key={post.id}
                  className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                  onClick={() => navigate(`/social/post/${post.id}`)}
                >
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt={post.content.substring(0, 20)} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-5 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-4 text-white">
                      <div className="flex items-center">
                        <Heart className="w-5 h-5 mr-1" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-5 h-5 mr-1" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Comment Modal */}
      <AnimatePresence>
        {activeCommentPostId && (
          <EnhancedCommentSection
            postId={activeCommentPostId}
            onClose={() => setActiveCommentPostId(null)}
          />
        )}
      </AnimatePresence>
    </NewSocialLayout>
  );
};

export default UserProfilePage;
