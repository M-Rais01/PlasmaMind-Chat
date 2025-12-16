import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjtqaemumbctkswfpttb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdHFhZW11bWJjdGtzd2ZwdHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjAwNTgsImV4cCI6MjA4MTQzNjA1OH0.CynXWnXXZmPkA0l7JXTvpBxXWhMNXCxuqVkt0U0ktEE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// We are now connected to a real backend
export const isDemoMode = false;