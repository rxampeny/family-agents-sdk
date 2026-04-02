// SMS utilities using Twilio API

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

// Format Spanish phone number to E.164 format (+34XXXXXXXXX)
export function formatPhoneSpain(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Convert to string and clean spaces, hyphens, parentheses, dots
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '');

  // If starts with 0034, replace with +34
  if (cleaned.startsWith('0034')) {
    cleaned = '+34' + cleaned.substring(4);
  }

  // If no country code, add +34
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('34')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+34' + cleaned;
    }
  }

  // Validate length (Spain: +34 + 9 digits = 12 characters)
  // Accept mobile (6XX, 7XX) and landline (9XX, 8XX)
  if (cleaned.length !== 12 || !cleaned.match(/^\+34[6-9]\d{8}$/)) {
    return null; // Invalid number
  }

  return cleaned;
}

// Send SMS using Twilio API
export async function sendTwilioSMS(toPhone: string, message: string): Promise<SMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('To', toPhone);
  formData.append('From', TWILIO_PHONE_NUMBER);
  formData.append('Body', message);

  try {
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (response.status === 201) {
      return { success: true, sid: data.sid };
    } else {
      return { success: false, error: data.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate birthday SMS message
export function generateBirthdaySMS(nom: string, genere: string | null): string {
  const saludo = genere === 'H' ? 'Benvolgut' :
                 genere === 'D' ? 'Benvolguda' :
                 'Benvolgut/da';

  return `${saludo} ${nom}, felicitats pel teu aniversari! 🎂🎉 Que tinguis un dia meravellós. Amb afecte, la família. family-aniversaris.netlify.app`;
}

// Generate reminder SMS message
interface BirthdayPerson {
  nom: string;
  any_naixement?: number;
}

export function generateReminderSMS(tomorrowBirthdays: BirthdayPerson[]): string {
  if (tomorrowBirthdays.length === 0) return '';

  const currentYear = new Date().getFullYear();
  const namesWithAge = tomorrowBirthdays.map(p => {
    const age = p.any_naixement ? ` (${currentYear - p.any_naixement})` : '';
    return p.nom + age;
  }).join(' i ');

  const verb = tomorrowBirthdays.length === 1 ? 'fa' : 'fan';
  const pronoun = tomorrowBirthdays.length === 1 ? 'lo' : 'los';

  return `📅 Recordatori: Demà ${verb} anys ${namesWithAge}. No oblidis felicitar-${pronoun}! 🎂 family-aniversaris.netlify.app`;
}
