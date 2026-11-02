// ====================================================================
// ⚡ SUPABASE CLIENT CONFIGURATION
// ====================================================================
// Yeh file hamare React app aur Supabase Database ke darmiyan aik bridge hai.
// Isme Supabase ka URL aur Publishable Key shamil hain.

import { createClient } from '@supabase/supabase-js';

// 1. Supabase Project URL (Aapka database internet address)
const supabaseUrl = 'https://bxduonzxhkzqcpuxiiae.supabase.co';

// 2. Supabase Publishable Key (Aapki digital chabi)
const supabaseKey = 'sb_publishable_FCxbIkHmPdvgQzxYBzdOwQ_BbkZAPk4';

// 3. Supabase Client Create Karna (Isko export kar rahe hain taake App.jsx mein use ho sake)
export const supabase = createClient(supabaseUrl, supabaseKey);
