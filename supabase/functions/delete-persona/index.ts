import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';

interface DeletePersonaRequest {
  data: {
    nom: string;
    dia: number;
    mes: number;
    rowNumber?: number;
    anyNaixement?: number;
    telefon?: string;
    email?: string;
    genere?: string;
    viu?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const supabase = createSupabaseClient();

    // Check maintenance mode
    if (await isMaintenanceMode(supabase)) {
      return new Response(
        JSON.stringify({
          success: false,
          maintenance: true,
          error: 'En manteniment, disculpa les molèsties. En breu tornem'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    const body: DeletePersonaRequest = await req.json();
    const { data } = body;

    if (!data || !data.nom) {
      return new Response(
        JSON.stringify({ error: 'Missing data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find the persona to delete
    let query = supabase.from('personas').select('*');

    if (data.rowNumber) {
      query = query.eq('id', data.rowNumber);
    } else {
      query = query
        .eq('nom', data.nom)
        .eq('dia', data.dia)
        .eq('mes', data.mes);
    }

    const { data: personaToDelete, error: findError } = await query.single();

    if (findError || !personaToDelete) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Persona no trobada'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Log the deletion in personas_eliminadas
    const { error: logError } = await supabase
      .from('personas_eliminadas')
      .insert({
        persona_id: personaToDelete.id,
        nom: personaToDelete.nom,
        dia: personaToDelete.dia,
        mes: personaToDelete.mes,
        any_naixement: personaToDelete.any_naixement,
        telefon: personaToDelete.telefon,
        email: personaToDelete.email,
        genere: personaToDelete.genere,
        viu: personaToDelete.viu
      });

    if (logError) {
      console.error('Error logging deletion:', logError);
      // Continue with deletion even if logging fails
    }

    // Delete the persona
    const { error: deleteError } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaToDelete.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Aniversari de ${personaToDelete.nom} eliminat correctament`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
