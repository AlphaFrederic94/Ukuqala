import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { channelService, ChatGroup } from '../../lib/channelService';
import { Dumbbell, Utensils, Heart, Users, ArrowRight, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const JoinedChannelsList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinedChannels, setJoinedChannels] = useState<ChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedChannels = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        console.log('Fetching joined channels for user:', user.id);

        // Get all channels the user has joined
        const { data: memberships, error: membershipError } = await supabase
          .from('chat_group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('Error fetching channel memberships:', membershipError);
          setIsLoading(false);
          return;
        }

        console.log('User memberships:', memberships);

        if (!memberships || memberships.length === 0) {
          console.log('User has not joined any channels');
          setJoinedChannels([]);
          setIsLoading(false);
          return;
        }

        // Get the group IDs the user has joined
        const groupIds = memberships.map(m => m.group_id);
        console.log('Group IDs the user has joined:', groupIds);

        // Fetch details for these channels
        const { data: channelsData, error: channelsError } = await supabase
          .from('chat_groups')
          .select(`
            *,
            members:chat_group_members(count)
          `)
          .in('id', groupIds)
          .order('type', { ascending: true });

        if (channelsError) {
          console.error('Error fetching joined channels:', channelsError);
          setIsLoading(false);
          return;
        }

        console.log('Joined channels data:', channelsData);

        // Process the data to get member count
        const processedData = channelsData.map(group => ({
          ...group,
          member_count: group.members?.length || 0
        }));

        setJoinedChannels(processedData);
      } catch (error) {
        console.error('Error fetching joined channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJoinedChannels();

    // Set up real-time subscription for channel memberships
    const membershipSubscription = supabase
      .channel('user_channel_memberships')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_group_members',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Membership change detected:', payload);
          // Refresh the joined channels when membership changes
          fetchJoinedChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membershipSubscription);
    };
  }, [user]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'fitness':
        return <Dumbbell className="w-5 h-5 text-blue-500" />;
      case 'food':
        return <Utensils className="w-5 h-5 text-green-500" />;
      case 'anatomy':
        return <Heart className="w-5 h-5 text-red-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'fitness':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'food':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'anatomy':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 px-4">
          {t('social.yourChannels')}
        </h2>
        <div className="flex justify-center py-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-16 w-16"></div>
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-16 w-16"></div>
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-16 w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (joinedChannels.length === 0) {
    return null; // Don't show anything if the user hasn't joined any channels
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 px-4">
        {t('social.yourChannels')}
      </h2>
      <div className="flex space-x-6 overflow-x-auto pb-4 px-4">
        {joinedChannels.map((channel) => (
          <motion.div
            key={channel.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/social/channel/${channel.id}`)}
          >
            {/* WhatsApp-style circular channel icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${getChannelColor(channel.type)} shadow-md border-2 border-white dark:border-gray-800`}>
              <div className="w-8 h-8">
                {getChannelIcon(channel.type)}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white text-center">
              {channel.name}
            </h3>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Users className="w-3 h-3 mr-1" />
              <span>{channel.member_count || 0}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Channel cards with more details */}
      <div className="mt-6 px-4 space-y-3">
        {joinedChannels.map((channel) => (
          <motion.div
            key={`card-${channel.id}`}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-lg border p-4 cursor-pointer shadow-sm ${getChannelColor(channel.type)}`}
            onClick={() => navigate(`/social/channel/${channel.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChannelColor(channel.type)} border border-white dark:border-gray-800`}>
                  {getChannelIcon(channel.type)}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {channel.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {channel.member_count || 0} {t('social.members')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {channel.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default JoinedChannelsList;
