
"use client";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

const PatientDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (id) {
      const db = getDatabase();
      const patientRef = ref(db, `doctors/${id}`);
      onValue(patientRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPatient(data);
        }
      });
    }
  }, [id]);

  if (!patient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Patient Details</h1>
      <p><strong>Name:</strong> {patient.name}</p>
      <p><strong>Email:</strong> {patient.email}</p>
      <p><strong>Phone:</strong> {patient.phone}</p>
      <p><strong>Gender:</strong> {patient.gender}</p>
    </div>
  );
};

export default PatientDetails;
