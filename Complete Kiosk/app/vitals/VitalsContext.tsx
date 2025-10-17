'use client';
import { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ref, set, get, child } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase/config';
import { useEffect } from 'react';

interface Vitals {
  aadhar?: string | null;
  temperature: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  bloodSugar: number | null;
  bmi: number | null;
}

interface VitalsContextType {
  vitals: Vitals;
  setVitals: (vitals: Vitals) => void;
  step: number;
  setStep: (step: number) => void;
  startOver: () => void;
  startMeasurement: () => void;
  saveVitals: () => Promise<void>;
  isSaving: boolean;
  currentUserId: string | null;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export function VitalsProvider({ children }: { children: ReactNode }) {
  const [vitals, setVitals] = useState<Vitals>({ aadhar: null, temperature: null, heartRate: null, systolic: null, diastolic: null, bloodSugar: null, bmi: null });
  const [step, setStep] = useState(0); // 0: Welcome, 1-5: Measurement, 6: Report
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const startOver = () => setStep(0);
  const startMeasurement = () => setStep(1);

  // Effect to get current user ID from URL params or auth state
  useEffect(() => {
    // First try to get from URL params (for QR code login)
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl) {
      setCurrentUserId(userIdFromUrl);
      return;
    }
    
    // If no userId in URL, get from Firebase auth and users collection
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Find the user ID by matching the Firebase UID
          const usersRef = ref(db, 'users');
          const snapshot = await get(usersRef);
          
          if (snapshot.exists()) {
            const users = snapshot.val();
            for (const [userId, userData] of Object.entries(users)) {
              if ((userData as any).uid === user.uid) {
                setCurrentUserId(userId);
                return;
              }
            }
          }
          console.warn('User not found in users collection');
        } catch (error) {
          console.error('Error finding user ID:', error);
        }
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, [searchParams]);

  // Function to get current user ID
  const getCurrentUserId = () => {
    return currentUserId;
  };

  // Function to generate unique checkup ID
  const generateCheckupId = () => {
    const now = new Date();
    const timestamp = now.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `checkup_${timestamp}_${random}`;
  };

  // Function to save vitals to Firebase RTDB
  const saveVitals = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found. Cannot save vitals.');
      return;
    }

    setIsSaving(true);
    try {
      const checkupId = generateCheckupId();
      
      // Create vitals data object
      const vitalsData = {
        temperature: vitals.temperature,
        heartRate: vitals.heartRate,
        systolic: vitals.systolic,
        diastolic: vitals.diastolic,
        bloodSugar: vitals.bloodSugar,
        bmi: vitals.bmi,
        timestamp: new Date().toISOString()
      };

      // Save to Firebase RTDB in the specified format
      const vitalsRef = ref(db, `vitals/${userId}/${checkupId}`);
      await set(vitalsRef, vitalsData);
      
      console.log(`Vitals saved successfully for user ${userId} with checkup ID ${checkupId}`);

      // Threshold checks - trigger alert webhook if any metric exceeds defined thresholds
      try {
        const triggers: string[] = [];
        // thresholds (can be adjusted)
        const TEMP_THRESHOLD = 38.0; // Celsius
        const HR_THRESHOLD = 100; // beats per minute
        const SYS_THRESHOLD = 140; // systolic
        const DIA_THRESHOLD = 90; // diastolic

        if (vitals.temperature != null && vitals.temperature > TEMP_THRESHOLD) triggers.push('temperature');
        if (vitals.heartRate != null && vitals.heartRate > HR_THRESHOLD) triggers.push('heartRate');
        if (vitals.systolic != null && vitals.systolic > SYS_THRESHOLD) triggers.push('systolic');
        if (vitals.diastolic != null && vitals.diastolic > DIA_THRESHOLD) triggers.push('diastolic');

        if (triggers.length) {
          // read user contact details
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

          // fallback to auth info
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
            checkupId,
            vitals: vitalsData,
            triggers,
          };

          // Call server-side notify endpoint which forwards to Zapier (keeps webhook secret on server)
          // Fire-and-forget; preserve logs but don't block the save flow.
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(async (res) => {
            try {
              const j = await res.json();
              if (!res.ok) console.warn('/api/notify returned', res.status, j);
              else console.log('Alert forwarded via /api/notify for', userId, triggers);
            } catch (e) {
              console.log('Alert POST completed with no JSON response', e);
            }
          }).catch((err) => console.warn('/api/notify failed', err));
        }
      } catch (e) {
        console.warn('Error running threshold checks / webhook', e);
      }
    } catch (error) {
      console.error('Error saving vitals:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Immediate client-side alert: when vitals update and thresholds crossed, send one alert
  const hasSentAlertRef = useRef(false);

  const sendAlert = async (payload: any) => {
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      try {
        const j = await res.json();
        console.log('sendAlert result', res.status, j);
      } catch (e) {
        console.log('sendAlert completed with no JSON');
      }
    } catch (err) {
      console.warn('sendAlert failed', err);
    }
  };

  // Watch vitals changes and send alert once per measurement session when thresholds are exceeded
  useEffect(() => {
    if (!currentUserId) return;
    if (!vitals) return;

    // thresholds (same as saveVitals)
    const TEMP_THRESHOLD = 38.0; // Celsius
    const HR_THRESHOLD = 100; // beats per minute
    const SYS_THRESHOLD = 140; // systolic
    const DIA_THRESHOLD = 90; // diastolic

    const triggers: string[] = [];
    if (vitals.temperature != null && vitals.temperature > TEMP_THRESHOLD) triggers.push('temperature');
    if (vitals.heartRate != null && vitals.heartRate > HR_THRESHOLD) triggers.push('heartRate');
    if (vitals.systolic != null && vitals.systolic > SYS_THRESHOLD) triggers.push('systolic');
    if (vitals.diastolic != null && vitals.diastolic > DIA_THRESHOLD) triggers.push('diastolic');

    if (triggers.length && !hasSentAlertRef.current) {
      // try to fetch user contact details
      (async () => {
        let userName = '';
        let userPhone = '';
        try {
          const userRef = ref(db, `users/${currentUserId}`);
          const userSnap = await get(userRef);
          if (userSnap.exists()) {
            const u: any = userSnap.val();
            userName = u.name || u.fullName || u.displayName || '';
            userPhone = u.phone || u.mobile || u.contact || '';
          }
        } catch (e) {
          console.warn('Failed to read user contact from DB for immediate alert', e);
        }

        // fallback to auth info
        if (!userPhone && auth?.currentUser) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userPhone = auth.currentUser.phoneNumber || auth.currentUser.email || '';
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userName = userName || auth.currentUser.displayName || '';
        }

        const checkupId = generateCheckupId();
        const payload = {
          appUserId: currentUserId,
          name: userName,
          phone: userPhone,
          checkupId,
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

        // Fire-and-forget
        sendAlert(payload);
        hasSentAlertRef.current = true;
      })();
    }
  }, [vitals, currentUserId]);

  // Reset alert flag when measurement session restarts
  useEffect(() => {
    if (step === 0) {
      hasSentAlertRef.current = false;
    }
  }, [step]);

  return (
    <VitalsContext.Provider value={{ 
      vitals, 
      setVitals, 
      step, 
      setStep, 
      startOver, 
      startMeasurement, 
      saveVitals,
      isSaving,
      currentUserId
    }}>
      {children}
    </VitalsContext.Provider>
  );
}

export function useVitals() {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
}
