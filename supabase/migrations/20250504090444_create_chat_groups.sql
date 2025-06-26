-- Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fitness', 'food', 'anatomy')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create chat_group_messages table
CREATE TABLE IF NOT EXISTS public.chat_group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_sticker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add is_anonymous field to social_posts table
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Add hashtags field to social_posts table to store an array of hashtags
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- Create social_ads table
CREATE TABLE IF NOT EXISTS public.social_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_groups_type ON public.chat_groups(type);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON public.chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON public.chat_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_messages_group_id ON public.chat_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags ON public.social_posts USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_social_ads_is_active ON public.social_ads(is_active);

-- Enable Row Level Security
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_ads ENABLE ROW LEVEL SECURITY;

-- Chat groups policies
CREATE POLICY "Anyone can view chat groups"
    ON public.chat_groups FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create chat groups"
    ON public.chat_groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
    ON public.chat_groups FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Chat group members policies
CREATE POLICY "Anyone can view group members"
    ON public.chat_group_members FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can join groups"
    ON public.chat_group_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave groups"
    ON public.chat_group_members FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Chat group messages policies
CREATE POLICY "Group members can view messages"
    ON public.chat_group_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_group_members
            WHERE group_id = chat_group_messages.group_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Group members can send messages"
    ON public.chat_group_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.chat_group_members
            WHERE group_id = chat_group_messages.group_id
            AND user_id = auth.uid()
        )
    );

-- Social ads policies
CREATE POLICY "Anyone can view ads"
    ON public.social_ads FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create ads"
    ON public.social_ads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ad creators can update their ads"
    ON public.social_ads FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Ad creators can delete their ads"
    ON public.social_ads FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_group_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_ads TO authenticated;

-- Create default channels if they don't exist
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Get the first user ID from the auth.users table to use as admin
    SELECT id INTO admin_id FROM auth.users LIMIT 1;

    -- Only proceed if we found a user
    IF admin_id IS NOT NULL THEN
        -- Insert Fitness channel if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.chat_groups WHERE type = 'fitness') THEN
            INSERT INTO public.chat_groups (name, description, type, created_by)
            VALUES (
                'Fitness Channel',
                'Discuss fitness tips, workout routines, and health goals',
                'fitness',
                admin_id
            );
        END IF;

        -- Insert Food channel if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.chat_groups WHERE type = 'food') THEN
            INSERT INTO public.chat_groups (name, description, type, created_by)
            VALUES (
                'Food & Nutrition',
                'Share recipes, nutrition advice, and healthy eating habits',
                'food',
                admin_id
            );
        END IF;

        -- Insert Anatomy channel if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.chat_groups WHERE type = 'anatomy') THEN
            INSERT INTO public.chat_groups (name, description, type, created_by)
            VALUES (
                'Anatomy & Health',
                'Learn about human anatomy, medical conditions, and health education',
                'anatomy',
                admin_id
            );
        END IF;
    END IF;
END
$$;
