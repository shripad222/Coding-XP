// lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('sehatsathi');
db.version(1).stores({
  asha_updates: '++id, patient_name, doctor_name, patient_age, patient_gender, notes, prescriptionPhotoBase64, status',
});
