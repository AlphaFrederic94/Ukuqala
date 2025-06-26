// Script to import medical data from CSV into Supabase
import { supabase } from '../lib/supabaseClient';
import { parseCSV, convertToMCQQuestions } from '../lib/csvParser';
import fs from 'fs';
import path from 'path';

// Read the CSV file
const csvFilePath = path.resolve(__dirname, '../../QuestionAnswersMedicine.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Parse the CSV data
const parsedData = parseCSV(csvData);
const mcqQuestions = convertToMCQQuestions(parsedData);

// Function to create flashcards from the CSV data
const createFlashcardsFromCSV = (csvData: any[]) => {
  const flashcards = [];
  
  for (const item of csvData) {
    // Create a flashcard with the question on the front and answer on the back
    flashcards.push({
      subject_id: null, // Will be set later
      front: item.Question,
      back: item.Answer,
      difficulty_rating: Math.floor(Math.random() * 5) + 1, // Random difficulty between 1-5
      user_id: null // Will be set when a user creates a flashcard
    });
  }
  
  return flashcards;
};

// Function to import subjects
const importSubjects = async () => {
  console.log('Importing subjects...');
  
  const subjects = [
    { name: 'Anatomy', description: 'Study of the structure of organisms and their parts' },
    { name: 'Physiology', description: 'Study of the normal function of living systems' },
    { name: 'Pathology', description: 'Study of the causes and effects of disease or injury' },
    { name: 'Pharmacology', description: 'Study of drug action' },
    { name: 'Biochemistry', description: 'Study of chemical processes within and relating to living organisms' },
    { name: 'Microbiology', description: 'Study of microorganisms' },
    { name: 'Immunology', description: 'Study of the immune system' },
    { name: 'Neurology', description: 'Study of the nervous system' },
    { name: 'Cardiology', description: 'Study of the heart and cardiovascular system' },
    { name: 'Pulmonology', description: 'Study of the respiratory system' }
  ];
  
  // Insert subjects
  const { data, error } = await supabase
    .from('subjects')
    .upsert(subjects, { onConflict: 'name' })
    .select();
    
  if (error) {
    console.error('Error importing subjects:', error);
    return null;
  }
  
  console.log(`Imported ${data.length} subjects`);
  return data;
};

// Function to import MCQ questions
const importMCQQuestions = async (subjects: any[]) => {
  console.log('Importing MCQ questions...');
  
  // Create a map of subject names to IDs
  const subjectMap = new Map();
  subjects.forEach(subject => {
    subjectMap.set(subject.name.toLowerCase(), subject.id);
  });
  
  // Prepare MCQ questions for import
  const questionsToImport = [];
  const optionsToImport = [];
  
  for (const question of mcqQuestions) {
    // Find the subject ID
    const subjectName = question.subject.toLowerCase();
    const subjectId = subjectMap.get(subjectName) || subjects[0].id; // Default to first subject if not found
    
    // Prepare the question
    const questionToImport = {
      subject_id: subjectId,
      question_text: question.question,
      explanation: question.explanation,
      difficulty: question.difficulty,
      created_by: null // Will be set when a user creates a question
    };
    
    // Insert the question
    const { data: insertedQuestion, error } = await supabase
      .from('mcq_questions')
      .insert(questionToImport)
      .select()
      .single();
      
    if (error) {
      console.error('Error importing question:', error);
      continue;
    }
    
    // Prepare the options
    for (const option of question.options) {
      optionsToImport.push({
        question_id: insertedQuestion.id,
        option_text: option.text,
        is_correct: option.isCorrect
      });
    }
  }
  
  // Insert options in batches
  const batchSize = 100;
  for (let i = 0; i < optionsToImport.length; i += batchSize) {
    const batch = optionsToImport.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('mcq_options')
      .insert(batch);
      
    if (error) {
      console.error('Error importing options batch:', error);
    }
  }
  
  console.log(`Imported ${mcqQuestions.length} MCQ questions with options`);
};

// Function to import flashcards
const importFlashcards = async (subjects: any[]) => {
  console.log('Importing flashcards...');
  
  // Create flashcards from CSV data
  const flashcards = createFlashcardsFromCSV(parsedData);
  
  // Create a map of subject names to IDs
  const subjectMap = new Map();
  subjects.forEach(subject => {
    subjectMap.set(subject.name.toLowerCase(), subject.id);
  });
  
  // Assign subject IDs to flashcards
  for (const flashcard of flashcards) {
    // Extract a subject from the question or answer
    const text = flashcard.front + ' ' + flashcard.back;
    let assignedSubject = null;
    
    // Try to find a subject mentioned in the text
    for (const subject of subjects) {
      if (text.toLowerCase().includes(subject.name.toLowerCase())) {
        assignedSubject = subject.id;
        break;
      }
    }
    
    // If no subject found, assign a random one
    if (!assignedSubject) {
      const randomIndex = Math.floor(Math.random() * subjects.length);
      assignedSubject = subjects[randomIndex].id;
    }
    
    flashcard.subject_id = assignedSubject;
  }
  
  // Insert flashcards in batches
  const batchSize = 100;
  for (let i = 0; i < flashcards.length; i += batchSize) {
    const batch = flashcards.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('flashcards')
      .insert(batch);
      
    if (error) {
      console.error('Error importing flashcards batch:', error);
    }
  }
  
  console.log(`Imported ${flashcards.length} flashcards`);
};

// Main function to run the import
const runImport = async () => {
  try {
    console.log('Starting import...');
    
    // Import subjects first
    const subjects = await importSubjects();
    if (!subjects) {
      console.error('Failed to import subjects. Aborting.');
      return;
    }
    
    // Import MCQ questions
    await importMCQQuestions(subjects);
    
    // Import flashcards
    await importFlashcards(subjects);
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  }
};

// Run the import
runImport();
