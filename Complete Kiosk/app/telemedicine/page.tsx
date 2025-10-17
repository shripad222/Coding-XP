'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ref, get, set, child } from 'firebase/database';
import { db } from '../../firebase/config';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UserData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  uid: string;
}

export default function TelemedicinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0); // 0: smartphone check, 1: appointment form, 2: confirmation
  const [hasSmartphone, setHasSmartphone] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    department: '',
    notes: ''
  });
  const [scheduledDateTime, setScheduledDateTime] = useState<{date: string, time: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Get user ID from URL params or auth
  const getCurrentUserId = () => {
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl) return userIdFromUrl;
    // For now, return a default user ID for testing
    return 'U_001';
  };

  // Check speech recognition support and load user data
  useEffect(() => {
    const loadUserData = async () => {
      const userId = getCurrentUserId();
      if (!userId) return;

      try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user information');
      }
    };

    // Check if speech recognition is supported
    console.log('Checking speech recognition support...');
    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    console.log('SpeechRecognition available:', 'SpeechRecognition' in window);
    console.log('Window object:', typeof window);
    console.log('Is secure context:', window.isSecureContext);
    
    // Check for speech recognition support
    const hasWebkitSpeech = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;
    const hasSpeech = typeof window !== 'undefined' && 'SpeechRecognition' in window;
    
    if (hasWebkitSpeech || hasSpeech) {
      setSpeechSupported(true);
      console.log('Speech recognition is supported');
    } else {
      console.log('Speech recognition is NOT supported');
      console.log('This might be due to:');
      console.log('1. Not using HTTPS (required for microphone access)');
      console.log('2. Browser not supporting Web Speech API');
      console.log('3. Development environment limitations');
      
      // Enable for testing even if not detected
      setSpeechSupported(true);
    }

    loadUserData();
  }, []);

  const departments = [
    'Cardiology',
    'Orthopedics', 
    'Dermatology',
    'ENT',
    'General Medicine',
    'Pediatrics',
    'Gynecology'
  ];

  // Function to get the next available appointment time
  const getNextAvailableSlot = async () => {
    try {
      const appointmentsRef = ref(db, 'appointments');
      const snapshot = await get(appointmentsRef);
      
      if (!snapshot.exists()) {
        // No appointments exist, start from 9:00 AM tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          date: tomorrow.toISOString().split('T')[0],
          time: '09:00 AM'
        };
      }

      const appointments = snapshot.val();
      let latestDateTime = new Date('1900-01-01 00:00:00');
      let latestAppointment = null;

      // Find the latest appointment
      for (const [aptId, aptDataRaw] of Object.entries(appointments)) {
        const aptData = aptDataRaw as { appointment_date: string; appointment_time: string };
        const aptDateTime = `${aptData.appointment_date} ${aptData.appointment_time}`;
        const aptDate = new Date(aptDateTime);

        if (aptDate > latestDateTime) {
          latestDateTime = aptDate;
          latestAppointment = { ...aptData };
        }
      }

      if (latestAppointment == null) {
        // Fallback if no appointments found
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          date: tomorrow.toISOString().split('T')[0],
          time: '09:00 AM'
        };
      }

      // Add 30 minutes to the latest appointment
      const nextSlot = new Date(latestDateTime.getTime() + (30 * 60 * 1000));
      
      // Check if we need to move to next day (after 6:00 PM)
      if (nextSlot.getHours() >= 18) {
        nextSlot.setDate(nextSlot.getDate() + 1);
        nextSlot.setHours(9, 0, 0, 0); // Start at 9:00 AM next day
      }

      // Format time
      const hours = nextSlot.getHours();
      const minutes = nextSlot.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

      return {
        date: nextSlot.toISOString().split('T')[0],
        time: timeString
      };
    } catch (error) {
      console.error('Error calculating next slot:', error);
      // Fallback to tomorrow 9:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00 AM'
      };
    }
  };

  const handleSmartphoneChoice = async (choice: boolean) => {
    setHasSmartphone(choice);
    setStep(1);
    
    // Calculate next available slot when user proceeds to booking
    const nextSlot = await getNextAvailableSlot();
    setScheduledDateTime(nextSlot);
  };

  const handleAppointmentSubmit = async () => {
    if (!appointmentData.department) {
      setError('Please select a department');
      return;
    }

    if (!scheduledDateTime) {
      setError('Unable to schedule appointment. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate new appointment ID
      const appointmentsRef = ref(db, 'appointments');
      const snapshot = await get(appointmentsRef);
      const newAptNumber = (snapshot.val() ? Object.keys(snapshot.val()).length : 0) + 1;
      const newAptId = `apt_${String(newAptNumber).padStart(3, '0')}`;

      // Create appointment data
      const aptData = {
        appointment_date: scheduledDateTime.date,
        appointment_time: scheduledDateTime.time,
        created_at: new Date().toISOString(),
        department: appointmentData.department,
        doctor_name: `Dr. ${getDoctorName(appointmentData.department)}`,
        meet_link: "https://meet.google.com/qsg-khvx-tox", // Static for prototype
        notes: appointmentData.notes,
        patient_age: parseInt(userData?.age || '0'),
        patient_gender: userData?.gender || '',
        patient_id: getCurrentUserId(),
        patient_name: userData?.name || '',
        status: 'pending'
      };

      // Save appointment
      const newAppointmentRef = ref(db, `appointments/${newAptId}`);
      await set(newAppointmentRef, aptData);

      setStep(2);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDoctorName = (department: string) => {
    const doctors: { [key: string]: string } = {
      'Cardiology': 'Neha Sharma',
      'Orthopedics': 'Rajiv Kapoor',
      'Dermatology': 'Priya Menon',
      'ENT': 'Arjun Bhatia',
      'General Medicine': 'Amit Kumar',
      'Pediatrics': 'Sushma Patel',
      'Gynecology': 'Rekha Singh'
    };
    return doctors[department] || 'General Doctor';
  };

  const handleDownloadQRTicket = async () => {
    if (!scheduledDateTime || !userData || !appointmentData.department) {
      setError('Missing appointment information for QR ticket');
      return;
    }

    try {
      const doc = new jsPDF();
      const userId = getCurrentUserId();

      // Generate QR code with user ID
      const qrDataURL = await QRCode.toDataURL(userId, {
        width: 100,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Header
      doc.setFontSize(20);
      doc.text('Telemedicine Appointment Ticket', 14, 20);

      // QR Code
      doc.addImage(qrDataURL, 'PNG', 14, 30, 40, 40);

      // User ID next to QR code
      doc.setFontSize(12);
      doc.text(`User ID: ${userId}`, 60, 45);

      // Appointment Details
      doc.setFontSize(16);
      doc.text('Appointment Details', 14, 85);

      doc.setFontSize(12);
      const details = [
        `Patient Name: ${userData.name}`,
        `Age: ${userData.age} years`,
        `Gender: ${userData.gender}`,
        `Department: ${appointmentData.department}`,
        `Doctor: Dr. ${getDoctorName(appointmentData.department)}`,
        `Date: ${scheduledDateTime.date}`,
        `Time: ${scheduledDateTime.time}`,
        `Meeting Link: https://meet.google.com/qsg-khvx-tox`
      ];

      let y = 95;
      details.forEach((detail) => {
        doc.text(detail, 14, y);
        y += 7;
      });

      // Notes if available
      if (appointmentData.notes) {
        y += 5;
        doc.text('Notes:', 14, y);
        y += 7;
        const notes = doc.splitTextToSize(appointmentData.notes, 180);
        doc.text(notes, 14, y);
      }

      // Footer
      doc.setFontSize(10);
      doc.text('Keep this ticket for your appointment. Show QR code at check-in.', 14, doc.internal.pageSize.height - 20);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 15);

      // Download
      const filename = `telemedicine_ticket_${userId}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating QR ticket:', error);
      setError('Failed to generate QR ticket. Please try again.');
    }
  };

  const startVoiceRecognition = () => {
    console.log('Attempting to start voice recognition...');
    
    // Check if we're in a secure context (HTTPS)
    if (!window.isSecureContext) {
      setError('Voice input requires HTTPS. Please use a secure connection.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not available in your browser. Please try typing your notes instead.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      setError('');

      recognition.onstart = () => {
        console.log('Voice recognition started successfully');
      };

      recognition.onresult = (event) => {
        console.log('Voice recognition result:', event.results);
        const transcript = event.results[0][0].transcript;
        console.log('Transcribed text:', transcript);
        setAppointmentData(prev => ({
          ...prev,
          notes: prev.notes + (prev.notes ? ' ' : '') + transcript
        }));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please speak clearly and try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Voice recognition failed: ${event.error}. Please try typing your notes instead.`);
        }
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setError('Failed to initialize voice recognition. Please try typing your notes instead.');
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    setIsListening(false);
  };

  if (step === 0) {
    return (
      <div className="outer-frame">
        <div className="kiosk-card">
          <h1>Telemedicine Consultation</h1>
          <p className="subtitle">Book an online consultation with our doctors</p>
          
          <div className="section" style={{ marginTop: '30px' }}>
            <div className="label">Do you have a smartphone or device with camera?</div>
            <div className="option-grid">
              <div className="option" onClick={() => handleSmartphoneChoice(true)}>
                <span className="icon">📱</span>
                <strong>Yes, I have a smartphone</strong>
              </div>
              <div className="option" onClick={() => handleSmartphoneChoice(false)}>
                <span className="icon">❌</span>
                <strong>No smartphone available</strong>
              </div>
            </div>
          </div>

          <button onClick={() => router.back()} className="btn btn-outline w-full mt-6">
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="outer-frame">
        <div className="kiosk-card">
          <h1>Book Appointment</h1>
          <p className="subtitle">Fill in the details for your telemedicine consultation</p>
          
          {hasSmartphone === false && (
            <div className="alert alert-warning mb-4">
              <strong>Note:</strong> A smartphone or device with camera is recommended for the best consultation experience.
            </div>
          )}

          <div className="section">
            {scheduledDateTime && (
              <div className="scheduled-time-info" style={{ 
                backgroundColor: '#f0f9ff', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #0ea5e9'
              }}>
                <h3 style={{ color: '#0c4a6e', marginBottom: '8px' }}>📅 Your Scheduled Time</h3>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0c4a6e' }}>
                  {new Date(scheduledDateTime.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {scheduledDateTime.time}
                </p>
                <p style={{ fontSize: '14px', color: '#0369a1', marginTop: '4px' }}>
                  This time slot has been automatically reserved for you
                </p>
              </div>
            )}

            <div className="form-grid">
              <div className="label">Select Department</div>
              <select 
                value={appointmentData.department}
                onChange={(e) => setAppointmentData({...appointmentData, department: e.target.value})}
                className="input"
                required
              >
                <option value="">Choose Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <div className="label">Notes (Optional)</div>
              <div style={{ position: 'relative' }}>
                <textarea 
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                  placeholder="Describe your symptoms or concerns... or click the microphone to speak"
                  className="input"
                  rows={3}
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '8px',
                    background: isListening ? '#ef4444' : '#3b82f6',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 10
                  }}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? '⏹️' : '🎤'}
                </button>
              </div>
              {isListening && (
                <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
                  🎤 Listening... Speak now
                </p>
              )}
              {!speechSupported && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Note: Voice input may not be supported in your browser
                </p>
              )}


              {error && <p className="error-message">{error}</p>}

              <button 
                onClick={handleAppointmentSubmit}
                disabled={isLoading || !scheduledDateTime}
                className="btn btn-primary full"
              >
                {isLoading ? 'Booking...' : 'Confirm Appointment'}
              </button>

              <button 
                onClick={() => setStep(0)}
                className="btn btn-outline full"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="outer-frame">
        <div className="kiosk-card">
          <h1>Appointment Booked!</h1>
          <div className="text-center">
            <div className="success-icon" style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <p className="subtitle">Your telemedicine appointment has been successfully booked</p>
            
            <div className="appointment-details" style={{ textAlign: 'left', marginTop: '30px' }}>
              <h3>Appointment Details:</h3>
              <div className="space-y-2">
                <p><strong>Patient:</strong> {userData?.name}</p>
                <p><strong>Department:</strong> {appointmentData.department}</p>
                <p><strong>Doctor:</strong> Dr. {getDoctorName(appointmentData.department)}</p>
                <p><strong>Date:</strong> {scheduledDateTime?.date}</p>
                <p><strong>Time:</strong> {scheduledDateTime?.time}</p>
                <p><strong>Meeting Link:</strong> <a href="https://meet.google.com/qsg-khvx-tox" target="_blank" rel="noopener noreferrer" className="text-blue-500">Join Meeting</a></p>
                {appointmentData.notes && <p><strong>Notes:</strong> {appointmentData.notes}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDownloadQRTicket}
                className="btn btn-primary flex-1"
              >
                📱 Download QR Ticket
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="btn btn-outline flex-1"
              >
                Back to Dashboard
              </button>
            </div>
            
            <div className="flex gap-3 mt-3">
              <button 
                onClick={() => router.push('/vitals')}
                className="btn btn-outline flex-1"
              >
                New Vitals Check
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
