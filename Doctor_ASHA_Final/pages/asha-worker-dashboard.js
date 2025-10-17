'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { db as localDb } from '../lib/db';
import AshaNavbar from '../components/AshaNavbar';
import styles from './asha-worker-dashboard.module.css';
import { FaUserMd, FaUser, FaRegClock, FaEye } from 'react-icons/fa';

const AshaWorkerDashboard = () => {
  const [userName, setUserName] = useState('');
  const [updates, setUpdates] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, 'ASHA_workers/' + user.uid);
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
    const syncAndFetchUpdates = async () => {
      // Fetch from local IndexedDB first
      const localUpdates = await localDb.asha_updates.toArray();
      setUpdates(localUpdates.reverse()); // Show newest first

      // Then, listen for real-time updates from Firebase
      const updatesRef = ref(db, 'ASHA_updates');
      onValue(updatesRef, (snapshot) => {
        const firebaseData = snapshot.val();
        if (firebaseData) {
          const firebaseUpdates = Object.keys(firebaseData).map(key => ({ ...firebaseData[key], id: key }));
          // A simple merge strategy: overwrite local with Firebase if IDs match
          const combinedUpdates = [...localUpdates];
          firebaseUpdates.forEach(fUpdate => {
            const localIndex = combinedUpdates.findIndex(lUpdate => lUpdate.id === fUpdate.id);
            if (localIndex > -1) {
              combinedUpdates[localIndex] = fUpdate;
            } else {
              combinedUpdates.push(fUpdate);
            }
          });
          setUpdates(combinedUpdates.sort((a, b) => b.id - a.id)); // Sort by ID descending
        }
      });
    };

    syncAndFetchUpdates();

  }, []);

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return styles.statusPending;
      case 'approved':
        return styles.statusApproved;
      default:
        return '';
    }
  };

  return (
    <>
      <AshaNavbar userName={userName} />
      <div className={styles.container}>
        <div className={styles.header}>
            <h1 className={styles.title}>Patient Updates</h1>
            <p className={styles.subtitle}>Review and manage patient submissions</p>
        </div>
        {updates.length > 0 ? (
            <div className={styles.updatesGrid}>
            {updates.map(update => (
                <div key={update.id} className={styles.updateCard}>
                <div className={styles.cardHeader}>
                    <h3><FaUser /> {update.patient_name}</h3>
                    <span className={`${styles.status} ${getStatusClass(update.status)}`}>{update.status}</span>
                </div>
                <p className={styles.doctorName}><FaUserMd /> Assigned to Dr. {update.doctor_name}</p>
                
                <div className={styles.cardFooter}>
                    <span className={styles.updateId}><FaRegClock /> ID: {update.id}</span>
                    <Link href={`/asha-updates/${update.id}`} passHref className={styles.viewDetailsLink}>
                        <button className={styles.viewDetailsBtn}><FaEye /> View Details</button>
                    </Link>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className={styles.noUpdatesMessage}>
                <p>No patient updates found.</p>
            </div>
        )}
      </div>
    </>
  );
};

export default AshaWorkerDashboard;
