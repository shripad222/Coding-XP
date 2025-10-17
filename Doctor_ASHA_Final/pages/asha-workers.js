'use client';

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import styles from "../styles/asha-workers.module.css";

export default function AshaWorkers() {
  const [ashaWorkers, setAshaWorkers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const ashaWorkersRef = ref(db, "ASHA_workers");
    onValue(ashaWorkersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setAshaWorkers(list);
    });
  }, []);

  const handleViewDetails = (id) => {
    router.push(`/asha-updates`);
  };

  return (
    <div className={styles.container}>
      <h1>ASHA Workers</h1>
      <div className={styles.workerList}>
        {ashaWorkers.length === 0 ? (
          <p>No ASHA workers found.</p>
        ) : (
          ashaWorkers.map((worker) => (
            <div key={worker.id} className={styles.workerCard}>
              <h3>{worker.name}</h3>
              <p>
                <strong>Email:</strong> {worker.email}
              </p>
              <p>
                <strong>Location:</strong> {worker.location || "N/A"}
              </p>
              <button onClick={() => handleViewDetails(worker.id)}>
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
