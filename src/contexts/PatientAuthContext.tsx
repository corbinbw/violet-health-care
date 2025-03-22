'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface PatientAuthContextType {
  patient: any;
  loginAsPatient: (email: string, password: string) => Promise<void>;
  registerPatient: (email: string, password: string, name: string) => Promise<void>;
  logoutPatient: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export function PatientAuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if this user is a patient
        const patientDoc = await getDoc(doc(db, 'patients', user.uid));
        if (patientDoc.exists()) {
          setPatient({ ...user, ...patientDoc.data() });
        } else {
          setPatient(null);
        }
      } else {
        setPatient(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginAsPatient = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const patientDoc = await getDoc(doc(db, 'patients', userCredential.user.uid));
    if (!patientDoc.exists()) {
      await signOut(auth);
      throw new Error('Not a patient account');
    }
  };

  const registerPatient = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'patients', userCredential.user.uid), {
      name,
      email,
      type: 'patient',
      createdAt: new Date().toISOString()
    });
  };

  const logoutPatient = async () => {
    await signOut(auth);
  };

  return (
    <PatientAuthContext.Provider value={{ patient, loginAsPatient, registerPatient, logoutPatient }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
}; 