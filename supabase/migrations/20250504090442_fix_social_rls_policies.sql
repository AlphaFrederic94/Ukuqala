-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.social_posts;

DROP POLICY IF EXISTS "Users can view all comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;

DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;

-- Create new policies with simpler conditions
-- Social posts policies
CREATE POLICY "Anyone can view posts"
    ON public.social_posts FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON public.social_posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own posts"
    ON public.social_posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.social_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Anyone can view comments"
    ON public.post_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON public.post_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
    ON public.post_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.post_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Anyone can view likes"
    ON public.post_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create likes"
    ON public.post_likes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can delete their own likes"
    ON public.post_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
