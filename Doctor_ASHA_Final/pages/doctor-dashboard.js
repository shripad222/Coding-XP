'use client';

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/router";
import { db } from "../lib/firebase"; // your Firebase config file
import styles from "../styles/dashboard.module.css"; // custom CSS module

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState("pending");
  const router = useRouter();

  useEffect(() => {
    const appointmentsRef = ref(db, "appointments");
    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setAppointments(list);
    });
  }, [db]);

  const filtered = appointments.filter((a) => a.status === view);

  const handleLogout = () => {
    router.push("/login");
  };

  const handleAshaUpdates = () => {
    router.push("/asha-workers");
  };

  return (
    <div className={styles.dashboard}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles["nav-left"]}>
          <h2>Doctor Dashboard</h2>
        </div>
        <div className={styles["nav-right"]}>
          <button className={styles["logout-btn"]} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Buttons */}
      <div className={styles.tabs}>
        <button
          className={view === "pending" ? styles.active : ""}
          onClick={() => setView("pending")}
        >
          Pending Appointments
        </button>
        <button
          className={view === "completed" ? styles.active : ""}
          onClick={() => setView("completed")}
        >
          Completed Appointments
        </button>
        <button
          className={styles["asha-btn"]}
          onClick={handleAshaUpdates}
        >
          ASHA Updates
        </button>
      </div>

      {/* Appointment List */}
      <div className={styles["appointments-container"]}>
        {filtered.length === 0 ? (
          <p className={styles["empty-msg"]}>No {view} appointments.</p>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.id}
              className={styles["appointment-card"]}
            >
              <h3>{apt.patient_name}</h3>
              <p>
                <strong>Department:</strong> {apt.department}
              </p>
              <p>
                <strong>Date:</strong> {apt.appointment_date} at{" "}
                {apt.appointment_time}
              </p>

              {view === "pending" && (
                <>
                  <button
                    className={styles["meeting-btn"]}
                    onClick={() => {
                      window.open(apt.meet_link, "_blank");
                    }}
                  >
                    Start Meeting
                  </button>
                  <button
                    className={styles["details-btn"]}
                    onClick={() => router.push(`/appointments/${apt.id}`)}
                  >
                    View Details
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}