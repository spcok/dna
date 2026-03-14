import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client.
// These environment variables should be set in the AI Studio Secrets panel
// and will be injected at runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
