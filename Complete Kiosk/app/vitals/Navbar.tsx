'use client';

import { useVitals } from './VitalsContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { startMeasurement } = useVitals();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleMedication = () => {
    router.push('/dashboard/medications');
  };

  return (
    <nav className="app-nav">
      <div className="nav-left">
        <h1 className="nav-title">Health Dashboard</h1>
      </div>
    <div className="nav-right">
  <button onClick={startMeasurement} className="btn btn-primary nav-btn">Measure Your Vitals</button>
  <button onClick={handleLogout} className="btn btn-danger nav-btn">Logout</button>
    </div>
    </nav>
  );
}
