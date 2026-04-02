import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';
import { sendTwilioSMS, formatPhoneSpain, generateBirthdaySMS } from '../_shared/sms.ts';

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
          success: false,
          maintenance: true,
          error: 'En manteniment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Check if SMS sending is enabled
    const { data: configData } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'sms_actiu')
      .single();

    if (configData && configData.valor === 'false') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SMS sending is disabled'
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
      await supabase.from('log_sms').insert({
        telefon: 'system',
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

    // Send birthday SMS to each person
    for (const person of todayBirthdays) {
      const formattedPhone = formatPhoneSpain(person.telefon);

      if (!formattedPhone) {
        results.skipped++;
        results.details.push({ nom: person.nom, status: 'skipped', error: 'Invalid or no phone' });
        continue;
      }

      // Check if SMS was already sent today
      const { data: alreadySent } = await supabase
        .rpc('was_sms_sent_today', {
          p_persona_id: person.id,
          p_tipus: 'BIRTHDAY'
        });

      if (alreadySent) {
        results.skipped++;
        results.details.push({ nom: person.nom, status: 'skipped', error: 'Already sent today' });
        continue;
      }

      // Generate and send SMS
      const message = generateBirthdaySMS(person.nom, person.genere);
      const smsResult = await sendTwilioSMS(formattedPhone, message);

      // Log the result
      await supabase.from('log_sms').insert({
        persona_id: person.id,
        telefon: formattedPhone,
        nom_destinatari: person.nom,
        tipus: 'BIRTHDAY',
        estat: smsResult.success ? 'SUCCESS' : 'FAILED',
        twilio_sid: smsResult.sid || null,
        error_message: smsResult.error || null
      });

      if (smsResult.success) {
        results.sent++;
        results.details.push({ nom: person.nom, status: 'sent' });
      } else {
        results.failed++;
        results.details.push({ nom: person.nom, status: 'failed', error: smsResult.error });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS enviats: ${results.sent}, omesos: ${results.skipped}, fallats: ${results.failed}`,
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
