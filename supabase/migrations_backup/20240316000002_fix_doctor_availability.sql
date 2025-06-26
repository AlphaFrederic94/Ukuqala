-- Update existing records to convert comma-separated strings to JSON arrays
UPDATE doctors
SET availability = concat('["', replace(availability::text, ',', '","'), '"]')::jsonb
WHERE availability IS NOT NULL 
AND availability::text NOT LIKE '[%]';

-- Add check constraint to ensure availability is always a valid JSON array
ALTER TABLE doctors
ADD CONSTRAINT valid_availability 
CHECK (jsonb_typeof(availability) = 'array');