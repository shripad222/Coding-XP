'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLogIn, FiUserPlus, FiGlobe } from 'react-icons/fi';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  promptAudio: string;
  confirmAudio: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    promptAudio: '/audio/prompt_en.mp3',
    confirmAudio: '/audio/confirm_en.mp3'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    promptAudio: '/audio/prompt_hi.mp3',
    confirmAudio: '/audio/confirm_hi.mp3'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    promptAudio: '/audio/prompt_mr.mp3',
    confirmAudio: '/audio/confirm_mr.mp3'
  }
];

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'en';
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(lang);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [promptPlayedOnce, setPromptPlayedOnce] = useState(false);

  useEffect(() => {
    // Try to autoplay the current language prompt on mount/when language changes
    const tryAutoplay = async () => {
      const currentLang = languages.find((l) => l.code === selectedLanguage);
      if (!currentLang) return;
      try {
        const ok = await playAudio(currentLang.promptAudio);
        if (ok) setPromptPlayedOnce(true);
      } catch (err) {
        console.warn('Autoplay failed:', err);
        setAutoplayBlocked(true);
      }
    };
    tryAutoplay();
  }, [selectedLanguage]);

  // playAudio: prefer local file (HEAD), otherwise call /api/tts; returns true on success
  const playAudio = async (audioPath: string) => {
    setPlaybackError(null);
    try {
      // Check if audioPath exists locally
      const head = await fetch(audioPath, { method: 'HEAD' });
      if (head.ok) {
        const audio = new Audio(audioPath);
        audioRef.current = audio;
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.onended = () => setIsPlaying(null);
        audio.onplaying = () => {
          setIsPlaying(audioPath);
          setAutoplayBlocked(false);
        };
        await audio.play();
        return true;
      }

      // Local file missing: call server-side TTS
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: audioPath.includes('prompt') ? 'Please choose your language' : 'You selected language', languageCode: audioPath.includes('_hi') ? 'hi-IN' : audioPath.includes('_mr') ? 'mr-IN' : 'en-US' })
      });

      if (!ttsRes.ok) {
        const txt = await ttsRes.text();
        throw new Error(`TTS server error: ${txt}`);
      }

      const data = await ttsRes.json();
      if (data?.url) {
        const audio = new Audio(data.url);
        audioRef.current = audio;
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.onended = () => setIsPlaying(null);
        audio.onplaying = () => {
          setIsPlaying(data.url);
          setAutoplayBlocked(false);
        };
        await audio.play();
        return true;
      }

      const base64 = data?.audioContent;
      if (!base64) throw new Error('TTS returned no audio');

      const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(null);
      audio.onplaying = () => {
        setIsPlaying(audioPath);
        setAutoplayBlocked(false);
      };
      await audio.play();
      URL.revokeObjectURL(url);
      return true;
    } catch (error: any) {
      console.error('Error playing audio:', error);
      setPlaybackError(error?.message ?? String(error));
      setAutoplayBlocked(true);
      return false;
    }
  };

  const handleLanguageSelect = async (language: LanguageOption) => {
    setSelectedLanguage(language.code);
    await playAudio(language.confirmAudio);
  };

  const handleLogin = () => {
    router.push(`/login?lang=${selectedLanguage}`);
  };

  const handleRegister = () => {
    router.push(`/register?lang=${selectedLanguage}`);
  };

  const toggleLanguageSelection = () => {
    setShowLanguageSelection(!showLanguageSelection);
  };

  const handlePlayWelcome = async () => {
    const currentLang = languages.find(l => l.code === selectedLanguage);
    if (currentLang) {
      try {
        await playAudio(currentLang.promptAudio);
      } catch (e) {
        console.error('Play on user action failed:', e);
      }
    }
  };

  // If autoplay was blocked, try to play once on any user gesture (click/tap)
  useEffect(() => {
    if (!autoplayBlocked) return;

    const onFirstGesture = async () => {
      try {
        await handlePlayWelcome();
      } catch (e) {
        // ignore
      } finally {
        document.removeEventListener('pointerdown', onFirstGesture);
      }
    };

    document.addEventListener('pointerdown', onFirstGesture, { once: true });

    return () => document.removeEventListener('pointerdown', onFirstGesture);
  }, [autoplayBlocked, selectedLanguage]);

  // Pause and clear audio on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <div className="outer-frame">
      <div className="kiosk-card" role="region" aria-label="Authentication">
        <div className="logo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h3l2-5 3 10 2-6h3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Welcome!</h1>
        <p className="subtitle">Please choose an option to continue</p>

        {/* Language Selection */}
        <div className="section" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div className="label" style={{ textAlign: 'center', marginBottom: '15px' }}>
            🌐 Language / भाषा / भाषा
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language)}
                style={{
                  padding: '8px 16px',
                  border: selectedLanguage === language.code ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '20px',
                  backgroundColor: selectedLanguage === language.code ? '#3b82f6' : 'white',
                  color: selectedLanguage === language.code ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                {language.nativeName}
                {isPlaying === language.confirmAudio && ' 🔊'}
              </button>
            ))}
          </div>
          
          {selectedLanguage && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Selected: {languages.find(l => l.code === selectedLanguage)?.name}
            </p>
          )}
          {/* If autoplay was blocked, show a clear play button so user can start audio */}
          {autoplayBlocked && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={handlePlayWelcome}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ▶️ Play welcome message
              </button>
            </div>
          )}
          {playbackError && (
            <p style={{ textAlign: 'center', color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>
              ⚠️ {playbackError}. If you don't hear anything, please tap the screen or press the button above.
            </p>
          )}
        </div>

        <div className="section" style={{ marginTop: '30px' }}>
          <div className="question-row" style={{gap: '20px'}}>
              <div className="option" tabIndex={0} onClick={handleLogin}>
                <span className="icon person" aria-hidden="true"><FiLogIn size={24}/></span>
                <div className="text">
                  <strong>Login</strong>
                  <span className="muted">Access your dashboard</span>
                </div>
              </div>
              <div className="option" tabIndex={0} onClick={handleRegister}>
                <span className="icon phone" aria-hidden="true"><FiUserPlus size={24}/></span>
                <div className="text">
                  <strong>Register</strong>
                  <span className="muted">Create a new account</span>
                </div>
              </div>
          </div>
        </div>

        <p className="footnote">Your health journey starts here.</p>
      </div>
    </div>
  );
}
