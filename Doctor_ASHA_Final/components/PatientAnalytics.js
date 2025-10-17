'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db as firebaseDb } from '../lib/firebase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './PatientAnalytics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PatientAnalytics = ({ patientId }) => {
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      const vitalsRef = ref(firebaseDb, `vitals/${patientId}`);
      onValue(vitalsRef, (snapshot) => {
        const data = snapshot.val();
        setVitals(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching vitals:", error);
        setLoading(false);
      });
    }
  }, [patientId]);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  if (!vitals) {
    return <p>No vitals data found for this patient.</p>;
  }

  const chartData = (label, dataKey, borderColor, backgroundColor) => {
    const labels = Object.values(vitals).map(v => new Date(v.timestamp).toLocaleTimeString());
    const data = Object.values(vitals).map(v => v[dataKey]);
    return {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: borderColor || 'rgb(75, 192, 192)',
          backgroundColor: backgroundColor || 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
  };

  const options = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  });

  return (
    <div className={styles.analyticsContainer}>
      <h2 className={styles.title}>Patient Vitals Analytics</h2>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}><Line options={options('BMI Trend')} data={chartData('BMI', 'bmi')} /></div>
        <div className={styles.chartCard}><Line options={options('Heart Rate Trend')} data={chartData('Heart Rate', 'heartRate')} /></div>
        <div className={styles.chartCard}><Line options={options('Temperature Trend')} data={chartData('Temperature (°C)', 'temperature')} /></div>
        <div className={styles.chartCard}><Line options={options('Blood Sugar Trend')} data={chartData('Blood Sugar (mg/dL)', 'bloodSugar')} /></div>
        <div className={styles.chartCard}><Line options={options('Systolic Trend')} data={chartData('Systolic', 'systolic', 'rgb(255, 99, 132)', 'rgba(255, 99, 132, 0.5)')} /></div>
        <div className={styles.chartCard}><Line options={options('Diastolic Trend')} data={chartData('Diastolic', 'diastolic', 'rgb(54, 162, 235)', 'rgba(54, 162, 235, 0.5)')} /></div>
      </div>
    </div>
  );
};

export default PatientAnalytics;
