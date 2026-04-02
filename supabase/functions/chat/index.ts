import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

interface FileData {
  name: string;
  type: string;
  data: string;
}

interface ChatRequest {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
  files?: FileData[];
}

// Get family data from Supabase for context
async function getFamilyContext(supabase: ReturnType<typeof createSupabaseClient>): Promise<string> {
  const { data: personas, error } = await supabase
    .from('personas')
    .select(`
      id, nom, dia, mes, any_naixement, telefon, email, genere, viu,
      pare_id, mare_id, parella_id, lloc_naixement, any_mort, estat_relacio
    `)
    .order('nom');

  if (error || !personas) {
    return 'No s\'ha pogut obtenir les dades familiars.';
  }

  const currentYear = new Date().getFullYear();
  let context = 'DADES FAMILIARS:\n\n';

  for (const p of personas) {
    const edat = p.any_naixement ? currentYear - p.any_naixement : null;
    const viuText = p.viu ? '' : ' (difunt/a)';
    const edatText = edat ? ` - ${edat} anys` : '';

    context += `- ${p.nom}${viuText}: ${p.dia}/${p.mes}`;
    if (p.any_naixement) context += `/${p.any_naixement}`;
    context += edatText;
    if (p.lloc_naixement) context += ` - Nascut/da a ${p.lloc_naixement}`;
    if (p.telefon) context += ` - Tel: ${p.telefon}`;
    if (p.email) context += ` - Email: ${p.email}`;
    if (p.estat_relacio) context += ` - ${p.estat_relacio}`;
    context += '\n';
  }

  context += '\nRELACIONS FAMILIARS:\n';
  for (const p of personas) {
    const relations: string[] = [];

    if (p.pare_id) {
      const pare = personas.find((x: { id: number }) => x.id === p.pare_id);
      if (pare) relations.push(`pare: ${pare.nom}`);
    }
    if (p.mare_id) {
      const mare = personas.find((x: { id: number }) => x.id === p.mare_id);
      if (mare) relations.push(`mare: ${mare.nom}`);
    }
    if (p.parella_id) {
      const parella = personas.find((x: { id: number }) => x.id === p.parella_id);
      if (parella) relations.push(`parella: ${parella.nom}`);
    }

    if (relations.length > 0) {
      context += `- ${p.nom}: ${relations.join(', ')}\n`;
    }
  }

  return context;
}

serve(async (req) => {
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

    if (await isMaintenanceMode(supabase)) {
      return new Response(
        JSON.stringify({
          response: 'El sistema està en manteniment. Disculpa les molèsties.',
          status: 'maintenance'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    const body: ChatRequest = await req.json();
    const { message, files = [] } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get family context from database
    const familyContext = await getFamilyContext(supabase);

    // Build content array for OpenAI
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Process attached files
    let pdfContext = '';
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:${file.type};base64,${file.data}` }
        });
      } else if (file.type === 'application/pdf') {
        pdfContext += `\n\n[S'ha adjuntat el PDF: ${file.name}]`;
      }
    }

    let fullMessage = message;
    if (pdfContext) {
      fullMessage += pdfContext;
    }

    contentParts.unshift({ type: 'text', text: fullMessage });

    const systemPrompt = `Ets un assistent familiar intel·ligent que ajuda amb informació sobre la família.
Tens accés a les següents dades familiars actualitzades:

${familyContext}

INSTRUCCIONS:
- Respon sempre en català
- Sigues breu i concís
- No reveles mai la font de les dades (no diguis "segons les dades" o similar)
- Si et pregunten per aniversaris, pots consultar les dates de naixement
- Si et pregunten per relacions familiars, utilitza la informació de pare/mare/parella
- Pots analitzar imatges si te les envien
- Si no tens la informació, digues-ho amablement`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contentParts }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || 'No s\'ha pogut generar una resposta.';

    return new Response(
      JSON.stringify({
        response: responseText,
        status: 'success'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        response: 'Error al processar la sol·licitud. Si us plau, torna-ho a provar.',
        status: 'error',
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
