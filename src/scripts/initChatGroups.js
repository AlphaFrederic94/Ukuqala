import { supabase } from '../lib/supabaseClient';

// This script initializes the chat groups in the database
// Run this script once to create the initial chat groups

const initChatGroups = async () => {
  try {
    // Check if chat groups already exist
    const { data: existingGroups, error: checkError } = await supabase
      .from('chat_groups')
      .select('id')
      .limit(1);

    if (checkError) {
      // Silently handle errors
      return;
    }

    // If groups already exist, don't create new ones
    if (existingGroups && existingGroups.length > 0) {
      return;
    }

    // Get the first admin user to be the creator
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (adminError) {
      // Silently handle errors
      return;
    }

    const adminId = adminUser?.id;
    if (!adminId) {
      // Silently handle errors
      return;
    }

    // Create the chat groups
    const groups = [
      {
        name: 'Fitness Enthusiasts',
        description: 'A group for discussing fitness routines, workout tips, and staying motivated.',
        type: 'fitness',
        created_by: adminId
      },
      {
        name: 'Healthy Eating',
        description: 'Share recipes, nutrition tips, and discuss balanced diets for better health.',
        type: 'food',
        created_by: adminId
      },
      {
        name: 'Medical Discussions',
        description: 'A place to discuss medical topics, anatomy, and health conditions with others.',
        type: 'anatomy',
        created_by: adminId
      }
    ];

    const { data, error } = await supabase
      .from('chat_groups')
      .insert(groups)
      .select();

    if (error) {
      // Silently handle errors
      return;
    }

    // Add the admin user as a member of all groups
    const memberships = data.map(group => ({
      group_id: group.id,
      user_id: adminId
    }));

    const { error: memberError } = await supabase
      .from('chat_group_members')
      .insert(memberships);

    if (memberError) {
      // Silently handle errors
      return;
    }

    // Add welcome messages to each group
    const welcomeMessages = data.map(group => ({
      group_id: group.id,
      user_id: adminId,
      content: `Welcome to the ${group.name} channel! Feel free to share and discuss topics related to ${group.type}.`,
      is_sticker: false
    }));

    const { error: messageError } = await supabase
      .from('chat_group_messages')
      .insert(welcomeMessages);

    if (messageError) {
      // Silently handle errors
      return;
    }
  } catch (error) {
    // Silently handle errors
  }
};

export default initChatGroups;
