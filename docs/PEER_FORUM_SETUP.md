# Peer Forum Setup Guide

This guide provides instructions for setting up the peer forum feature in your application.

## Overview

The peer forum feature requires a Supabase database with specific tables and functions. This guide will help you set up the necessary database objects.

## Setup Steps

### 1. Run the SQL Script in Supabase SQL Editor

1. Open the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Open the `peer_forum_setup.sql` file from your project
4. Run the SQL script in the editor

The script will:
- Create the peer_forum schema
- Create all necessary tables (servers, channels, messages, etc.)
- Create required functions
- Set up appropriate permissions

### 2. Create Views for Easier Access

After running the main script, you need to create views in the public schema for easier access. Run the following SQL statements one by one:

```sql
-- Create views in public schema for easier access
DROP VIEW IF EXISTS peer_forum_servers;
CREATE VIEW peer_forum_servers AS SELECT * FROM peer_forum.servers;

DROP VIEW IF EXISTS peer_forum_channels;
CREATE VIEW peer_forum_channels AS SELECT * FROM peer_forum.channels;

DROP VIEW IF EXISTS peer_forum_messages;
CREATE VIEW peer_forum_messages AS SELECT * FROM peer_forum.messages;

DROP VIEW IF EXISTS peer_forum_server_members;
CREATE VIEW peer_forum_server_members AS SELECT * FROM peer_forum.server_members;

DROP VIEW IF EXISTS peer_forum_channel_members;
CREATE VIEW peer_forum_channel_members AS SELECT * FROM peer_forum.channel_members;

DROP VIEW IF EXISTS peer_forum_attachments;
CREATE VIEW peer_forum_attachments AS SELECT * FROM peer_forum.attachments;
```

### 3. Grant Permissions on Views

After creating the views, grant the necessary permissions:

```sql
GRANT SELECT ON peer_forum_servers TO authenticated, anon;
GRANT SELECT ON peer_forum_channels TO authenticated, anon;
GRANT SELECT ON peer_forum_messages TO authenticated, anon;
GRANT SELECT ON peer_forum_server_members TO authenticated, anon;
GRANT SELECT ON peer_forum_channel_members TO authenticated, anon;
GRANT SELECT ON peer_forum_attachments TO authenticated, anon;
```

### 4. Create Default Server and Channels

Run the following SQL statements to create a default server and channels:

```sql
-- Create default server
INSERT INTO peer_forum.servers (id, name, description, icon, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Medical Students Hub', 'Welcome to the Medical Students Hub!', '🏥', true);

-- Create default channels
INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000001', 'welcome', 'Welcome to the channel! Get started with introductions.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000002', 'announcements', 'Important updates and announcements.', 'text', '00000000-0000-0000-0000-000000000001', 'INFORMATION');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000003', 'general', 'General discussion for all medical students.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000004', 'study-tips', 'Share and discover effective study techniques.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000005', 'resources', 'Share helpful books, websites, and materials.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');

INSERT INTO peer_forum.channels (id, name, description, type, server_id, category)
VALUES ('00000000-0000-0000-0000-000000000006', 'case-discussions', 'Discuss interesting medical cases.', 'text', '00000000-0000-0000-0000-000000000001', 'TEXT CHANNELS');
```

## Troubleshooting

### Error: Relation "peer_forum.servers" does not exist

If you see this error, it means the peer_forum schema or tables were not created properly. Make sure you run the entire SQL script in the correct order.

### Error: Permission denied for schema peer_forum

If you see this error, it means the permissions were not set up correctly. Make sure you run the GRANT statements in the SQL script.

### Error: Duplicate key value violates unique constraint

If you see this error when creating the default server or channels, it means they already exist. You can safely ignore this error.

## Verifying the Setup

To verify that the setup was successful, run the following SQL query:

```sql
SELECT * FROM peer_forum_servers;
```

You should see the default server in the results.

## Next Steps

After setting up the database, you can use the peer forum feature in your application. The application code has been updated to use the new schema and tables.

If you encounter any issues, please check the console logs for error messages and refer to this guide for troubleshooting.
