// Script to set up student verification storage bucket
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStudentVerification() {
  console.log('Setting up student verification...');
  
  try {
    // Step 1: Create student_verification schema if it doesn't exist
    console.log('Creating student_verification schema...');
    const { error: schemaError } = await supabase.rpc('create_schema_if_not_exists', {
      schema_name: 'student_verification'
    });
    
    if (schemaError) {
      console.error('Error creating schema:', schemaError);
      // Try direct SQL approach
      const { error: sqlSchemaError } = await supabase.sql`
        CREATE SCHEMA IF NOT EXISTS student_verification;
      `;
      
      if (sqlSchemaError) {
        console.error('Error creating schema with SQL:', sqlSchemaError);
      } else {
        console.log('Schema created with SQL approach');
      }
    } else {
      console.log('Schema created successfully');
    }
    
    // Step 2: Create verifications table
    console.log('Creating verifications table...');
    const { error: tableError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS student_verification.verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        school_name TEXT NOT NULL,
        school_country TEXT NOT NULL,
        graduation_date DATE NOT NULL,
        school_email TEXT NOT NULL,
        school_website TEXT NOT NULL,
        document_urls TEXT[] NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
        verification_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        verified_at TIMESTAMPTZ,
        verified_by TEXT
      );
    `;
    
    if (tableError) {
      console.error('Error creating table:', tableError);
    } else {
      console.log('Table created successfully');
    }
    
    // Step 3: Create indexes
    console.log('Creating indexes...');
    const { error: indexError1 } = await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_student_verification_user_id ON student_verification.verifications(user_id);
    `;
    
    if (indexError1) {
      console.error('Error creating user_id index:', indexError1);
    } else {
      console.log('User ID index created successfully');
    }
    
    const { error: indexError2 } = await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_student_verification_status ON student_verification.verifications(verification_status);
    `;
    
    if (indexError2) {
      console.error('Error creating status index:', indexError2);
    } else {
      console.log('Status index created successfully');
    }
    
    // Step 4: Create RLS policies
    console.log('Setting up RLS policies...');
    const { error: rlsError } = await supabase.sql`
      ALTER TABLE student_verification.verifications ENABLE ROW LEVEL SECURITY;
    `;
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('RLS enabled successfully');
    }
    
    // Create policies
    const policies = [
      {
        name: "Users can view their own verification data",
        sql: `
          CREATE POLICY "Users can view their own verification data" 
          ON student_verification.verifications
          FOR SELECT
          USING (auth.uid() = user_id);
        `
      },
      {
        name: "Users can insert their own verification data",
        sql: `
          CREATE POLICY "Users can insert their own verification data" 
          ON student_verification.verifications
          FOR INSERT
          WITH CHECK (
            auth.uid() = user_id AND
            NOT EXISTS (
              SELECT 1 FROM student_verification.verifications
              WHERE user_id = auth.uid() AND verification_status IN ('pending', 'verified')
            )
          );
        `
      },
      {
        name: "Users can update their own rejected verification data",
        sql: `
          CREATE POLICY "Users can update their own rejected verification data" 
          ON student_verification.verifications
          FOR UPDATE
          USING (
            auth.uid() = user_id AND
            verification_status = 'rejected'
          );
        `
      }
    ];
    
    for (const policy of policies) {
      const { error: policyError } = await supabase.sql(policy.sql);
      
      if (policyError) {
        console.error(`Error creating policy "${policy.name}":`, policyError);
      } else {
        console.log(`Policy "${policy.name}" created successfully`);
      }
    }
    
    // Step 5: Create helper functions
    console.log('Creating helper functions...');
    const { error: funcError1 } = await supabase.sql`
      CREATE OR REPLACE FUNCTION student_verification.is_verified_student(p_user_id UUID)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1
          FROM student_verification.verifications
          WHERE user_id = p_user_id AND verification_status = 'verified'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    if (funcError1) {
      console.error('Error creating is_verified_student function:', funcError1);
    } else {
      console.log('is_verified_student function created successfully');
    }
    
    const { error: funcError2 } = await supabase.sql`
      CREATE OR REPLACE FUNCTION student_verification.get_verification_status(p_user_id UUID)
      RETURNS TEXT AS $$
      DECLARE
        v_status TEXT;
      BEGIN
        SELECT verification_status INTO v_status
        FROM student_verification.verifications
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 1;
        
        RETURN COALESCE(v_status, 'none');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    if (funcError2) {
      console.error('Error creating get_verification_status function:', funcError2);
    } else {
      console.log('get_verification_status function created successfully');
    }
    
    // Step 6: Create storage bucket
    console.log('Creating storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      const bucketExists = buckets.some(bucket => bucket.name === 'student_verification_docs');
      
      if (!bucketExists) {
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('student_verification_docs', {
            public: false
          });
          
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
        } else {
          console.log('Storage bucket created successfully');
        }
      } else {
        console.log('Storage bucket already exists');
      }
    }
    
    console.log('Student verification setup completed!');
  } catch (error) {
    console.error('Error setting up student verification:', error);
  }
}

setupStudentVerification();
