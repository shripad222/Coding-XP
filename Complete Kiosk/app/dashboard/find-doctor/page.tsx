'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { ref, get } from 'firebase/database';

export default function FindDoctorPage() {
  const [specialization, setSpecialization] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // collect specialization options from hospital_doctors collection
    (async () => {
      try {
        const refNode = ref(db, 'hospital_doctors');
        const snap = await get(refNode);
        if (!snap.exists()) return;
        const data = snap.val();
        const setSpec = new Set<string>();
        for (const [id, d] of Object.entries(data)) {
          const doc: any = d;
          if (doc.specialization) setSpec.add(doc.specialization);
        }
        setSpecializations(Array.from(setSpec));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const doctorsRef = ref(db, 'hospital_doctors');
      const snap = await get(doctorsRef);
      if (!snap.exists()) {
        setError('No doctors data available');
        return;
      }

      const list = snap.val();
      const matches: any[] = [];
      const q = specialization.trim().toLowerCase();

      for (const [id, d] of Object.entries(list)) {
        const doc: any = d;
        if (String(doc.specialization || '').toLowerCase() === q) matches.push({ id, ...doc });
      }

      setResults(matches);
    } catch (e: any) {
      console.error('Failed to fetch doctors:', e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outer-frame">
      <div className="kiosk-card">
        <h2>Find Nearby Doctor</h2>
        <p className="subtitle">Select specialization to find doctors</p>

        <div style={{ marginTop: 16 }}>
          <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="input">
            <option value="">-- Select specialization --</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div style={{ marginTop: 12 }}>
            <button onClick={handleSearch} className="btn">Search</button>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {loading && <p>Searching...</p>}
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {!loading && results.length === 0 && <p style={{ color: '#6b7280' }}>No results</p>}

          {results.map((r) => (
            <div key={r.id} className="kiosk-card" style={{ marginTop: 12 }}>
              <h3 style={{ margin: 0 }}>{r.name || r.doctor_name}</h3>
              <p style={{ margin: '6px 0' }}>{r.hospital}</p>
              <p style={{ margin: 0 }}>Specialization: {r.specialization}</p>
              <p style={{ marginTop: 8 }}>Phone: {r.mobile_no}</p>
              <p style={{ marginTop: 8 }}>Hospital Id: {r.hospital_id}</p>
              <p style={{ marginTop: 8 }}>Experience in Years: {r.experience_years}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
