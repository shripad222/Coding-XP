import { NextResponse } from 'next/server';

// Server-side forwarding endpoint for alert notifications.
// Expects a JSON body with at least: { appUserId, name, phone, checkupId, vitals, triggers }
// Forwards the payload to the Zapier webhook configured in the ZAPIER_WEBHOOK env var.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Debug logging: show received payload on server console
    try {
      // Avoid logging very large objects in production; this is temporary for debugging
      console.log('[notify] received payload:', JSON.stringify(body));
    } catch (e) {
      console.log('[notify] received payload (unserializable)');
    }

    // Allow a fallback webhook for local testing if env var is not set.
    const FALLBACK_ZAPIER = 'https://hooks.zapier.com/hooks/catch/25014724/u5v7qnc/';
    const zapierWebhook = process.env.ZAPIER_WEBHOOK || FALLBACK_ZAPIER;

    if (!zapierWebhook) {
      return NextResponse.json({ ok: false, error: 'ZAPIER_WEBHOOK not configured' }, { status: 500 });
    }

    // Mask webhook for logs (show only last 8 chars)
    const masked = zapierWebhook.length > 12 ? `***${zapierWebhook.slice(-8)}` : zapierWebhook;
    console.log('[notify] using zapier webhook:', masked);

    // Basic validation
    const { appUserId, phone, name, vitals, triggers } = body || {};
    if (!appUserId || !phone || !triggers || !Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
    }

    // Normalize phone a bit (strip spaces)
    const normalizedPhone = String(phone).replace(/\s+/g, '');

    const payloadToZapier = {
      ...body,
      phone: normalizedPhone,
      forwardedAt: new Date().toISOString(),
      forwardedFrom: 'nextjs-notify-api'
    };

    // Try to forward to Zapier with a single retry on failure and capture response body for debugging
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
      // one retry
      try {
        forwarded = await doPost();
      } catch (e) {
        // ignore
      }
    }

    if (!forwarded || !forwarded.res.ok) {
      console.error('[notify] forwarding failed', forwarded?.res?.status, forwarded?.text);
      return NextResponse.json({ ok: false, error: 'failed to forward to zapier', zapierStatus: forwarded?.res?.status || null, zapierBody: forwarded?.text || null }, { status: 502 });
    }

    // Log Zapier response for debugging
    console.log('[notify] forwarded to Zapier, status=', forwarded.res.status, 'body=', forwarded.text);

    return NextResponse.json({ ok: true, zapierStatus: forwarded.res.status, zapierBody: forwarded.text });
  } catch (err: any) {
    console.error('Error in /api/notify', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
