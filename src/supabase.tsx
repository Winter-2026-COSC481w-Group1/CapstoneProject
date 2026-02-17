// This imports the stuff for and sets up a supabase client
import { createClient } from '@supabase/supabase-js';

// Access environment variables injected during the Docker build
// these same variables have been added to the vercel deployment to maintain deployment parody
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
