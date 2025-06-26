-- Add phone number and country code columns to the appointments table
-- This migration adds the necessary columns for SMS notifications

-- Check if the columns already exist before adding them
DO $$
BEGIN
    -- Check if phone_number column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'phone_number'
    ) THEN
        -- Add phone_number column
        ALTER TABLE appointments
        ADD COLUMN phone_number VARCHAR(20);
    END IF;

    -- Check if country_code column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'country_code'
    ) THEN
        -- Add country_code column
        ALTER TABLE appointments
        ADD COLUMN country_code VARCHAR(10);
    END IF;
END
$$;

-- Add comment to the table
COMMENT ON TABLE appointments IS 'Stores appointment information including contact details for SMS notifications';

-- Add comments to the columns
COMMENT ON COLUMN appointments.phone_number IS 'Patient phone number for SMS notifications';
COMMENT ON COLUMN appointments.country_code IS 'Country code for the phone number (e.g., +234 for Nigeria)';

-- Create an index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_phone_number ON appointments(phone_number);

-- Create a function to send SMS notifications when appointments are updated
CREATE OR REPLACE FUNCTION notify_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a record into the notifications table
    INSERT INTO notifications (user_id, title, message, type, read, created_at)
    VALUES (
        NEW.user_id,
        CASE
            WHEN NEW.status = 'confirmed' THEN 'Appointment Confirmed'
            WHEN NEW.status = 'cancelled' THEN 'Appointment Cancelled'
            WHEN NEW.status = 'pending' AND OLD.status = 'confirmed' THEN 'Appointment Rescheduled'
            ELSE 'Appointment Updated'
        END,
        CASE
            WHEN NEW.status = 'confirmed' THEN 'Your appointment has been confirmed'
            WHEN NEW.status = 'cancelled' THEN 'Your appointment has been cancelled'
            WHEN NEW.status = 'pending' AND OLD.status = 'confirmed' THEN 'Your appointment has been rescheduled'
            ELSE 'Your appointment has been updated'
        END,
        'appointment',
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'appointment_update_trigger'
    ) THEN
        CREATE TRIGGER appointment_update_trigger
        AFTER UPDATE ON appointments
        FOR EACH ROW
        EXECUTE FUNCTION notify_appointment_update();
    END IF;
END
$$;
