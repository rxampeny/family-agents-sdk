import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';

interface CreatePersonaRequest {
  data: {
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
  force?: boolean;  // Skip duplicate check
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
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

    const body: CreatePersonaRequest = await req.json();
    const { data, force = false } = body;

    if (!data || !data.nom || !data.dia || !data.mes) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: nom, dia, mes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check for duplicates unless force is true
    if (!force) {
      const { data: duplicates, error: dupError } = await supabase
        .rpc('find_duplicates_and_similar', {
          p_nom: data.nom,
          p_dia: data.dia,
          p_mes: data.mes,
          p_umbral: 0.75
        });

      if (dupError) {
        console.error('Error checking duplicates:', dupError);
      } else if (duplicates && duplicates.length > 0) {
        const exactDuplicate = duplicates.find((d: { tipo: string }) => d.tipo === 'duplicado_exacto');

        if (exactDuplicate) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Ja existeix un aniversari amb aquest nom',
              tipo: 'duplicadoExacto'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const similarNames = duplicates
          .filter((d: { tipo: string }) => d.tipo === 'similar')
          .map((d: { nombre_existente: string }) => d.nombre_existente);

        if (similarNames.length > 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Hi ha aniversaris similars: ' + similarNames.join(', '),
              tipo: 'nombresSimilares',
              nombresSimilares: similarNames
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      }
    }

    // Convert viu string to boolean
    const viuBool = !data.viu || data.viu === 'Sí' || data.viu === 'Si' || data.viu === 'true';

    // Insert new persona
    const { data: newPersona, error } = await supabase
      .from('personas')
      .insert({
        nom: data.nom,
        dia: data.dia,
        mes: data.mes,
        any_naixement: data.anyNaixement || null,
        telefon: data.telefon || null,
        email: data.email || null,
        genere: data.genere || null,
        viu: viuBool,
        pare_id: data.pareId || null,
        mare_id: data.mareId || null,
        parella_id: data.parellaId || null,
        url_foto: data.urlFoto || null,
        estat_relacio: data.estatRelacio || null,
        lloc_naixement: data.llocNaixement || null,
        any_mort: data.anyMort || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Aniversari afegit correctament',
        data: {
          id: newPersona.id,
          rowNumber: newPersona.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
