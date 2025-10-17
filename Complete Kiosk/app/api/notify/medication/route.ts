import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    try { console.log('[notify/medication] received', JSON.stringify(body)); } catch(e) { console.log('[notify/medication] received'); }

  const FALLBACK_ZAPIER = 'https://hooks.zapier.com/hooks/catch/25014724/urbdx6x/';
    const zapierWebhook = process.env.ZAPIER_WEBHOOK || FALLBACK_ZAPIER;
    const masked = zapierWebhook.length > 12 ? `***${zapierWebhook.slice(-8)}` : zapierWebhook;
    console.log('[notify/medication] using zapier webhook:', masked);

    if (!body) return NextResponse.json({ ok: false, error: 'missing body' }, { status: 400 });

    // Basic validation: ensure we have at least a medicine name and phone
    const { medicine, time, quantity, notes, appUserId, name, phone } = body as any;
    if (!medicine || !phone) {
      return NextResponse.json({ ok: false, error: 'medicine and phone required' }, { status: 400 });
    }

    // Zapier settings in your message mentioned JSON key = `json` and send as JSON.
    // Wrap the payload under `json` to match that mapping.
  // Ensure a type field exists for Zapier to select correct message template
  const toSend = { ...body, type: body.type || 'medication_reminder' };
  const payloadToZapier = { json: toSend };

    const doPost = async () => {
      const res = await fetch(zapierWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToZapier),
      });
      const text = await res.text().catch(() => '');
      return { res, text };
    };

    let forwarded = await doPost();
    if (!forwarded.res.ok) {
      try { forwarded = await doPost(); } catch (e) { /* ignore */ }
    }

    if (!forwarded || !forwarded.res.ok) {
      console.error('[notify/medication] forwarding failed', forwarded?.res?.status, forwarded?.text);
      return NextResponse.json({ ok: false, error: 'failed to forward', zapierStatus: forwarded?.res?.status || null, zapierBody: forwarded?.text || null }, { status: 502 });
    }

    console.log('[notify/medication] forwarded, status=', forwarded.res.status, 'body=', forwarded.text);
    return NextResponse.json({ ok: true, zapierStatus: forwarded.res.status, zapierBody: forwarded.text });
  } catch (err: any) {
    console.error('[notify/medication] error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
