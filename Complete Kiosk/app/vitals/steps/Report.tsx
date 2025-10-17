'use client';

import { useVitals } from '../VitalsContext';
import { FaTemperatureLow, FaHeartbeat, FaWeight } from 'react-icons/fa';
import { ImDroplet, ImMeter, ImMan } from 'react-icons/im';

const VitalCard = ({ icon, label, value, unit, color, iconColor }) => (
  <div className={`rounded-2xl p-6 flex items-center shadow-lg transition-transform transform hover:-translate-y-1`} style={{ backgroundColor: color }}>
    <div className={`mr-6 text-4xl ${iconColor}`}>{icon}</div>
    <div>
      <div className="text-md font-bold text-gray-700">{label}</div>
      <div className="text-3xl font-extrabold text-gray-900">{value} <span className="text-xl font-semibold">{unit}</span></div>
    </div>
  </div>
);

export default function Report() {
  const { vitals, setStep } = useVitals();

  const vitalsData = [
    { icon: <FaTemperatureLow />, label: 'Temperature', value: vitals.temperature, unit: '°C', color: '#FFF4F4', iconColor: 'text-red-500' },
    { icon: <FaHeartbeat />, label: 'Heart Rate', value: vitals.heartRate, unit: 'bpm', color: '#FFF1F8', iconColor: 'text-pink-500' },
    { icon: <FaWeight />, label: 'BMI', value: vitals.bmi, unit: '', color: '#F8F5FF', iconColor: 'text-purple-500' },
    { icon: <ImDroplet />, label: 'Blood Pressure', value: `${vitals.systolic}/${vitals.diastolic}`, unit: 'mmHg', color: '#F4F9FF', iconColor: 'text-blue-500' },
    { icon: <ImMeter />, label: 'Blood Sugar', value: vitals.bloodSugar, unit: 'mg/dL', color: '#F0FAFE', iconColor: 'text-cyan-500' },
    { icon: <ImMan />, label: 'Height', value: "5'6\"", unit: '', color: '#F3FEF7', iconColor: 'text-green-500' },
  ];

  return (
    <div className="kiosk-card" style={{ maxWidth: '720px' }}>
      <div className="text-center mb-10">
        <div className="inline-block bg-green-100 text-green-500 rounded-full p-4 shadow-lg">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold mt-4">Vitals Captured Successfully!</h1>
        <p className="text-gray-500">Review your measurements below</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {vitalsData.map((vital, index) => (
          <VitalCard key={index} {...vital} />
        ))}
      </div>

      <div className="text-center mt-10">
        <button onClick={() => setStep(1)} className="btn btn-primary px-8 py-3 text-lg">
          Done
        </button>
      </div>
    </div>
  );
}
