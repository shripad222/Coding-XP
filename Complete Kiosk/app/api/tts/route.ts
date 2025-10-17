import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PUBLIC_AUDIO = path.join(process.cwd(), 'public', 'audio');

function makeFilename(text: string, languageCode: string, audioEncoding: string) {
  const hash = crypto.createHash('sha1').update(`${languageCode}|${audioEncoding}|${text}`).digest('hex');
  return `${hash}.${audioEncoding === 'MP3' ? 'mp3' : 'wav'}`;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { text, languageCode = 'en-US', voice = undefined, audioEncoding = 'MP3' } = payload || {};

    if (!text) {
      return NextResponse.json({ error: 'Missing `text` in request body' }, { status: 400 });
    }

    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Server misconfiguration: GOOGLE_API_KEY missing' }, { status: 500 });
    }

    // Ensure public/audio exists
    try {
      fs.mkdirSync(PUBLIC_AUDIO, { recursive: true });
    } catch (e) {
      // ignore
    }

    const filename = makeFilename(text, languageCode, audioEncoding);
    const filePath = path.join(PUBLIC_AUDIO, filename);

    // If cached file exists, return its public URL
    if (fs.existsSync(filePath)) {
      const url = `/audio/${filename}`;
      return NextResponse.json({ url, cached: true });
    }

    // Build request body for Google Cloud Text-to-Speech REST API v1
    const body = {
      input: { text },
      voice: voice ? { languageCode: languageCode, name: voice } : { languageCode: languageCode },
      audioConfig: { audioEncoding }
    };

    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: 'TTS provider error', details: txt }, { status: 502 });
    }

    const data = await res.json();
    const audioContent = data?.audioContent;
    if (!audioContent) {
      return NextResponse.json({ error: 'TTS provider returned no audio' }, { status: 502 });
    }

    // Save the file to public/audio for caching
    const buffer = Buffer.from(audioContent, 'base64');
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (e: any) {
      // If we cannot write to disk, return the audio content directly
      return NextResponse.json({ audioContent });
    }

    return NextResponse.json({ url: `/audio/${filename}`, cached: false });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
