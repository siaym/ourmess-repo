import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/types/database.js';

const aiSupabase = createClient<Database>('https://xyz', 'xyz');

async function test() {
  const { data } = await aiSupabase.from('deposits').select('*').single();
  console.log(data?.amount);
}
