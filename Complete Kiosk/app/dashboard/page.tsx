'use client';

import { VitalsProvider, useVitals } from '../vitals/VitalsContext';
import Navbar from '../vitals/Navbar';
import VitalsStepper from '../vitals/VitalsStepper';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { FiActivity, FiBell, FiVideo } from 'react-icons/fi';

function DashboardContent() {
  const router = useRouter();
  const { startMeasurement, currentUserId } = useVitals();
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [loadingMeet, setLoadingMeet] = useState(false);

  const ctaBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    width: 360,
    height: 84,
    borderRadius: 14,
    color: 'white',
    border: 'none',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
  };

  const iconStyle: React.CSSProperties = { width: 28, height: 28 };

  const fetchAndSetMeetLink = async () => {
    if (!currentUserId) {
      alert('No userId available. Please login or scan QR code to join telemedicine.');
      return;
    }
    setLoadingMeet(true);
    try {
      const appointmentsRef = ref(db, 'appointments');
      const snap = await get(appointmentsRef);
      if (!snap.exists()) {
        alert('No appointments found');
        return;
      }

      const appts = snap.val();
      const matched: any[] = [];
      for (const [id, a] of Object.entries(appts)) {
        const apt: any = a;
        if (apt.patient_id === currentUserId) matched.push({ id, ...apt });
      }

      if (!matched.length) {
        alert('No appointments found for your user id');
        return;
      }

      matched.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setMeetLink(matched[0].meet_link || null);
    } catch (e) {
      console.error('Failed fetching appointments', e);
      alert('Failed to fetch appointments. See console for details.');
    } finally {
      setLoadingMeet(false);
    }
  };

  return (
    <>
      <VitalsStepper />

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
        <button
          onClick={() => startMeasurement()}
          aria-label="Measure Your Vitals"
          style={{ ...ctaBase, backgroundColor: '#0ea5e9' }}
        >
          <FiActivity style={iconStyle} />
          <span style={{ fontSize: 20 }}>Measure Your Vitals</span>
        </button>

        <button
          onClick={() => router.push('/dashboard/medications')}
          aria-label="Medication and Alerts"
          style={{ ...ctaBase, backgroundColor: '#ef4444' }}
        >
          <FiBell style={iconStyle} />
          <span style={{ fontSize: 20 }}>Medication & Alerts</span>
        </button>

        <button
          onClick={() => router.push('/dashboard/hospitals')}
          aria-label="View Nearby Hospitals"
          style={{ ...ctaBase, backgroundColor: '#7c3aed' }}
        >
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 20 }}>View Nearby Hospitals</span>
        </button>

        <button
          onClick={() => router.push('/dashboard/find-doctor')}
          aria-label="Find Nearby Doctor"
          style={{ ...ctaBase, backgroundColor: '#f59e0b' }}
        >
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 20 }}>Find Nearby Doctor</span>
        </button>

        <a href="https://skin-cancer-detection-zqva.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button
            aria-label="Skin Disease Detection"
            style={{ ...ctaBase, backgroundColor: '#06b6d4' }}
          >
            <FiActivity style={iconStyle} />
            <span style={{ fontSize: 20 }}>Skin Disease Detection</span>
          </button>
        </a>

        {!meetLink ? (
          <button
            onClick={fetchAndSetMeetLink}
            disabled={loadingMeet}
            aria-label="Join Telemedicine"
            style={{ ...ctaBase, backgroundColor: '#10b981' }}
          >
            <FiVideo style={iconStyle} />
            <span style={{ fontSize: 20 }}>{loadingMeet ? 'Checking...' : 'Join Telemedicine'}</span>
          </button>
        ) : (
          <a href={meetLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button aria-label="Open Meeting" style={{ ...ctaBase, backgroundColor: '#065f46' }}>
              <FiVideo style={iconStyle} />
              <span style={{ fontSize: 20 }}>Open Meeting</span>
            </button>
          </a>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <VitalsProvider>
      <Navbar />
      <main className="p-6">
        <DashboardContent />
      </main>
    </VitalsProvider>
  );
}
