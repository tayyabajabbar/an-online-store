// ====================================================================
// ⚡ SUPABASE CLIENT CONFIGURATION
// ====================================================================
// Yeh file hamare React app aur Supabase Database ke darmiyan aik bridge hai.
// Isme Supabase ka URL aur Publishable Key shamil hain.

import { createClient } from '@supabase/supabase-js';

// 1. Supabase Project URL (.env file se mangwaya ja raha hai)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// 2. Supabase Publishable Key (.env file se mangwayi ja rahi hai)
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 3. Supabase Client Create Karna (Isko export kar rahe hain taake App.jsx mein use ho sake)
export const supabase = createClient(supabaseUrl, supabaseKey);
