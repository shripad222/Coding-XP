import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import styles from './asha-updates.module.css';

const AshaUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const updatesRef = ref(db, 'ASHA_updates');
    onValue(updatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const updatesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUpdates(updatesList);
      } else {
        setUpdates([]);
      }
      setLoading(false);
    });
  }, []);

  const handleViewDetails = (id) => {
    router.push(`/asha-updates/${id}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ASHA Updates</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.updatesGrid}>
          {updates.map(update => (
            <div key={update.id} className={styles.updateCard}>
              <h2>{update.patient_name}</h2>
              <p><strong>Doctor:</strong> {update.doctor_name}</p>
              <p><strong>Department:</strong> {update.department}</p>
              <p><strong>Date:</strong> {update.appointment_date} at {update.appointment_time}</p>
              <p><strong>Status:</strong> <span className={`${styles.status} ${styles[update.status]}`}>{update.status}</span></p>
              <button onClick={() => handleViewDetails(update.id)} className={styles.viewDetailsBtn}>View Details</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AshaUpdates;
