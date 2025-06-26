#!/usr/bin/env node

// This script allows running the Supabase CLI using npx
// Usage: node supabase-cli.js <command> [args]

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the path to the Supabase CLI executable
const supabasePath = resolve(
  __dirname,
  'node_modules',
  '.bin',
  'supabase'
);

// Get the command and arguments
const args = process.argv.slice(2);

// Spawn the Supabase CLI process
const supabase = spawn(supabasePath, args, {
  stdio: 'inherit',
  shell: true
});

// Handle process exit
supabase.on('close', (code) => {
  process.exit(code);
});
