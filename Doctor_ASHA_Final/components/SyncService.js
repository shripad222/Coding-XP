'use client';

import { useEffect } from 'react';
import { db as localDb } from '../lib/db';
import { db as firebaseDb } from '../lib/firebase';
import { ref, push, set } from 'firebase/database';

const SyncService = () => {
  useEffect(() => {
    const syncData = async () => {
      const isOnline = navigator.onLine;
      if (isOnline) {
        console.log('Online, checking for data to sync...');
        const updatesToSync = await localDb.asha_updates.toArray();
        if (updatesToSync.length > 0) {
          console.log(`Syncing ${updatesToSync.length} updates...`);
          for (const update of updatesToSync) {
            try {
              const newUpdateRef = push(ref(firebaseDb, 'ASHA_updates'));
              await set(newUpdateRef, {
                patient_name: update.patient_name,
                doctor_name: update.doctor_name,
                patient_age: update.patient_age,
                patient_gender: update.patient_gender,
                notes: update.notes,
                prescriptionPhotoBase64: update.prescriptionPhotoBase64,
                status: update.status,
              });
              await localDb.asha_updates.delete(update.id);
              console.log(`Successfully synced and deleted update with id: ${update.id}`);
            } catch (error) {
              console.error('Error syncing update:', error);
            }
          }
        }
      }
    };

    // Check for connection changes
    window.addEventListener('online', syncData);

    // Initial sync check
    syncData();

    // Cleanup
    return () => {
      window.removeEventListener('online', syncData);
    };
  }, []);

  return null; // This is a service, it doesn't render anything
};

export default SyncService;
