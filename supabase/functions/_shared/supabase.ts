import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Create Supabase client with service role for edge functions
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Create Supabase client with anon key for public operations
export function createSupabasePublicClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper to check maintenance mode
export async function isMaintenanceMode(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'manteniment')
    .single();

  if (error || !data) return false;

  const valor = String(data.valor).toLowerCase();
  return valor === 'true' || valor === 'si' || valor === 'sí' || valor === '1';
}
