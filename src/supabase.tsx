// This imports the stuff for and sets up a supabase client
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ftbqshbdzqbzyxatmylj.supabase.co';
const supabaseKey = 'sb_publishable_kNck0q2-iE5Yskc1re2f5Q_WqW3HC__';
export const supabaseClient = createClient(supabaseUrl, supabaseKey);
