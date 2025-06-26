import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { channelService, ChatGroup } from '../../lib/channelService';
import { Dumbbell, Utensils, Heart, Users, ArrowRight, MessageCircle, CheckCircle, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const ChannelList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<ChatGroup[]>([]);
  const [joinedChannelIds, setJoinedChannelIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Ensure channels exist in the database
        await channelService.getChannels();

        // Fetch all channels directly from the database
        const { data: channelsData, error: channelsError } = await supabase
          .from('chat_groups')
          .select(`
            *,
            members:chat_group_members(count)
          `)
          .order('type', { ascending: true });

        if (channelsError) {
          console.error('Error fetching channels:', channelsError);
          return;
        }

        // Process the data to get member count
        const processedData = channelsData.map(group => ({
          ...group,
          member_count: group.members?.length || 0
        }));

        console.log('Fetched channels:', processedData);
        setChannels(processedData);

        // Fetch user's joined channels
        const { data: memberships, error: membershipError } = await supabase
          .from('chat_group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('Error fetching channel memberships:', membershipError);
        } else {
          const joinedIds = memberships.map(m => m.group_id);
          console.log('Joined channel IDs:', joinedIds);
          setJoinedChannelIds(joinedIds);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();

    // Set up real-time subscription for channel memberships
    const membershipSubscription = supabase
      .channel('user_channel_memberships_list')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_group_members',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Refresh the joined channels when membership changes
          fetchChannels();
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
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 px-4">
        {t('social.channels')}
      </h2>
      <div className="flex space-x-6 overflow-x-auto pb-4 px-4">
        {channels.map((channel) => {
          const isJoined = joinedChannelIds.includes(channel.id);
          return (
            <motion.div
              key={channel.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => navigate(`/social/channel/${channel.id}`)}
            >
              {/* WhatsApp-style circular channel icon */}
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${getChannelColor(channel.type)} shadow-md border-2 ${isJoined ? 'border-blue-400 dark:border-blue-600' : 'border-white dark:border-gray-800'}`}>
                  <div className="w-8 h-8">
                    {getChannelIcon(channel.type)}
                  </div>
                </div>
                {isJoined && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-white dark:border-gray-800">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {channel.name}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Users className="w-3 h-3 mr-1" />
                <span>{channel.member_count || 0}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Channel cards with more details */}
      <div className="mt-6 px-4 space-y-3">
        {channels.map((channel) => {
          const isJoined = joinedChannelIds.includes(channel.id);
          return (
            <motion.div
              key={`card-${channel.id}`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-lg border p-4 cursor-pointer shadow-sm ${getChannelColor(channel.type)} ${isJoined ? 'border-blue-400 dark:border-blue-600' : ''}`}
              onClick={() => navigate(`/social/channel/${channel.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChannelColor(channel.type)} border border-white dark:border-gray-800`}>
                    {getChannelIcon(channel.type)}
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {channel.name}
                      </h3>
                      {isJoined && (
                        <CheckCircle className="w-4 h-4 ml-2 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {channel.member_count || 0} {t('social.members')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isJoined ? (
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                  <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                {channel.description}
              </p>
              {isJoined && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {t('social.youAreAMember')}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelList;
