import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.warn('Supabase env vars missing. App can still render mock-ready UI.');
}

export const supabaseBrowser = () => createClient(supabaseUrl ?? '', anonKey ?? '');

export const supabaseServer = () => {
  if (!supabaseUrl || !serviceRole) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};
