'use client';

import { useState } from 'react';
import { db } from '../../../firebase/config';
import { ref, get } from 'firebase/database';

export default function HospitalsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const hospitalsRef = ref(db, 'hospitals');
      const snap = await get(hospitalsRef);
      if (!snap.exists()) {
        setError('No hospitals data available');
        return;
      }

      const list = snap.val();
      const matches: any[] = [];
      const q = query.trim().toLowerCase();

      for (const [id, h] of Object.entries(list)) {
        const hosp: any = h;
        // match by pincode directly if query looks like digits
        if (/^\d{4,6}$/.test(q)) {
          if (String(hosp.pincode || '').toLowerCase() === q) matches.push({ id, ...hosp });
        } else {
          // attempt to match city or address
          const city = String(hosp.city || '').toLowerCase();
          const addr = String(hosp.address || '').toLowerCase();
          if (city.includes(q) || addr.includes(q)) matches.push({ id, ...hosp });
        }
      }

      setResults(matches);
    } catch (e: any) {
      console.error('Failed to fetch hospitals:', e);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outer-frame">
      <div className="kiosk-card">
        <h2>Nearby Hospitals</h2>
        <p className="subtitle">Enter your city, address or pincode to find nearby hospitals</p>

        <div style={{ marginTop: 16 }}>
          <input placeholder="City or pincode" value={query} onChange={(e) => setQuery(e.target.value)} className="input" />
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
              <h3 style={{ margin: 0 }}>{r.name}</h3>
              <p style={{ margin: '6px 0' }}>{r.address}</p>
              <p style={{ margin: 0 }}>City: {r.city} • Pincode: {r.pincode}</p>
              <p style={{ marginTop: 8 }}>Phone: {r.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
