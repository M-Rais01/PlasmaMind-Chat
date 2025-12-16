import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables
// This prevents "Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')"
const getEnv = (key: string) => {
  // Check if import.meta.env exists (Vite)
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    return meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://jjtqaemumbctkswfpttb.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdHFhZW11bWJjdGtzd2ZwdHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjAwNTgsImV4cCI6MjA4MTQzNjA1OH0.CynXWnXXZmPkA0l7JXTvpBxXWhMNXCxuqVkt0U0ktEE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// We are now connected to a real backend
export const isDemoMode = false;