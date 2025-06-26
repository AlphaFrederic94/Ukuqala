-- SQL script to import CSV data into a temporary table
-- Run this in the Supabase SQL Editor

-- First, create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_medical_questions (
    qtype TEXT,
    question TEXT,
    answer TEXT
);

-- Now you need to copy and paste the CSV data here
-- Format: INSERT INTO temp_medical_questions VALUES ('qtype', 'question', 'answer');

-- Example (replace with actual data from your CSV):
INSERT INTO temp_medical_questions VALUES 
('susceptibility', 'Who is at risk for Lymphocytic Choriomeningitis (LCM)?', 'LCMV infections can occur after exposure to fresh urine, droppings, saliva, or nesting materials from infected rodents. Transmission may also occur when these materials are directly introduced into broken skin, the nose, the eyes, or the mouth, or presumably, via the bite of an infected rodent. Person-to-person transmission has not been reported, with the exception of vertical transmission from infected mother to fetus, and rarely, through organ transplantation.');

-- Add more INSERT statements for each row in your CSV
-- You can use a script or spreadsheet to convert your CSV to these INSERT statements

-- After importing the data, you can run the import_medical_questions.sql script
-- to process the data and insert it into the medical_mcq_questions table
