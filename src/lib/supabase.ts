import { createClient } from '@supabase/supabase-js';
// @ts-ignore: Vercel node16 complains about missing .js
import type { Database } from '../types/database';

// Default to dummy values if env vars are missing to allow UI development without Supabase connected
// @ts-ignore: Vercel node complains about ImportMeta
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
// @ts-ignore: Vercel node complains about ImportMeta
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
