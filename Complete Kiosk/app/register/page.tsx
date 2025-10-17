'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiEdit, FiCreditCard } from 'react-icons/fi';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get, child } from "firebase/database";
import { auth, db } from '../../firebase/config';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'en';

  const [registrationMethod, setRegistrationMethod] = useState<'manual' | 'aadhaar' | null>(null);

  // State for manual registration form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualSubmit = async () => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'users'));
        const newUserIdNumber = (snapshot.val() ? Object.keys(snapshot.val()).length : 0) + 1;
        const newUserId = `U_${String(newUserIdNumber).padStart(3, '0')}`;

        await set(ref(db, 'users/' + newUserId), {
            uid: user.uid,
            name: name,
            phone: phone,
            age: age,
            gender: gender,
            email: email
        });

        alert(`Registration successful for ${name} with User ID ${newUserId}!`);
        router.push(`/dashboard?lang=${lang}`);

    } catch (error: any) {
        setError(error.message);
    }
  };

  const handleAadhaarScan = () => {
    // Placeholder for Aadhaar scanning logic
    alert('Aadhaar card scanning is not implemented yet.');
  };

  return (
    <div className="outer-frame">
      <div className="kiosk-card" role="region" aria-label="Register">
        <div className="logo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h3l2-5 3 10 2-6h3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Register</h1>
        <p className="subtitle">Create your new health account</p>

        <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }} className={registrationMethod ? 'hidden' : ''}>
            <div className="option" tabIndex={0} onClick={() => setRegistrationMethod('manual')} style={{ textAlign: 'center' }}>
              <FiEdit size={28} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Manual Registration</div>
            </div>
            <div className="option" tabIndex={0} onClick={() => setRegistrationMethod('aadhaar')} style={{ textAlign: 'center' }}>
              <FiCreditCard size={28} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Register with Aadhaar</div>
            </div>
          </div>

          {registrationMethod === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="label">Enter your details</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input" />
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="input" />
              <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="input" />
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleManualSubmit} className="btn btn-primary full">Submit</button>
                <button onClick={() => setRegistrationMethod(null)} className="btn btn-outline">Back</button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {registrationMethod === 'aadhaar' && (
            <div style={{ textAlign: 'center' }}>
              <div className="label">Scan Aadhaar Card</div>
              <div className="aadhaar-box">
                <p className="muted">Hold your Aadhaar card here</p>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <button onClick={handleAadhaarScan} className="btn btn-primary">Scan</button>
                <button onClick={() => setRegistrationMethod(null)} className="btn btn-outline">Back</button>
              </div>
            </div>
          )}
        </div>

        <p className="footnote">Already have an account? <a href={`/login?lang=${lang}`} className="link-primary">Login here</a>.</p>
      </div>
    </div>
  );
}
