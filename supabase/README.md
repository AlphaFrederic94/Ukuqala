# Medical Students Hub Database Schema

This directory contains the SQL scripts to set up the database schema for the Medical Students Hub feature in Supabase.

## Structure

The schema is organized into modular components for easier maintenance and implementation:

1. **Base Setup** (`01_base_setup.sql`): Creates the schema, extensions, and core tables
2. **Flashcards** (`02_flashcards.sql`): Tables and functions for flashcards and spaced repetition
3. **MCQ Questions** (`03_mcq_questions.sql`): Tables and functions for multiple-choice questions
4. **Notes** (`04_notes.sql`): Tables and functions for study notes and tags
5. **Checklists** (`05_checklists.sql`): Tables and functions for checklists and trackers
6. **Case Studies** (`06_case_studies.sql`): Tables and functions for clinical case studies
7. **Exam Roadmaps** (`07_exam_roadmaps.sql`): Tables and functions for exam preparation roadmaps
8. **Dashboard Views** (`08_dashboard_views.sql`): Views and functions for aggregated statistics

## Installation

### Option 1: Install All Modules

To install the complete schema, run the `install.sql` script in the Supabase SQL Editor:

1. Open the Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `install.sql` or upload the file
4. Run the script

### Option 2: Install Individual Modules

You can also install modules individually if you only need specific features:

1. Always start with the base setup: `01_base_setup.sql`
2. Install any additional modules you need in numerical order

## Features

### Flashcards
- Create and manage flashcards with spaced repetition
- Track review history and schedule future reviews
- Group flashcards by subject

### MCQ Questions
- Create multiple-choice questions with explanations
- Track attempt history and performance
- Filter questions by subject and difficulty

### Notes
- Create, edit, and organize study notes
- Tag notes for easier searching
- Mark favorite notes for quick access

### Checklists
- Create checklists for different purposes (exam prep, rotations, etc.)
- Track completion of checklist items
- Set due dates for time-sensitive tasks

### Case Studies
- Create and solve clinical case studies
- Track performance on case study questions
- Filter cases by category and difficulty

### Exam Roadmaps
- Create structured study plans for specific exams
- Organize milestones by section
- Track progress toward exam preparation goals

### Dashboard
- View aggregated statistics across all modules
- Track upcoming due items
- Monitor study activity and progress

## Row Level Security

All tables have Row Level Security (RLS) policies to ensure that users can only access their own data. The policies are set up to:

- Allow users to select, insert, update, and delete their own data
- Prevent access to other users' data
- Allow public access to certain reference data (like subjects)

## Error Handling

The schema includes various constraints and triggers to maintain data integrity:

- Foreign key constraints to ensure referential integrity
- Check constraints to validate data (e.g., difficulty levels)
- Triggers to automatically update timestamps and related records

## Extending the Schema

To extend the schema with new features:

1. Create a new module file following the existing pattern
2. Add tables, functions, triggers, and policies as needed
3. Add the new module to `install.sql`

## Troubleshooting

If you encounter issues during installation:

- Check for error messages in the SQL Editor output
- Verify that the Supabase instance has the required extensions enabled
- Ensure that the scripts are run in the correct order
- Check for any conflicts with existing tables or functions
