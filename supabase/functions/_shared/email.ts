// Email utilities using Gmail REST API (OAuth2)

const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID') || '';
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET') || '';
const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN') || '';
const GMAIL_USER = Deno.env.get('GMAIL_USER') || '';

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function getAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth2 token error: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

function buildMimeMessage(to: string, subject: string, htmlBody: string): string {
  const boundary = `boundary_${Date.now()}`;
  const lines = [
    `From: ${GMAIL_USER}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
    `--${boundary}--`,
  ];
  return lines.join('\r\n');
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<EmailResult> {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
    return { success: false, error: 'Gmail OAuth2 credentials not configured' };
  }

  try {
    const accessToken = await getAccessToken();
    const mimeMessage = buildMimeMessage(to, subject, htmlBody);
    const encodedMessage = base64UrlEncode(mimeMessage);

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Error sending email via Gmail API' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Catalan month names
const MESOS = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
];

export function getMesName(mesNum: number): string {
  return MESOS[mesNum - 1] || '';
}

// Generate birthday email HTML
export function generateBirthdayEmailHTML(
  nom: string,
  dia: number,
  mes: number,
  genere: string | null
): string {
  const saludo = genere === 'H' ? 'Benvolgut' :
                 genere === 'D' ? 'Benvolguda' :
                 'Benvolgut/da';

  const mesName = getMesName(mes);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 600;">&#127881; Feliç Aniversari! &#127881;</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px; text-align: center;">
                ${saludo} ${nom},
              </h2>
              <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6; text-align: center;">
                &#127874; Avui, <strong>${dia} ${mesName}</strong>, és el teu gran dia! &#127874;
              </p>
              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6; text-align: center;">
                Des de la <strong>família</strong> et volem desitjar un aniversari meravellós,
                ple de moments especials, alegria i felicitat al costat de les persones que més estimes.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">&#127880; &#127873; &#127882; &#127881;</div>
              </div>
              <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6; text-align: center;">
                Que tinguis un dia inolvidable!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #888; font-size: 14px;">
                &#128156; Amb afecte, la família
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                <a href="https://family-aniversaris.netlify.app/" style="color: #667eea;">family-aniversaris.netlify.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Generate reminder email HTML
interface BirthdayPerson {
  nom: string;
  dia: number;
  mes: number;
  any_naixement?: number;
  viu?: boolean;
  edat?: number;
}

export function generateReminderEmailHTML(tomorrowBirthdays: BirthdayPerson[]): string {
  if (tomorrowBirthdays.length === 0) return '';

  const currentYear = new Date().getFullYear();

  let birthdayList = '';
  for (const person of tomorrowBirthdays) {
    const emoji = person.viu === false ? '&#128330;' : '&#127874;';
    const edad = person.any_naixement ? ` (${currentYear - person.any_naixement} anys)` : '';
    const status = person.viu === false ? ' <em style="color: #888;">(en memòria)</em>' : '';

    birthdayList += `
      <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea;">
        <div style="font-size: 18px; font-weight: 600; color: #333;">
          ${emoji} ${person.nom}${status}
        </div>
        <div style="font-size: 14px; color: #666; margin-top: 5px;">
          ${person.dia} ${getMesName(person.mes)}${edad}
        </div>
      </div>
    `;
  }

  const verb = tomorrowBirthdays.length === 1 ? 'fa' : 'fan';
  const pronoun = tomorrowBirthdays.length === 1 ? 'li' : 'los';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">&#128197; Recordatori d'Aniversari</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Hola! &#128075;
              </p>
              <p style="margin: 0 0 20px 0; color: #555; font-size: 16px; line-height: 1.6;">
                T'enviem aquest recordatori perquè <strong>demà</strong> ${verb} anys:
              </p>
              ${birthdayList}
              <p style="margin: 20px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">
                No oblidis enviar-${pronoun} una felicitació! &#127881;
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #888; font-size: 14px;">
                &#128156; Recordatori automàtic de la família
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                <a href="https://family-aniversaris.netlify.app/" style="color: #667eea;">family-aniversaris.netlify.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
