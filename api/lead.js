const recipient = (process.env.WHATSAPP_NOTIFY_TO || '8801521577910').replace(/\D/g, '');
const limits = new Map();
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max).replace(/[<>]/g, '') : '';
export async function POST(request) {
  if (Number(request.headers.get('content-length') || 0) > 4000) return json({ error: 'Request too large' }, 413);
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0] || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  for (const [k, t] of limits) if (now - t > 3600000) limits.delete(k);
  if (limits.has(ip) && now - limits.get(ip) < 600000) return json({ error: 'Please wait before sending another enquiry.' }, 429);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  if (data.website) return json({ ok: true });
  if (data.consent !== true) return json({ error: 'Consent is required' }, 400);
  const type = clean(data.type, 30);
  const name = clean(data.name, 80);
  const organization = clean(data.organization, 100);
  const contact = clean(data.contact, 140);
  const details = clean(data.details, 900);
  if (!['recruiter', 'collaboration'].includes(type) || name.length < 2 || contact.length < 5 || details.length < 12) return json({ error: 'Please complete the required fields.' }, 400);
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return json({ error: 'Notifications are not configured yet.' }, 503);
  const message = ['New portfolio enquiry', 'Type: ' + type, 'Name: ' + name, 'Organization: ' + (organization || 'Not provided'), 'Contact: ' + contact, 'Details: ' + details, 'Visitor consented to sharing this enquiry.'].join('\n');
  try {
    const res = await fetch('https://graph.facebook.com/v22.0/' + encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID) + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'text', text: { preview_url: false, body: message } }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) { console.error('WhatsApp notification failed', res.status); return json({ error: 'WhatsApp delivery could not be initiated. Please email Abdul directly.' }, 502); }
    limits.set(ip, now);
    return json({ ok: true, message: 'Enquiry submitted to WhatsApp.' });
  } catch (err) { console.error('WhatsApp notification error', err?.message); return json({ error: 'Unable to submit. Please email Abdul directly.' }, 502); }
}
