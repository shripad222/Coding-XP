'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  promptText: string;
  confirmText: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    promptText: 'Please choose your language',
    confirmText: 'You selected English'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    promptText: 'कृपया अपनी भाषा चुनें',
    confirmText: 'आपने हिंदी चुनी'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    promptText: 'कृपया तुमची भाषा निवडा',
    confirmText: 'तुम्ही मराठी निवडली'
  }
];

const getLanguageCode = (code: string): string => {
  const mapping: { [key: string]: string } = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'mr': 'mr-IN'
  };
  return mapping[code] || 'en-US';
};

export default function LanguagePage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [promptPlayedOnce, setPromptPlayedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to autoplay the initial prompt. If blocked, we'll show a play hint.
    const tryAutoplay = async () => {
      try {
        console.debug('[language] attempting autoplay sequence');
        setIsLoading(true);
        
        for (const lang of languages) {
          console.debug('[language] attempting play for', lang.code);
          setIsPlaying('prompt');
          const ok = await playAudio(lang.promptText, lang.code);
          if (!ok) {
            throw new Error('autoplay-blocked');
          }
          // Small delay between languages
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.debug('[language] autoplay sequence completed');
        setPromptPlayedOnce(true);
        setIsPlaying(null);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('[language] Autoplay blocked or failed:', err);
        setAutoplayBlocked(true);
        setPlaybackError(err?.message ?? String(err));
        setIsPlaying(null);
        setIsLoading(false);
      }
    };

    tryAutoplay();

    const onPointer = () => {
      // First user gesture should start audio when autoplay is blocked
      if (autoplayBlocked && !promptPlayedOnce) {
        handlePlayWelcome();
        document.removeEventListener('pointerdown', onPointer);
      }
    };

    document.addEventListener('pointerdown', onPointer);

    return () => {
      document.removeEventListener('pointerdown', onPointer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAudio = async (text: string, languageCode: string): Promise<boolean> => {
    try {
      console.debug('[playAudio] Starting playback:', { text, languageCode });
      
      // Helper to play an Audio element and wait until it ends
      const playAndWait = (audio: HTMLAudioElement) => {
        return new Promise<boolean>((resolve, reject) => {
          let ended = false;
          const onEnded = () => {
            ended = true;
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            console.debug('[playAudio] Audio ended successfully');
            resolve(true);
          };
          const onError = (ev: any) => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            console.error('[playAudio] Audio error event:', ev);
            reject(new Error('Playback error'));
          };
          audio.addEventListener('ended', onEnded);
          audio.addEventListener('error', onError);
          
          // Start play; the play() promise may reject if autoplay is blocked
          const p = audio.play();
          if (p && typeof p.then === 'function') {
            p.catch((err: any) => {
              // If play() failed (autoplay blocked), cleanup and reject
              if (!ended) {
                audio.removeEventListener('ended', onEnded);
                audio.removeEventListener('error', onError);
                console.error('[playAudio] Play promise rejected:', err);
                reject(err);
              }
            });
          }
        });
      };

      // Call TTS API to generate audio
      console.debug('[playAudio] Calling TTS API...');
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text,
          languageCode: getLanguageCode(languageCode)
        })
      });

      if (!ttsRes.ok) {
        const txt = await ttsRes.text();
        console.error('[playAudio] TTS API error:', txt);
        throw new Error(`TTS server error: ${txt}`);
      }

      const data = await ttsRes.json();
      console.debug('[playAudio] TTS response received:', data);

      // If API returned a cached URL, prefer playing that static file
      if (data?.url) {
        console.debug('[playAudio] Using cached URL:', data.url);
        const audio = new Audio(data.url);
        // main audioRef is used for click/confirm playback
        audioRef.current = audio;
        audio.preload = 'auto';
        audio.volume = 1.0;
        await playAndWait(audio);
        setIsPlaying(null);
        return true;
      }

      const base64 = data?.audioContent;
      if (!base64) {
        console.error('[playAudio] No audio content in response');
        throw new Error('TTS returned no audio');
      }

      console.debug('[playAudio] Creating blob from base64 audio');
      const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
  audioRef.current = audio;
      
      try {
        await playAndWait(audio);
        setIsPlaying(null);
        URL.revokeObjectURL(url);
        return true;
      } catch (err) {
        URL.revokeObjectURL(url);
        throw err;
      }
    } catch (error: any) {
      console.error('[playAudio] Error:', error);
      setPlaybackError(error?.message ?? String(error));
      setAutoplayBlocked(true);
      setIsPlaying(null);
      return false;
    }
  };

  // Hover audio: play a short prompt on hover/focus and stop on leave/blur
  const startHoverAudio = async (text: string, languageCode: string) => {
    try {
      // Don't start hover audio if a main audio is playing
      if (audioRef.current) return;
      // Stop existing hover audio
      if (hoverAudioRef.current) {
        hoverAudioRef.current.pause();
        hoverAudioRef.current = null;
      }

      // Request TTS for the short prompt and play it (non-blocking)
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, languageCode: getLanguageCode(languageCode) })
      });
      if (!ttsRes.ok) return;
      const data = await ttsRes.json();
      let src: string | null = null;
      if (data?.url) src = data.url;
      else if (data?.audioContent) {
        const blob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        src = URL.createObjectURL(blob);
      }
      if (!src) return;

      const audio = new Audio(src);
      hoverAudioRef.current = audio;
      audio.preload = 'auto';
      audio.volume = 0.95;
      // play but don't await; visually indicate playing
      setIsPlaying(languageCode);
      const p = audio.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
      audio.addEventListener('ended', () => {
        if (hoverAudioRef.current === audio) {
          hoverAudioRef.current = null;
          setIsPlaying(null);
        }
        if (src && data?.audioContent) {
          URL.revokeObjectURL(src);
        }
      });
    } catch (e) {
      // ignore hover errors
    }
  };

  const stopHoverAudio = () => {
    if (hoverAudioRef.current) {
      try { hoverAudioRef.current.pause(); } catch (e) {}
      hoverAudioRef.current = null;
    }
    // Clear playing state only if main audio isn't playing
    if (!audioRef.current) setIsPlaying(null);
  };

  const handlePlayWelcome = async () => {
    // Play welcome prompts for all languages sequentially (user gesture)
    setIsPlaying('prompt');
    setIsLoading(true);
    setPlaybackError(null);
    
    for (const lang of languages) {
      const ok = await playAudio(lang.promptText, lang.code);
      if (!ok) break;
      // Small delay between languages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setPromptPlayedOnce(true);
    setIsPlaying(null);
    setIsLoading(false);
  };

  const handleLanguageSelect = async (language: LanguageOption) => {
    if (isPlaying || isLoading) return; // Prevent multiple clicks
    
    setSelectedLanguage(language.code);
    setIsPlaying(language.code);
    setIsLoading(true);
    
    // Play confirmation audio for selected language
    await playAudio(language.confirmText, language.code);
    
    // Navigate to auth page with selected language after audio plays
    setTimeout(() => {
      router.push(`/auth?lang=${language.code}`);
    }, 1500);
  };

  return (
    <div className="outer-frame">
      <div className="kiosk-card" role="region" aria-label="Language Selection">
        <div className="logo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h3l2-5 3 10 2-6h3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>🌐 Language Selection</h1>
        <p className="subtitle">Please choose your preferred language</p>

        <div className="section" style={{ marginTop: '30px' }}>
          {autoplayBlocked && !promptPlayedOnce && (
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <p style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '14px' }}>
                🔇 Audio autoplay was blocked by your browser
              </p>
              <button 
                onClick={handlePlayWelcome} 
                className="btn"
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? '⏳ Playing...' : '▶️ Play Welcome Message'}
              </button>
              {playbackError && (
                <div style={{ color: '#dc2626', marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>
                  Error: {playbackError}
                </div>
              )}
            </div>
          )}

          {isPlaying === 'prompt' && (
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
                🔊 Playing welcome message...
              </p>
            </div>
          )}

          <div className="language-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {languages.map((language) => (
              <div 
                key={language.code}
                className={`language-option ${selectedLanguage === language.code ? 'selected' : ''} ${isPlaying === language.code ? 'playing' : ''}`}
                onClick={async () => {
                  // stop hover audio before playing confirm
                  stopHoverAudio();
                  await handleLanguageSelect(language);
                }}
                onMouseEnter={() => startHoverAudio(language.promptText, language.code)}
                onMouseLeave={() => stopHoverAudio()}
                onFocus={() => startHoverAudio(language.promptText, language.code)}
                onBlur={() => stopHoverAudio()}
                style={{
                  padding: '20px',
                  border: selectedLanguage === language.code ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: (isPlaying || isLoading) ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  backgroundColor: selectedLanguage === language.code ? '#eff6ff' : 'white',
                  transition: 'all 0.3s ease',
                  transform: isPlaying === language.code ? 'scale(1.05)' : 'scale(1)',
                  opacity: (isPlaying || isLoading) && selectedLanguage !== language.code ? 0.6 : 1,
                  boxShadow: selectedLanguage === language.code ? '0 4px 6px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                  {language.code === 'en' ? '🇺🇸' : language.code === 'hi' ? '🇮🇳' : '🇮🇳'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: '#1f2937' }}>
                  {language.nativeName}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {language.name}
                </div>
                {isPlaying === language.code && (
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' }}>
                    🔊 Playing...
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedLanguage && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '2px solid #0ea5e9',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <p style={{ color: '#0c4a6e', fontWeight: 'bold', margin: 0, fontSize: '16px' }}>
                ✅ You selected {languages.find(l => l.code === selectedLanguage)?.nativeName}
              </p>
              <p style={{ fontSize: '14px', color: '#0369a1', margin: '8px 0 0 0' }}>
                Redirecting to authentication...
              </p>
            </div>
          )}
        </div>

        <p className="footnote" style={{ marginTop: '30px' }}>Choose your language to continue</p>
      </div>
    </div>
  );
}