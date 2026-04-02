import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, isMaintenanceMode } from '../_shared/supabase.ts';
import { sendEmail, generateReminderEmailHTML } from '../_shared/email.ts';
import { sendTwilioSMS, formatPhoneSpain, generateReminderSMS } from '../_shared/sms.ts';

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

    // Get tomorrow's birthdays
    const { data: tomorrowBirthdays, error: birthdayError } = await supabase
      .rpc('get_tomorrow_birthdays');

    if (birthdayError) {
      throw birthdayError;
    }

    if (!tomorrowBirthdays || tomorrowBirthdays.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hi ha aniversaris demà',
          emailsSent: 0,
          smsSent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get all active members with email or phone to send reminders
    const { data: activeMembers, error: membersError } = await supabase
      .rpc('get_active_members');

    if (membersError) {
      throw membersError;
    }

    const results = {
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      smsSkipped: 0,
      smsFailed: 0,
      tomorrowBirthdays: tomorrowBirthdays.map((p: { nom: string }) => p.nom)
    };

    // Generate reminder content
    const emailHTML = generateReminderEmailHTML(tomorrowBirthdays);
    const smsMessage = generateReminderSMS(tomorrowBirthdays);

    // Send reminders to each active member
    for (const member of activeMembers || []) {
      // Don't send reminder to the birthday person themselves
      const isBirthdayPerson = tomorrowBirthdays.some(
        (b: { id: number }) => b.id === member.id
      );
      if (isBirthdayPerson) continue;

      // Send email reminder
      if (member.email) {
        // Check if already sent today
        const { data: emailAlreadySent } = await supabase
          .rpc('was_email_sent_today', {
            p_persona_id: member.id,
            p_tipus: 'REMINDER'
          });

        if (!emailAlreadySent) {
          const subject = `📅 Recordatori: Demà hi ha aniversaris!`;
          const emailResult = await sendEmail(member.email, subject, emailHTML);

          await supabase.from('log_emails').insert({
            persona_id: member.id,
            email: member.email,
            nom_destinatari: member.nom,
            tipus: 'REMINDER',
            estat: emailResult.success ? 'SUCCESS' : 'FAILED',
            error_message: emailResult.error || null
          });

          if (emailResult.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
          }
        } else {
          results.emailsSkipped++;
        }
      }

      // Send SMS reminder
      const formattedPhone = formatPhoneSpain(member.telefon);
      if (formattedPhone) {
        // Check if already sent today
        const { data: smsAlreadySent } = await supabase
          .rpc('was_sms_sent_today', {
            p_persona_id: member.id,
            p_tipus: 'REMINDER'
          });

        if (!smsAlreadySent) {
          const smsResult = await sendTwilioSMS(formattedPhone, smsMessage);

          await supabase.from('log_sms').insert({
            persona_id: member.id,
            telefon: formattedPhone,
            nom_destinatari: member.nom,
            tipus: 'REMINDER',
            estat: smsResult.success ? 'SUCCESS' : 'FAILED',
            twilio_sid: smsResult.sid || null,
            error_message: smsResult.error || null
          });

          if (smsResult.success) {
            results.smsSent++;
          } else {
            results.smsFailed++;
          }
        } else {
          results.smsSkipped++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recordatoris enviats. Emails: ${results.emailsSent}, SMS: ${results.smsSent}`,
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
