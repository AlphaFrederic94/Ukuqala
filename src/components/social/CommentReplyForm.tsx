import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebase } from '../../contexts/FirebaseContext';
import { supabase } from '../../lib/supabaseClient';

interface CommentReplyFormProps {
  postId: string;
  commentId: string;
  onReplyAdded: (reply: any) => void;
  onCancel: () => void;
}

const CommentReplyForm: React.FC<CommentReplyFormProps> = ({
  postId,
  commentId,
  onReplyAdded,
  onCancel
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socialService } = useFirebase();
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !replyText.trim()) return;

    setIsSubmitting(true);

    try {
      // Try Firebase first
      try {
        const newReply = await socialService.addComment({
          postId,
          userId: user.id,
          content: replyText.trim(),
          parentId: commentId,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          userAvatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`
        });

        console.log('Reply created successfully in Firebase:', newReply);
        // Play success sound
        const audio = new Audio('/sounds/message-sent.mp3');
        audio.volume = 0.3; // Lower volume
        audio.play().catch(e => console.error('Error playing sound:', e));

        onReplyAdded(newReply);
      } catch (firebaseError) {
        console.error('Error adding reply to Firebase:', firebaseError);

        // Fallback to Supabase
        try {
          const { data, error } = await supabase
            .from('post_comments')
            .insert([
              {
                post_id: postId,
                user_id: user.id,
                content: replyText.trim(),
                parent_id: commentId
              }
            ])
            .select()
            .single();

          if (error) throw error;

          console.log('Reply created successfully in Supabase:', data);

          // Get user info
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();

          // Format reply with user info
          const formattedReply = {
            ...data,
            user: userData || {
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`
            }
          };

          // Play success sound
          const audio = new Audio('/sounds/message-sent.mp3');
          audio.volume = 0.3; // Lower volume
          audio.play().catch(e => console.error('Error playing sound:', e));

          onReplyAdded(formattedReply);
        } catch (supabaseError) {
          console.error('Error adding reply to Supabase:', supabaseError);

          // Try one more time without parent_id
          try {
            const { data, error } = await supabase
              .from('post_comments')
              .insert([
                {
                  post_id: postId,
                  user_id: user.id,
                  content: `@Reply to comment: ${replyText.trim()}`
                }
              ])
              .select()
              .single();

            if (error) throw error;

            console.log('Reply created successfully in Supabase (without parent_id):', data);

            // Get user info
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', user.id)
              .single();

            // Format reply with user info
            const formattedReply = {
              ...data,
              user: userData || {
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`
              }
            };

            // Play success sound
            const audio = new Audio('/sounds/message-sent.mp3');
            audio.volume = 0.3; // Lower volume
            audio.play().catch(e => console.error('Error playing sound:', e));

            onReplyAdded(formattedReply);
          } catch (finalError) {
            console.error('Error adding reply to Supabase (without parent_id):', finalError);
            throw finalError;
          }
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmitting(false);
      setReplyText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-8">
      <div className="flex items-center">
        <img
          src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'}
          alt="Profile"
          className="w-6 h-6 rounded-full mr-2"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('social.writeReply')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !replyText.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <button
          type="button"
          className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
};

export default CommentReplyForm;
