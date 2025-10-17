'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, set, get, child } from 'firebase/database';
import styles from './register.module.css';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const collectionName = role === 'doctor' ? 'doctors' : 'ASHA_workers';
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, collectionName));
      const count = snapshot.exists() ? snapshot.size : 0;

      let newId;
      if (role === 'doctor') {
        newId = `D_${(count + 1).toString().padStart(3, '0')}`;
      } else {
        newId = `asha_${(count + 1).toString().padStart(3, '0')}`;
      }

      await set(ref(db, `${collectionName}/${newId}`), {
        uid: user.uid,
        docId: newId,
        email: user.email,
        name: name,
        role: role,
      });

      if (role === 'doctor') {
        router.push('/doctor-dashboard');
      } else {
        router.push('/asha-worker-dashboard');
      }
    } catch (error) {
      setError(error.message);
      console.error('Error registering user:', error);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleRegister} className={styles.form} autoComplete="off">
        <h2>Register</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        <button type="submit" className={styles.button}>Register</button>
        <button type="button" onClick={handleLogin} className={styles.secondaryButton}>Login</button>
      </form>
    </div>
  );
};

export default RegisterPage;
