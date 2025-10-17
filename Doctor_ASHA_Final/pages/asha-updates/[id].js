'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db as localDb } from '../../lib/db';
import { db as firebaseDb, auth } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import AshaNavbar from '../../components/AshaNavbar';
import styles from './asha-updates.module.css';
import { FaUser, FaUserMd, FaBirthdayCake, FaVenusMars, FaStickyNote, FaCheckCircle, FaHourglassHalf, FaChartLine } from 'react-icons/fa';
import PatientAnalytics from '../../components/PatientAnalytics'; // Import the new component
import { onAuthStateChanged } from 'firebase/auth';

const AshaUpdateDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(''); 
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const userRef = ref(firebaseDb, 'ASHA_workers/' + user.uid);
          onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUserName(data?.name || user.email);
          });
        } else {
          router.push('/login');
        }
      });
      return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (id) {
      const fetchUpdate = async () => {
        try {
          let fetchedUpdate;
          // All updates are now fetched from Firebase RTDB
          const updateRef = ref(firebaseDb, `ASHA_updates/${id}`);
          onValue(updateRef, (snapshot) => {
            fetchedUpdate = snapshot.val();
            if (fetchedUpdate) {
                fetchedUpdate.id = snapshot.key;
                setUpdate(fetchedUpdate);
            }
            setLoading(false);
          });
        } catch (error) {
          console.error('Failed to fetch update:', error);
          setLoading(false);
        }
      };

      fetchUpdate();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!update) {
    return <div>Update not found.</div>;
  }

  const getStatusPill = (status) => {
    const currentStatus = status || 'Pending';
    const isPending = currentStatus.toLowerCase() === 'pending';
    const pillClass = isPending ? styles.statusPending : styles.statusApproved;
    const Icon = isPending ? FaHourglassHalf : FaCheckCircle;

    return (
        <span className={`${styles.statusPill} ${pillClass}`}>
            <Icon style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}/>
            {currentStatus}
        </span>
    );
  };

  return (
    <>
      <AshaNavbar userName={userName} />
      <div className={styles.container}>
        <div className={styles.detailsCard}>
          <div className={styles.patientInfo}>
            <h2 className={styles.title}>Patient Details</h2>
            <div className={styles.infoGrid}>
                <div className={styles.infoLabelWrapper}>
                    <FaUser className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Patient Name:</span>
                </div>
                <span className={styles.infoValue}>{update.patient_name}</span>

                <div className={styles.infoLabelWrapper}>
                    <FaUserMd className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Doctor Name:</span>
                </div>
                <span className={styles.infoValue}>{update.doctor_name}</span>

                <div className={styles.infoLabelWrapper}>
                    <FaBirthdayCake className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Age:</span>
                </div>
                <span className={styles.infoValue}>{update.patient_age}</span>

                <div className={styles.infoLabelWrapper}>
                    <FaVenusMars className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Gender:</span>
                </div>
                <span className={styles.infoValue}>{update.patient_gender}</span>

                <div className={styles.infoLabelWrapper}>
                    <FaStickyNote className={styles.infoIcon} />
                    <span className={styles.infoLabel}>Status:</span>
                </div>
                <div className={styles.infoValue}>{getStatusPill(update.status)}</div>
            </div>
            {update.notes && (
                <div className={styles.notesSection}>
                    <h3 className={styles.notesTitle}><FaStickyNote /> Notes</h3>
                    <p className={styles.notesContent}>{update.notes}</p>
                </div>
            )}
          </div>
          <div className={styles.prescriptionImageContainer}>
            <h3 className={styles.imageTitle}>Prescription Photo</h3>
            {update.prescriptionPhotoBase64 && <img src={update.prescriptionPhotoBase64} alt="Prescription" className={styles.prescriptionImage} />}
          </div>
        </div>
        <div className={styles.analyticsButtonContainer}>
            <button className={styles.analyticsButton} onClick={() => setShowAnalytics(!showAnalytics)}>
                <FaChartLine /> {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
            </button>
        </div>

        {showAnalytics && <PatientAnalytics patientId={update.patient_id} />}

      </div>
    </>
  );
};

export default AshaUpdateDetailsPage;
