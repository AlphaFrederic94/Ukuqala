-- SQL script to import medical questions from QuestionAnswersMedicine.csv
-- Run this in the Supabase SQL Editor

-- First, create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_medical_questions (
    qtype TEXT,
    question TEXT,
    answer TEXT
);

-- Create a function to determine the subject based on the question content
CREATE OR REPLACE FUNCTION determine_subject(question_text TEXT, qtype TEXT)
RETURNS TEXT AS $$
DECLARE
    lower_question TEXT := LOWER(question_text);
BEGIN
    IF lower_question LIKE '%heart%' OR lower_question LIKE '%cardiac%' OR lower_question LIKE '%cardiovascular%' THEN
        RETURN 'Cardiology';
    ELSIF lower_question LIKE '%brain%' OR lower_question LIKE '%nerve%' OR lower_question LIKE '%neural%' OR lower_question LIKE '%neuro%' THEN
        RETURN 'Neurology';
    ELSIF lower_question LIKE '%lung%' OR lower_question LIKE '%respiratory%' OR lower_question LIKE '%breathing%' THEN
        RETURN 'Pulmonology';
    ELSIF lower_question LIKE '%kidney%' OR lower_question LIKE '%renal%' OR lower_question LIKE '%urinary%' THEN
        RETURN 'Nephrology';
    ELSIF lower_question LIKE '%liver%' OR lower_question LIKE '%stomach%' OR lower_question LIKE '%intestine%' OR lower_question LIKE '%digest%' THEN
        RETURN 'Gastroenterology';
    ELSIF lower_question LIKE '%bone%' OR lower_question LIKE '%joint%' OR lower_question LIKE '%muscle%' THEN
        RETURN 'Orthopedics';
    ELSIF lower_question LIKE '%blood%' OR lower_question LIKE '%leukemia%' OR lower_question LIKE '%anemia%' THEN
        RETURN 'Hematology';
    ELSIF lower_question LIKE '%immune%' OR lower_question LIKE '%antibody%' OR lower_question LIKE '%antigen%' THEN
        RETURN 'Immunology';
    ELSIF lower_question LIKE '%hormone%' OR lower_question LIKE '%thyroid%' OR lower_question LIKE '%diabetes%' THEN
        RETURN 'Endocrinology';
    ELSIF lower_question LIKE '%skin%' OR lower_question LIKE '%derma%' THEN
        RETURN 'Dermatology';
    ELSIF lower_question LIKE '%cancer%' OR lower_question LIKE '%tumor%' OR lower_question LIKE '%oncology%' THEN
        RETURN 'Oncology';
    ELSIF lower_question LIKE '%drug%' OR lower_question LIKE '%medication%' OR lower_question LIKE '%dose%' THEN
        RETURN 'Pharmacology';
    ELSIF lower_question LIKE '%bacteria%' OR lower_question LIKE '%virus%' OR lower_question LIKE '%infection%' THEN
        RETURN 'Microbiology';
    ELSIF lower_question LIKE '%pregnancy%' OR lower_question LIKE '%birth%' OR lower_question LIKE '%fetus%' THEN
        RETURN 'Obstetrics';
    ELSIF lower_question LIKE '%child%' OR lower_question LIKE '%pediatric%' THEN
        RETURN 'Pediatrics';
    ELSIF qtype = 'symptoms' OR qtype = 'diagnosis' THEN
        RETURN 'Pathology';
    ELSIF qtype = 'treatment' THEN
        RETURN 'Therapeutics';
    ELSIF qtype = 'susceptibility' THEN
        RETURN 'Epidemiology';
    ELSE
        RETURN 'General Medicine';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to extract tags from the question
CREATE OR REPLACE FUNCTION extract_tags(question_text TEXT, qtype TEXT)
RETURNS TEXT[] AS $$
DECLARE
    tags TEXT[] := ARRAY[qtype];
    lower_question TEXT := LOWER(question_text);
    keywords TEXT[] := ARRAY[
        'heart', 'cardiac', 'cardiovascular',
        'brain', 'nerve', 'neural',
        'lung', 'respiratory', 'breathing',
        'kidney', 'renal', 'urinary',
        'liver', 'stomach', 'intestine', 'digest',
        'bone', 'joint', 'muscle',
        'blood', 'leukemia', 'anemia',
        'immune', 'antibody', 'antigen',
        'hormone', 'thyroid', 'diabetes',
        'skin', 'derma',
        'cancer', 'tumor',
        'drug', 'medication', 'dose',
        'bacteria', 'virus', 'infection',
        'pregnancy', 'birth', 'fetus',
        'child', 'pediatric',
        'symptoms', 'diagnosis', 'treatment'
    ];
    keyword TEXT;
BEGIN
    FOREACH keyword IN ARRAY keywords LOOP
        IF lower_question LIKE '%' || keyword || '%' AND NOT tags @> ARRAY[keyword] THEN
            tags := tags || keyword;
        END IF;
    END LOOP;
    
    RETURN tags;
END;
$$ LANGUAGE plpgsql;

-- Create a function to determine difficulty based on question content and length
CREATE OR REPLACE FUNCTION determine_difficulty(question_text TEXT, answer_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_length INTEGER := LENGTH(question_text) + LENGTH(answer_text);
BEGIN
    IF total_length > 1000 THEN
        RETURN 3; -- Hard
    ELSIF total_length > 500 THEN
        RETURN 2; -- Medium
    ELSE
        RETURN 1; -- Easy
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Now, insert the CSV data into the medical_mcq_questions table
-- Note: You'll need to manually upload the CSV data to the temp_medical_questions table
-- or use the Supabase UI to import the CSV file

-- Insert questions from the temp table into the medical_mcq_questions table
INSERT INTO public.medical_mcq_questions (
    question,
    explanation,
    subject,
    tags,
    difficulty,
    is_public
)
SELECT
    question,
    answer,
    determine_subject(question, qtype),
    extract_tags(question, qtype),
    determine_difficulty(question, answer),
    TRUE
FROM
    temp_medical_questions;

-- Get the IDs of the inserted questions
WITH inserted_questions AS (
    SELECT
        id,
        explanation
    FROM
        public.medical_mcq_questions
    WHERE
        id IN (
            SELECT id FROM public.medical_mcq_questions
            EXCEPT
            SELECT question_id FROM public.medical_mcq_options
        )
)
-- Insert correct options for each question
INSERT INTO public.medical_mcq_options (
    question_id,
    text,
    is_correct
)
SELECT
    id,
    explanation,
    TRUE
FROM
    inserted_questions;

-- Insert incorrect options for each question
WITH inserted_questions AS (
    SELECT
        id,
        explanation
    FROM
        public.medical_mcq_questions
    WHERE
        id IN (
            SELECT id FROM public.medical_mcq_questions
            EXCEPT
            SELECT question_id FROM public.medical_mcq_options
            WHERE NOT is_correct
        )
)
-- Insert 3 incorrect options for each question
INSERT INTO public.medical_mcq_options (
    question_id,
    text,
    is_correct
)
SELECT
    q.id,
    'This is an incorrect option ' || (ROW_NUMBER() OVER (PARTITION BY q.id ORDER BY RANDOM()))::TEXT,
    FALSE
FROM
    inserted_questions q
CROSS JOIN
    generate_series(1, 3) AS s;

-- Clean up
DROP FUNCTION IF EXISTS determine_subject(TEXT, TEXT);
DROP FUNCTION IF EXISTS extract_tags(TEXT, TEXT);
DROP FUNCTION IF EXISTS determine_difficulty(TEXT, TEXT);
DROP TABLE IF EXISTS temp_medical_questions;
