"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '../../../firebase/config';
import { ref, get, set } from 'firebase/database';

export default function MedicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [medicineName, setMedicineName] = useState('');
  const [time, setTime] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // prefer query userId; if absent, map Firebase auth UID to app user id stored under /users/{U_xxx}.uid
    const uidFromQuery = searchParams.get('userId');
    if (uidFromQuery) {
      setUserId(uidFromQuery);
      return;
    }

    const firebaseUid = auth?.currentUser?.uid;
    if (!firebaseUid) {
      // no authenticated user; fallback to demo id
      setUserId('U_001');
      return;
    }

    // find the app user id (U_001...) by scanning /users for matching uid field
    (async () => {
      try {
        const usersRef = ref(db, 'users');
        const snap = await get(usersRef);
        if (snap.exists()) {
          const users = snap.val();
          const match = Object.entries(users).find(([, v]: any) => v && v.uid === firebaseUid);
          if (match) {
            setUserId(match[0]);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to map firebase uid to app user id', e);
      }
      setUserId('U_001');
    })();
  }, [searchParams]);

  const handleSave = async () => {
    if (!userId) {
      alert('No userId available. Please login or scan QR code.');
      return;
    }

    if (!medicineName.trim()) {
      alert('Please enter medicine name');
      return;
    }

    setSaving(true);
    try {
      const medsRef = ref(db, `medications/${userId}`);
      const snapshot = await get(medsRef);

      // Determine next numeric key
      let nextIndex = 1;
      if (snapshot.exists()) {
        const meds = snapshot.val();
        const keys = Object.keys(meds).map(k => parseInt(k, 10)).filter(n => !isNaN(n));
        if (keys.length) nextIndex = Math.max(...keys) + 1;
      }

      const medData = {
        name: medicineName,
        time,
        quantity,
        notes,
        createdAt: new Date().toISOString()
      };

      // Save under numeric key
      const targetRef = ref(db, `medications/${userId}/${nextIndex}`);
      await set(targetRef, medData);

      // Send webhook to Zapier once (awaited) with cleaned logic
      try {
        let userName = '';
        let userPhone = '';
        try {
          const userRef = ref(db, `users/${userId}`);
          const userSnap = await get(userRef);
          if (userSnap.exists()) {
            const u: any = userSnap.val();
            userName = u.name || u.fullName || u.displayName || '';
            userPhone = u.phone || u.mobile || u.contact || '';
          }
        } catch (e) {
          console.warn('Failed to read user contact from DB', e);
        }

        if (!userPhone && auth?.currentUser) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userPhone = auth.currentUser.phoneNumber || auth.currentUser.email || '';
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userName = userName || auth.currentUser.displayName || '';
        }

        const payload = {
          appUserId: userId,
          name: userName,
          phone: userPhone,
          type: 'medication_reminder',
          medicine: medData.name,
          time: medData.time,
          quantity: medData.quantity,
          notes: medData.notes,
          createdAt: medData.createdAt
        };

        const res = await fetch('/api/notify/medication', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) console.warn('/api/notify/medication returned', res.status, j);
        else console.log('Medication notify forwarded', j);
      } catch (e) {
        console.warn('Failed to send medication webhook', e);
      }

      alert('Medication saved');
      // clear form
      setMedicineName('');
      setTime('');
      setQuantity('');
      setNotes('');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving medication', error);
      alert('Failed to save medication');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => router.push('/dashboard');

  return (
    <div className="p-6">
      <h2>Medication & Alerts</h2>
      <div style={{ maxWidth: 540 }}>
        <label>Medicine name</label>
        <input value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="input" />

        <label>Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />

        <label>Quantity</label>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />

        <label>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />

        <div style={{ marginTop: 12 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">Save Medication</button>
          <button onClick={handleBack} style={{ marginLeft: 8 }} className="btn">Back</button>
        </div>
      </div>
    </div>
  );
}
