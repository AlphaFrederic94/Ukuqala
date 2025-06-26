-- Clear existing data for this user
DELETE FROM public.weight_measurements WHERE user_id = 'e7006b2c-db76-4355-8927-1ced58ed218a';
DELETE FROM public.activity_logs WHERE user_id = 'e7006b2c-db76-4355-8927-1ced58ed218a';
DELETE FROM public.sleep_logs WHERE user_id = 'e7006b2c-db76-4355-8927-1ced58ed218a';

-- Insert weight measurements for the past 4 weeks (showing a weight loss journey)
INSERT INTO public.weight_measurements (user_id, weight, date, notes) 
SELECT    
    'e7006b2c-db76-4355-8927-1ced58ed218a',
    85.5 - (ROUND((ROW_NUMBER() OVER (ORDER BY date DESC) * 0.2)::numeric, 2)),
    date,
    'Weekly weight measurement'
FROM generate_series(
    NOW() - INTERVAL '28 days',
    NOW(),
    INTERVAL '1 day'
) AS date;

-- Insert activity logs for the past 4 weeks
INSERT INTO public.activity_logs (user_id, activity_type, duration, calories_burned, date)
SELECT 
    'e7006b2c-db76-4355-8927-1ced58ed218a',
    CASE (EXTRACT(DOW FROM date))::INTEGER
        WHEN 1 THEN 'Running'
        WHEN 3 THEN 'Cycling'
        WHEN 5 THEN 'Swimming'
        WHEN 6 THEN 'Weight Training'
        ELSE 'Walking'
    END,
    CASE (EXTRACT(DOW FROM date))::INTEGER
        WHEN 1 THEN 45  -- Running
        WHEN 3 THEN 60  -- Cycling
        WHEN 5 THEN 30  -- Swimming
        WHEN 6 THEN 50  -- Weight Training
        ELSE 30        -- Walking
    END,
    CASE (EXTRACT(DOW FROM date))::INTEGER
        WHEN 1 THEN 450  -- Running
        WHEN 3 THEN 400  -- Cycling
        WHEN 5 THEN 300  -- Swimming
        WHEN 6 THEN 350  -- Weight Training
        ELSE 150        -- Walking
    END,
    date
FROM generate_series(
    NOW() - INTERVAL '28 days',
    NOW(),
    INTERVAL '1 day'
) AS date
WHERE EXTRACT(DOW FROM date) IN (1, 3, 5, 6);  -- Only insert on workout days

-- Insert sleep logs for the past 4 weeks
INSERT INTO public.sleep_logs (user_id, duration, quality, date)
SELECT 
    'e7006b2c-db76-4355-8927-1ced58ed218a',
    CASE 
        WHEN EXTRACT(DOW FROM date) IN (5, 6) THEN 8.5  -- More sleep on weekends
        ELSE 7.5                                        -- Regular sleep on weekdays
    END,
    CASE 
        WHEN EXTRACT(DOW FROM date) IN (5, 6) THEN 5    -- Better sleep quality on weekends
        ELSE FLOOR(3 + random() * 3)::INTEGER           -- Random quality (3-5) on weekdays
    END,
    date
FROM generate_series(
    NOW() - INTERVAL '28 days',
    NOW(),
    INTERVAL '1 day'
) AS date;

-- Insert a sleep program
INSERT INTO public.sleep_programs (
    user_id,
    wake_time,
    sleep_time,
    duration,
    active,
    alarm_enabled
) VALUES (
    'e7006b2c-db76-4355-8927-1ced58ed218a',
    '06:30:00',
    '22:30:00',
    INTERVAL '8 hours',
    true,
    true
);
