import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';

interface UpdatePersonaRequest {
  oldData: {
    nom: string;
    dia: number;
    mes: number;
    rowNumber?: number;
  };
  newData: {
    nom: string;
    dia: number;
    mes: number;
    anyNaixement?: number;
    telefon?: string;
    email?: string;
    genere?: string;
    viu?: string;
    pareId?: number;
    mareId?: number;
    parellaId?: number;
    urlFoto?: string;
    estatRelacio?: string;
    llocNaixement?: string;
    anyMort?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'PUT') {
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

    const body: UpdatePersonaRequest = await req.json();
    const { oldData, newData } = body;

    if (!oldData || !newData) {
      return new Response(
        JSON.stringify({ error: 'Missing oldData or newData' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find the persona to update
    let query = supabase.from('personas').select('id');

    // If we have rowNumber (which is the ID), use it directly
    if (oldData.rowNumber) {
      query = query.eq('id', oldData.rowNumber);
    } else {
      // Otherwise find by name, day, month
      query = query
        .eq('nom', oldData.nom)
        .eq('dia', oldData.dia)
        .eq('mes', oldData.mes);
    }

    const { data: existingPersona, error: findError } = await query.single();

    if (findError || !existingPersona) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Persona no trobada'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Convert viu string to boolean
    const viuBool = !newData.viu || newData.viu === 'Sí' || newData.viu === 'Si' || newData.viu === 'true';

    // Update the persona
    const { data: updatedPersona, error: updateError } = await supabase
      .from('personas')
      .update({
        nom: newData.nom,
        dia: newData.dia,
        mes: newData.mes,
        any_naixement: newData.anyNaixement || null,
        telefon: newData.telefon || null,
        email: newData.email || null,
        genere: newData.genere || null,
        viu: viuBool,
        pare_id: newData.pareId || null,
        mare_id: newData.mareId || null,
        parella_id: newData.parellaId || null,
        url_foto: newData.urlFoto || null,
        estat_relacio: newData.estatRelacio || null,
        lloc_naixement: newData.llocNaixement || null,
        any_mort: newData.anyMort || null
      })
      .eq('id', existingPersona.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Aniversari actualitzat correctament',
        data: updatedPersona
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
