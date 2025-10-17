'use client';

import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../../firebase/config';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { useVitals } from '../VitalsContext';

export default function Results() {
  const { vitals, startOver, saveVitals, isSaving, currentUserId } = useVitals();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  const checkAbnormal = (v: any) => {
    if (v.temperature > 38.0 || v.temperature < 35.0) return true;
    if (v.heartRate > 100 || v.heartRate < 60) return true;
    if (v.systolic >= 140 || v.diastolic >= 90 || v.systolic < 90) return true;
    if (v.bloodSugar >= 126 || v.bloodSugar < 70) return true;
    return false;
  };

  const isAbnormal = checkAbnormal(vitals);

  const hasBeepedRef = useRef(false);

  // Play short beep tones using Web Audio API
  const playBeeps = async (count = 5, frequency = 880, durationMs = 120, gapMs = 140) => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        // quick attack
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
        // schedule end
        gain.gain.linearRampToValueAtTime(0.0001, now + durationMs / 1000);
        osc.start(now);
        osc.stop(now + durationMs / 1000 + 0.02);
        // wait for this beep + gap
        await new Promise((res) => setTimeout(res, durationMs + gapMs));
      }
      // close context if supported
      try { ctx.close(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Beep playback failed', e);
    }
  };

  useEffect(() => {
    if (isAbnormal) {
      if (!hasBeepedRef.current) {
        hasBeepedRef.current = true;
        // fire-and-forget beep sequence
        playBeeps(3).catch(() => {});
      }
    } else {
      // reset so next abnormal reading will beep again
      hasBeepedRef.current = false;
    }
  }, [isAbnormal]);

  // Notify via server endpoint (which forwards to Zapier) when abnormal readings are shown
  const hasNotifiedRef = useRef(false);
  useEffect(() => {
    if (!isAbnormal) {
      hasNotifiedRef.current = false;
      return;
    }
    if (hasNotifiedRef.current) return;
    (async () => {
      try {
        hasNotifiedRef.current = true;
        // compute triggers
        const triggers: string[] = [];
        if (vitals.temperature != null && (vitals.temperature > 38.0 || vitals.temperature < 35.0)) triggers.push('temperature');
        if (vitals.heartRate != null && (vitals.heartRate > 100 || vitals.heartRate < 60)) triggers.push('heartRate');
        if (vitals.systolic != null && (vitals.systolic >= 140 || vitals.systolic < 90)) triggers.push('systolic');
        if (vitals.diastolic != null && (vitals.diastolic >= 90 || vitals.diastolic < 60)) triggers.push('diastolic');

        // try to read user contact
        let userName = '';
        let userPhone = '';
        try {
          if (currentUserId) {
            const userRef = dbRef(db, `users/${currentUserId}`);
            const snap = await get(userRef);
            if (snap.exists()) {
              const u: any = snap.val();
              userName = u.name || u.fullName || u.displayName || '';
              userPhone = u.phone || u.mobile || u.contact || '';
            }
          }
        } catch (e) {
          console.warn('Failed to read user contact from DB in Results', e);
        }

        const payload = {
          appUserId: currentUserId || 'unknown',
          type: 'vitals_alert',
          name: userName,
          phone: userPhone,
          checkupId: `results_${Date.now()}`,
          vitals: {
            temperature: vitals.temperature,
            heartRate: vitals.heartRate,
            systolic: vitals.systolic,
            diastolic: vitals.diastolic,
            bloodSugar: vitals.bloodSugar,
            bmi: vitals.bmi,
          },
          triggers,
        };

        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          try {
            const j = await res.json();
            if (!res.ok) console.warn('Results /api/notify returned', res.status, j);
            else console.log('Results forwarded alert via /api/notify', j);
          } catch (e) {
            console.log('Results notify completed with no JSON', e);
          }
        }).catch((err) => console.warn('Results /api/notify failed', err));
      } catch (e) {
        console.warn('Failed to send Results notify', e);
      }
    })();
  }, [isAbnormal, currentUserId, vitals]);

  const handleSaveVitals = async () => {
    try {
      setSaveStatus('idle');
      await saveVitals();
      setSaveStatus('success');
    } catch (error) {
      console.error('Failed to save vitals:', error);
      setSaveStatus('error');
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    const userIdDisplay = currentUserId || 'Unknown User';
    doc.setFontSize(18);
    doc.text('Vitals Report', 14, 20);

    doc.setFontSize(12);
    doc.text(`User ID: ${userIdDisplay}`, 14, 32);

    const startY = 44;
    const lines = [
      `Temperature: ${vitals.temperature ?? '-'} °C`,
      `Heart Rate: ${vitals.heartRate ?? '-'} bpm`,
      `Blood Pressure: ${vitals.systolic ?? '-'} / ${vitals.diastolic ?? '-'} mmHg`,
      `Blood Sugar: ${vitals.bloodSugar ?? '-'} mg/dL`,
      `BMI: ${vitals.bmi ?? '-'}`
    ];

    let y = startY;
    lines.forEach((line) => {
      doc.text(line, 14, y);
      y += 8;
    });

    const filename = `vitals_${userIdDisplay}.pdf`;
    doc.save(filename);
  };

  const handleBookTelemedicine = () => {
    router.push('/telemedicine');
  };

  return (
    <div className="kiosk-card">
      <h2 className="text-2xl font-bold mb-4">Vitals Summary</h2>
      <div className="space-y-2">
        <p>Temperature: {vitals.temperature}°C</p>
        <p>Heart Rate: {vitals.heartRate} bpm</p>
        <p>Blood Pressure: {vitals.systolic}/{vitals.diastolic} mmHg</p>
        <p>Blood Sugar: {vitals.bloodSugar} mg/dL</p>
        <p>BMI: {vitals.bmi}</p>
      </div>
      {isAbnormal ? (
        <p className="text-red-500 font-semibold mt-4">Abnormal readings detected!</p>
      ) : (
        <p className="text-green-500 font-semibold mt-4">All parameters normal</p>
      )}
      
      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <p className="text-green-500 font-semibold mt-4">✓ Vitals saved successfully!</p>
      )}
      {saveStatus === 'error' && (
        <p className="text-red-500 font-semibold mt-4">✗ Failed to save vitals. Please try again.</p>
      )}
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSaveVitals}
          disabled={isSaving}
          className="btn btn-primary flex-1"
        >
          {isSaving ? 'Saving...' : 'Save Vitals'}
        </button>
        <button
          onClick={handleDownloadPdf}
          className="btn btn-primary flex-1"
        >
          Download PDF
        </button>
      </div>
      
      <div className="flex gap-3 mt-3">
        <button
          onClick={handleBookTelemedicine}
          className="btn btn-primary flex-1"
        >
          Book Telemedicine
        </button>
        <button
          onClick={startOver}
          className="btn btn-outline flex-1"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
