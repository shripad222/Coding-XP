'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { db as localDb } from '../lib/db';
import styles from './add-patient.module.css';
import AshaNavbar from '../components/AshaNavbar';
import { FaUser, FaUserMd, FaBirthdayCake, FaVenusMars, FaStickyNote, FaUpload, FaCalendarAlt, FaClock, FaBuilding } from 'react-icons/fa';

const AddPatientPage = () => {
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('male');
  const [notes, setNotes] = useState('');
  const [prescriptionPhoto, setPrescriptionPhoto] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, 'ASHA_workers/' + user.uid);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.name) {
            setUserName(data.name);
          } else {
            setUserName(user.email); // Fallback to email
          }
        });
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPrescriptionPhoto(e.target.files[0]);
    }
  };

  const formatTimeToAMPM = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prescriptionPhoto) {
      alert('Please upload a prescription photo.');
      return;
    }
    setSubmitting(true);

    const reader = new FileReader();
    reader.readAsDataURL(prescriptionPhoto);

    reader.onloadend = async () => {
      try {
        const base64String = reader.result;
        await localDb.asha_updates.add({
          patient_name: patientName,
          doctor_name: doctorName,
          patient_age: patientAge,
          patient_gender: patientGender,
          notes: notes,
          prescriptionPhotoBase64: base64String,
          appointment_date: appointmentDate,
          appointment_time: formatTimeToAMPM(appointmentTime),
          department: department,
          created_at: new Date().toISOString(),
          status: 'pending'
        });
        alert('Patient data saved locally. It will be synced with the server when you are online.');
        router.push('/asha-worker-dashboard');
      } catch (error) {
        console.error('Error saving patient data locally:', error);
        alert('Failed to save patient data. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    reader.onerror = (error) => {
      console.error('Error converting file to base64:', error);
      setSubmitting(false);
      alert('Failed to process image. Please try again.');
    };
  };

  return (
    <>
      <AshaNavbar userName={userName} />
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Add New Patient</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <FaUser />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <FaUserMd />
                <input
                  type="text"
                  placeholder="Doctor Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <FaBirthdayCake />
                <input
                  type="number"
                  placeholder="Patient Age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <FaVenusMars />
                <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} required className={styles.formSelect}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
                <div className={styles.inputGroup}>
                    <FaBuilding />
                    <input
                    type="text"
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className={styles.formInput}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <FaCalendarAlt />
                    <input
                    type="date"
                    placeholder="Appointment Date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    className={styles.formInput}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <FaClock />
                    <input
                    type="time"
                    placeholder="Appointment Time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                    className={styles.formInput}
                    />
                </div>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <FaStickyNote style={{top: '24px', transform: 'none'}} />
                <textarea
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>
              <div className={styles.fullWidth}>
                <div className={styles.fileInputWrapper}>
                  <input type="file" id="prescriptionPhoto" onChange={handleFileChange} required className={styles.fileInput} />
                  <label htmlFor="prescriptionPhoto" className={styles.fileInputLabel}>
                    <FaUpload />
                    <span>{prescriptionPhoto ? prescriptionPhoto.name : 'Upload Prescription Photo'}</span>
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Submitting...' : 'Add Patient'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddPatientPage;