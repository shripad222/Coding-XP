'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from '../../firebase/config';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FiMail, FiCamera } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'en';

  const [loginMethod, setLoginMethod] = useState<'email' | 'qr' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleQrCodeSuccess = async (decodedText: string) => {
    setInfo(`Scanned User ID: ${decodedText}. Verifying...`);
    setError('');
    try {
      const userRef = ref(db, `users/${decodedText}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        // User found, navigate to dashboard
        router.push(`/dashboard?userId=${decodedText}&lang=${lang}`);
      } else {
        setError('Invalid QR Code. User not found.');
        setInfo('');
      }
    } catch (err) {
        setError('An error occurred while verifying the QR code.');
        setInfo('');
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | undefined;
    if (loginMethod === 'qr') {
        scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: 250 },
            false
        );
        scanner.render(handleQrCodeSuccess, (error) => {
            // Optional: handle scan errors
        });
    }

    return () => {
      if (scanner) {
        try {
            // It's important to clear the scanner when the component unmounts
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner on unmount.", error);
            });
        } catch (e) {}
      }
    };
  }, [loginMethod]);

  const handleEmailLogin = async () => {
    setError('');
    setInfo('');
    try {
      if (!email || !password) {
          setError('Email and password are required.');
          return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      router.push(`/dashboard?lang=${lang}`);
    } catch (error: any) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const resetState = () => {
    setLoginMethod(null);
    setError('');
    setInfo('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="outer-frame">
      <div className="kiosk-card" role="region" aria-label="Login">
        <div className="logo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h3l2-5 3 10 2-6h3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Login</h1>
        <p className="subtitle">Access your health dashboard</p>

        <div className="section" style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }} className={loginMethod ? 'hidden' : ''}>
            <div className="option" tabIndex={0} onClick={() => setLoginMethod('email')} style={{ textAlign: 'center' }}>
              <FiMail size={28} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Use Email & Password</div>
            </div>
            <div className="option" tabIndex={0} onClick={() => setLoginMethod('qr')} style={{ textAlign: 'center' }}>
              <FiCamera size={28} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Scan QR Code</div>
            </div>
          </div>

          {loginMethod === 'email' && (
            <form onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="label">Enter your credentials</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="input" />
              <button type="submit" className="btn btn-primary full">Login</button>
            </form>
          )}

          {loginMethod === 'qr' && (
            <div style={{ textAlign: 'center' }}>
              <div className="label">Scan Your QR Code</div>
              <div id="qr-reader" style={{ width: '100%', maxWidth: 360, margin: '12px auto' }}></div>
              {info && <p style={{ color: '#0ea5e9', fontSize: 13, marginTop: 8 }}>{info}</p>}
            </div>
          )}

          {error && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}

          {loginMethod && (
            <button onClick={resetState} className="btn full" style={{ marginTop: 6 }}>Back</button>
          )}
        </div>

        <p className="footnote">Need an account? <a href={`/register?lang=${lang}`} className="text-blue-500">Register here</a>.</p>
      </div>
    </div>
  );
}
