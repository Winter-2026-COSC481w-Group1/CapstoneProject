import { User } from "@supabase/supabase-js";
// This imports the stuff for and sets up a supabase client
import { createClient } from '@supabase/supabase-js';

// Access environment variables injected during the Docker build
// these same variables have been added to the vercel deployment to maintain deployment parody
const supabaseUrl = 'https://ftbqshbdzqbzyxatmylj.supabase.co';
const supabaseKey = 'sb_publishable_kNck0q2-iE5Yskc1re2f5Q_WqW3HC__';

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Convert from supabase User type to the User type in types.ts
export function convertUser(user: User) {
  return {
    id: user.id,
    name: user.user_metadata.full_name ?? "Guest User",
    email: user.email!,
    avatar: (user.user_metadata.full_name ?? "Guest User").match(/\b(\w)/g).join(''),
  };
}