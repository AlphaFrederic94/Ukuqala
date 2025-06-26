-- Add is_compressed column to social_posts table
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN DEFAULT false;

-- Create index for better performance when filtering by compression status
CREATE INDEX IF NOT EXISTS idx_social_posts_is_compressed ON public.social_posts(is_compressed);

-- Update existing posts to mark them as not compressed
UPDATE public.social_posts SET is_compressed = false WHERE is_compressed IS NULL;

-- Create function to optimize image storage
CREATE OR REPLACE FUNCTION optimize_social_image_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would be expanded in a real implementation to:
    -- 1. Resize large images to more reasonable dimensions
    -- 2. Compress images to reduce storage requirements
    -- 3. Convert images to more efficient formats if needed
    -- 4. Store metadata about the original image
    
    -- For now, we'll just log that the function was called
    RAISE NOTICE 'Image optimization would happen here for post: %', NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image optimization
DROP TRIGGER IF EXISTS optimize_social_image_trigger ON public.social_posts;
CREATE TRIGGER optimize_social_image_trigger
BEFORE INSERT OR UPDATE ON public.social_posts
FOR EACH ROW
WHEN (NEW.image_url IS NOT NULL)
EXECUTE FUNCTION optimize_social_image_storage();
