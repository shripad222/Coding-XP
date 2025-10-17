'use client';

import { useState, useEffect } from 'react';
import { useVitals } from '../VitalsContext';
import { FaTemperatureLow, FaHeartbeat, FaWeight } from 'react-icons/fa';
import { ImDroplet, ImMeter, ImMan } from 'react-icons/im';

const vitalSteps = [
  { name: 'Temperature', key: 'temperature', unit: '°C', instructions: 'Place your forehead near the temperature sensor. Keep still for accurate reading.', icon: <FaTemperatureLow /> },
  { name: 'Heart Rate', key: 'heartRate', unit: 'bpm', instructions: 'Place your finger on the sensor and hold it for 30 seconds.', icon: <FaHeartbeat /> },
  { name: 'Blood Pressure', key: ['systolic', 'diastolic'], unit: 'mmHg', instructions: 'Wrap the cuff around your arm and press start.', icon: <ImDroplet /> },
  { name: 'Blood Sugar', key: 'bloodSugar', unit: 'mg/dL', instructions: 'Insert the test strip into the glucometer and apply a blood sample.', icon: <ImMeter /> },
  { name: 'BMI', key: 'bmi', unit: '', instructions: 'Stand on the scale and wait for the measurement to complete.', icon: <FaWeight /> },
];

export default function Measure() {
  const { vitals, setVitals, step, setStep } = useVitals();
  const [isMeasuring, setIsMeasuring] = useState(false);

  const currentVital = vitalSteps[step - 1];

  const generateVital = () => {
    setIsMeasuring(true);
    setTimeout(() => {
      const newVitals = { ...vitals } as any;
      if (Array.isArray(currentVital.key)) {
        newVitals.systolic = Math.floor(90 + Math.random() * 100);
        newVitals.diastolic = Math.floor(60 + Math.random() * 50);
      } else if (currentVital.key === 'temperature' || currentVital.key === 'bmi') {
        const value = currentVital.key === 'temperature' ? 36 + Math.random() * 3 : 17 + Math.random() * 10;
        // store as a number with one decimal
        newVitals[currentVital.key] = Math.round(value * 10) / 10;
      } else {
        const value = currentVital.key === 'heartRate' ? 50 + Math.random() * 80 : 60 + Math.random() * 100;
        newVitals[currentVital.key] = Math.floor(value);
      }
      setVitals(newVitals);
      setIsMeasuring(false);
    }, 2000);
  };

  return (
    <div className="kiosk-card">
      <div className="text-center mb-8">
        <div className="inline-block bg-primary text-white rounded-full p-3 shadow-lg text-3xl">
          {currentVital.icon}
        </div>
        <h2 className="text-2xl font-bold mt-4">Measuring {currentVital.name}</h2>
        <p className="text-text-light">Please wait while we capture your vitals</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Progress</span>
          <span className="text-sm font-semibold">{step} of {vitalSteps.length}</span>
        </div>
        <div className="w-full bg-bg-dark rounded-full h-3">
          <div className="bg-secondary h-3 rounded-full" style={{ width: `${(step / vitalSteps.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="bg-bg-light p-4 rounded-lg mb-6">
        <p className="font-bold mb-2">Instructions:</p>
        <p className="text-text-light text-sm">{currentVital.instructions}</p>
      </div>

      <button onClick={generateVital} className="btn btn-danger w-full mb-4" disabled={isMeasuring}>
        {isMeasuring ? 'Measuring...' : `Capture ${currentVital.name}`}
      </button>

      <button onClick={() => setStep(step + 1)} className="btn btn-primary w-full">
        Next
      </button>
    </div>
  );
}
