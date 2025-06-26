# Medical Students Hub - Peer Forum

This document provides instructions for setting up and using the Peer Forum feature in the Medical Students Hub application.

## Overview

The Peer Forum is a comprehensive communication platform for medical students, featuring:

- Multiple topic-based servers (Anatomy, Pathology, etc.)
- Text and voice channels
- Rich media sharing (images, files, audio)
- Interactive polls
- Message reactions
- Real-time updates

## Backend Setup

The Peer Forum uses Supabase for its backend. Follow these steps to set up the backend:

### 1. Start Supabase Local Development

```bash
# Start Supabase containers
supabase start

# Verify containers are running
supabase status
```

### 2. Run Migration Scripts

The migration scripts are located in the `supabase/migrations` directory:

```bash
# Apply the database schema
supabase db reset
```

This will run the following migration files:
- `20231101000000_peer_forum.sql` - Creates the database schema
- `20231101000001_peer_forum_seed.sql` - Seeds initial data

### 3. Storage Setup

The migration scripts automatically create the necessary storage buckets:
- `peer_forum_files` - For storing uploaded files, images, and audio messages

### 4. Verify Setup

You can verify the setup by checking the Supabase Studio:

```bash
supabase studio
```

Navigate to:
- **Table Editor** to see the created tables
- **Storage** to see the created buckets
- **Authentication** to manage users

## Frontend Components

The Peer Forum consists of several key components:

1. **PeerForumPage** - Main container component
2. **ServerList** - Left sidebar showing available servers
3. **ChannelList** - Shows channels within the selected server
4. **ChatArea** - Main chat interface with message display and input
5. **MemberList** - Right sidebar showing online members

## Features

### Server Navigation

Servers are topic-based communities. The default server is "Medical Students Hub", but users can also join specialized servers like "Anatomy", "Pathology", etc.

### Channel Types

- **Text Channels** - For text-based communication
- **Voice Channels** - For voice communication (UI only in current version)

### Message Types

The forum supports various message types:
- Text messages
- Image attachments
- File attachments
- Audio messages
- Polls

### Audio Messages

Users can record and send audio messages:
1. Click the paperclip icon
2. Select "Record Audio"
3. Record your message
4. Preview and send

### Polls

Create interactive polls:
1. Click the paperclip icon
2. Select "Create Poll"
3. Enter your question
4. Add options
5. Send the poll

### Real-time Updates

The forum uses Supabase's real-time features to provide instant updates:
- New messages appear immediately
- Reactions update in real-time
- Poll results update as votes come in

## Database Schema

The Peer Forum uses the following database tables:

- `peer_forum.servers` - Forum servers
- `peer_forum.channels` - Channels within servers
- `peer_forum.messages` - User messages
- `peer_forum.attachments` - Files, images, audio, and polls
- `peer_forum.reactions` - Message reactions
- `peer_forum.polls` - Poll questions
- `peer_forum.poll_options` - Poll options
- `peer_forum.poll_votes` - User votes on polls
- `peer_forum.server_members` - Server membership
- `peer_forum.channel_members` - Channel membership for private channels

## API Service

The `peerForumService.ts` file provides functions for interacting with the backend:

- `getServers()` - Fetch available servers
- `getChannels(serverId)` - Fetch channels for a server
- `getMessages(channelId)` - Fetch messages for a channel
- `createMessage(message)` - Create a new message
- `uploadFile(file, userId)` - Upload a file to storage
- `subscribeToMessages(channelId, callback)` - Subscribe to real-time updates

## Customization

### Adding New Servers

To add a new server, insert a record into the `peer_forum.servers` table:

```sql
INSERT INTO peer_forum.servers (name, description, icon)
VALUES ('New Server', 'Server description', '🔍');
```

### Adding New Channels

To add a new channel, insert a record into the `peer_forum.channels` table:

```sql
INSERT INTO peer_forum.channels (server_id, name, description, type, category)
VALUES ('server-id', 'channel-name', 'Channel description', 'text', 'CATEGORY NAME');
```

## Troubleshooting

### Common Issues

1. **Messages not loading**
   - Check if the channel ID is correct
   - Verify that the user has access to the channel

2. **File uploads failing**
   - Check storage bucket permissions
   - Verify file size limits

3. **Real-time updates not working**
   - Check if the publication is enabled for the tables
   - Verify WebSocket connection

### Logs

Check the Supabase logs for more detailed error information:

```bash
supabase logs
```

## Future Enhancements

Planned features for future versions:

1. Functional voice channels with WebRTC
2. Direct messaging between users
3. Thread replies to messages
4. Advanced moderation tools
5. User roles and permissions
6. Message search functionality
7. Emoji picker for reactions
8. Read receipts
9. Typing indicators
10. Message editing and deletion
