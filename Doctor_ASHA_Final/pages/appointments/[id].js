'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import styles from "./AppointmentDetails.module.css";
import dynamic from 'next/dynamic';

const PatientAnalytics = dynamic(() => import('../../components/PatientAnalytics'), {
  ssr: false
});

export default function AppointmentDetails() {
  const [appointment, setAppointment] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [prescription, setPrescription] = useState(null);
  const [showOldPrescriptions, setShowOldPrescriptions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      const appointmentRef = ref(db, `appointments/${id}`);
      onValue(appointmentRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAppointment({ id, ...data });
          setNotes(data.notes || "");
          setStatus(data.status || "pending");
        }
      });
    }
  }, [id]);

  const handleSaveNotes = async () => {
    if (id) {
      const appointmentRef = ref(db, `appointments/${id}`);
      await update(appointmentRef, { 
        notes: notes,
        status: status 
      });
      alert("Notes and status saved successfully!");
    }
  };

  const handleUploadPrescription = () => {
    if (id && prescription) {
      const reader = new FileReader();
      reader.readAsDataURL(prescription);
      reader.onloadend = async () => {
        const base64String = reader.result;
        const appointmentRef = ref(db, `appointments/${id}`);
        const existingPrescriptions = appointment.prescriptions_field || {};
        const newIndex = Object.keys(existingPrescriptions).length;
        const updatedPrescriptions = {
          ...existingPrescriptions,
          [newIndex]: base64String,
        };

        await update(appointmentRef, {
          prescriptions_field: updatedPrescriptions,
          prescriptionImage: base64String,
        });
        alert("Prescription uploaded successfully!");
      };
      reader.onerror = (error) => {
        console.error("Error converting file to base64:", error);
        alert("Failed to upload prescription.");
      };
    }
  };

  const handleViewOldPrescriptions = () => {
    if (appointment && appointment.prescriptions_field) {
      setShowOldPrescriptions(true);
    } else {
      alert("No old prescriptions found.");
    }
  };

  if (!appointment) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
      <h1>Appointment Details</h1>
      <div className={styles.details}>
        <p>
          <strong>Patient:</strong> {appointment.patient_name}
        </p>
        <p>
          <strong>Department:</strong> {appointment.department}
        </p>
        <p>
          <strong>Date:</strong> {appointment.appointment_date} at{" "}
          {appointment.appointment_time}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className={styles.statusSelect}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </p>
        <div className={styles.notes}>
          <h3>Notes</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={handleSaveNotes}>Save Notes</button>
        </div>
      </div>
      <div className={styles.actions}>
        <h3>Prescription</h3>
        {appointment.prescriptionImage && (
          <div className={styles.prescriptionImage}>
            <img src={appointment.prescriptionImage} alt="Prescription" />
          </div>
        )}
        <input type="file" onChange={(e) => setPrescription(e.target.files[0])} />
        <button onClick={handleUploadPrescription}>Upload Prescription</button>
        <button onClick={handleViewOldPrescriptions}>View Old Prescriptions</button>
      </div>

      {showOldPrescriptions && appointment && appointment.prescriptions_field && (
        <div className={styles.oldPrescriptions}>
          <h3>Old Prescriptions</h3>
          {Object.values(appointment.prescriptions_field).map((p, index) => (
            <div key={index} className={styles.prescriptionImage}>
              <img src={p} alt={`Old Prescription ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
      
      </div>

      <div className={styles.analyticsOutside}>
        <button className={styles.analyticsBtn} onClick={() => setShowAnalytics(!showAnalytics)}>
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
        {showAnalytics && (
          <div className={styles.analyticsInline}>
            <PatientAnalytics patientId={appointment.patient_id} />
          </div>
        )}
      </div>
    </div>
  );
}
