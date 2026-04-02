import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';
import { sendEmail, generateBirthdayEmailHTML, getMesName } from '../_shared/email.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body for force flag
    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch { /* no body or invalid JSON */ }

    const supabase = createSupabaseClient();

    // Check maintenance mode
    if (await isMaintenanceMode(supabase)) {
      return new Response(
        JSON.stringify({
          success: false,
          maintenance: true,
          error: 'En manteniment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Check if email sending is enabled
    const { data: configData } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'email_actiu')
      .single();

    if (configData && configData.valor === 'false') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email sending is disabled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get today's birthdays
    const { data: todayBirthdays, error: birthdayError } = await supabase
      .rpc('get_today_birthdays');

    if (birthdayError) {
      throw birthdayError;
    }

    if (!todayBirthdays || todayBirthdays.length === 0) {
      // Log no birthdays
      await supabase.from('log_emails').insert({
        email: 'system',
        nom_destinatari: 'System',
        tipus: 'BIRTHDAY',
        estat: 'NO_BIRTHDAYS',
        error_message: 'No birthdays today'
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hi ha aniversaris avui',
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ nom: string; status: string; error?: string }>
    };

    // Send birthday email to each person
    for (const person of todayBirthdays) {
      if (!person.email) {
        results.skipped++;
        results.details.push({ nom: person.nom, status: 'skipped', error: 'No email' });
        continue;
      }

      // Check if email was already sent today (skip check if force=true)
      if (!force) {
        const { data: alreadySent } = await supabase
          .rpc('was_email_sent_today', {
            p_persona_id: person.id,
            p_tipus: 'BIRTHDAY'
          });

        if (alreadySent) {
          results.skipped++;
          results.details.push({ nom: person.nom, status: 'skipped', error: 'Already sent today' });
          continue;
        }
      }

      // Generate and send email
      const subject = `Feliç Aniversari, ${person.nom}! 🎂`;
      const html = generateBirthdayEmailHTML(person.nom, person.dia, person.mes, person.genere);

      const emailResult = await sendEmail(person.email, subject, html);

      // Log the result
      await supabase.from('log_emails').insert({
        persona_id: person.id,
        email: person.email,
        nom_destinatari: person.nom,
        tipus: 'BIRTHDAY',
        estat: emailResult.success ? 'SUCCESS' : 'FAILED',
        error_message: emailResult.error || null
      });

      if (emailResult.success) {
        results.sent++;
        results.details.push({ nom: person.nom, status: 'sent' });
      } else {
        results.failed++;
        results.details.push({ nom: person.nom, status: 'failed', error: emailResult.error });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails enviats: ${results.sent}, omesos: ${results.skipped}, fallats: ${results.failed}`,
        ...results
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
