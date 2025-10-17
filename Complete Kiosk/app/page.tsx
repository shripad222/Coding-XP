'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const selectLanguage = (lang: string) => {
    router.push(`/login?lang=${lang}`);
  };

  return (
    <div className="centered-layout">
      <div className="outer-frame">
        <div className="kiosk-card">
          <div className="logo-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12h3l2-5 3 10 2-6h3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1>AI Health Kiosk</h1>
          <p className="subtitle">Free health screening powered by AI</p>

          <div className="section">
            <div className="label">Select Language / भाषा चुने</div>
            <div className="option-grid">
              <div className="option" tabIndex={0} onClick={() => selectLanguage('en')}>
                <strong>EN</strong>
                <span className="muted">English</span>
              </div>
              <div className="option" tabIndex={0} onClick={() => selectLanguage('hi')}>
                <strong>HI</strong>
                <span className="muted">हिन्दी</span>
              </div>
              <div className="option" tabIndex={0} onClick={() => selectLanguage('mr')}>
                <strong>MR</strong>
                <span className="muted">मराठी</span>
              </div>
              <div className="option" tabIndex={0} onClick={() => selectLanguage('fr')}>
                <strong>FR</strong>
                <span className="muted">Français</span>
              </div>
            </div>
          </div>

          <p className="footnote">
            This screening is free and takes about 5 minutes<br />
            Your data is secure and confidential
          </p>
        </div>
      </div>
    </div>
  );
}
