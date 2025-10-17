'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import styles from './login.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const dbRef = ref(db, `${role === 'doctor' ? 'doctors' : 'ASHA_workers'}/${user.uid}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        if (role === 'doctor') {
          router.push('/doctor-dashboard');
        } else {
          router.push('/asha-worker-dashboard');
        }
      } else {
        await signOut(auth);
        setError(`User is not registered as a ${role.replace('_', ' ')}.`);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error logging in:', error);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form} autoComplete="off">
        <h2>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="doctor"
              checked={role === 'doctor'}
              onChange={() => setRole('doctor')}
            />
            <span className={styles.radioCheckmark}></span>
            Doctor
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="asha_worker"
              checked={role === 'asha_worker'}
              onChange={() => setRole('asha_worker')}
            />
            <span className={styles.radioCheckmark}></span>
            ASHA Worker
          </label>
        </div>
        <button type="submit" className={styles.button}>Login</button>
        <button type="button" onClick={handleRegister} className={styles.secondaryButton}>Register</button>
      </form>
    </div>
  );
};

export default LoginPage;
