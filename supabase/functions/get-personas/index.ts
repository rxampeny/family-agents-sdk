import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    // Check maintenance mode
    if (await isMaintenanceMode(supabase)) {
      return new Response(
        JSON.stringify({
          maintenance: true,
          message: 'En manteniment, disculpa les molèsties. En breu tornem'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503
        }
      );
    }

    // Get all personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select(`
        id,
        nom,
        dia,
        mes,
        any_naixement,
        telefon,
        email,
        genere,
        viu,
        pare_id,
        mare_id,
        parella_id,
        url_foto,
        estat_relacio,
        lloc_naixement,
        any_mort,
        enviar_recordatoris,
        updated_at
      `)
      .order('mes', { ascending: true })
      .order('dia', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform data to match frontend expectations
    const aniversaris = personas.map(p => ({
      nom: p.nom,
      dia: p.dia,
      mes: p.mes,
      anyNaixement: p.any_naixement,
      telefon: p.telefon || '',
      email: p.email || '',
      genere: p.genere || '',
      viu: p.viu ? 'Sí' : 'No',
      lastModified: p.updated_at || '',
      pareId: p.pare_id,
      mareId: p.mare_id,
      parellaId: p.parella_id,
      urlFoto: p.url_foto,
      estatRelacio: p.estat_relacio || '',
      llocNaixement: p.lloc_naixement || '',
      anyMort: p.any_mort,
      enviarRecordatoris: p.enviar_recordatoris !== false,
      rowNumber: p.id  // Use ID as rowNumber for compatibility
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: aniversaris,
        count: aniversaris.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
