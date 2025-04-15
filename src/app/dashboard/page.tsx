'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, arrayUnion, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface Patient {
  id: string;
  name: string;
  email?: string;
  assignedDoctors?: string[];
  doctorNames?: string[];
  hasUnreadMessages?: boolean;
}

interface Appointment {
  id?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  date: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  notes?: string;
  createdAt?: string;
  status?: string;
}

interface DoctorNote {
  id?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  date: string;
  createdAt?: string;
}

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (email: string, name: string, password: string) => Promise<void>;
  error?: string;
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
  onChat: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

interface EmptyStateProps {
  onAddPatient: () => void;
}

const PatientCard = ({ patient, onViewDetails, onChat, onDelete }: PatientCardProps) => {
  const initial = patient.name[0].toUpperCase();
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-purple-100"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
          <span className="text-xl font-semibold text-violet-600">{initial}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>
          </div>
          <p className="text-sm text-gray-500">{patient.email}</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(patient)}
          className="flex-1 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-md hover:bg-violet-100 transition-colors"
        >
          View Patient Details
        </button>
        <button
          onClick={() => onChat(patient)}
          className="p-2 text-violet-600 bg-violet-50 rounded-md hover:bg-violet-100 transition-colors relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          {patient.hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => onDelete(patient)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ onAddPatient }: EmptyStateProps) => (
  <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-6 bg-violet-100 rounded-full flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-violet-600" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients yet</h3>
    <p className="text-gray-500 mb-6">Get started by adding your first patient</p>
    <button
      onClick={onAddPatient}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      Add Your First Patient
    </button>
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-purple-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100"></div>
          <div className="flex-1">
            <div className="h-4 bg-violet-100 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-violet-50 rounded w-1/2"></div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-8 bg-violet-50 rounded-md"></div>
          <div className="w-8 h-8 bg-violet-50 rounded-md"></div>
          <div className="w-8 h-8 bg-violet-50 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

const AddPatientModal = ({ isOpen, onClose, onAddPatient, error }: AddPatientModalProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !name.trim() || !password) {
      setLocalError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await onAddPatient(email.trim(), name.trim(), password);
      setEmail('');
      setName('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: unknown) {
      console.error('Error:', error);
      setLocalError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-violet-900">Add New Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-violet-900 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-violet-900 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="patient@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-violet-900 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-violet-900 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    date: '',
    notes: ''
  });
  const [newNote, setNewNote] = useState<Partial<DoctorNote>>({
    diagnosis: '',
    treatment: ''
  });
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [searchError, setSearchError] = useState('');

  const fetchPatients = async () => {
    if (!user) return;
    
    try {
      // Get all patients where this doctor is assigned
      const q = query(
        collection(db, 'patients'),
        where('assignedDoctors', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const patientList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unknown Patient',
          email: data.email,
          assignedDoctors: data.assignedDoctors || []
        };
      });
      
      setPatients(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of patients
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPatients();
  }, [user, router, fetchPatients]);

  // Periodic refresh of patients
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchPatients();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user, fetchPatients]);

  // Add real-time listeners for appointments and notes
  useEffect(() => {
    if (!user || !selectedPatient) return;

    console.log('Setting up real-time listeners for patient:', selectedPatient.id);

    // Listen for appointments in real-time
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', selectedPatient.id),
      orderBy('date', 'desc')
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      console.log('Appointments snapshot received:', snapshot.docs.length, 'appointments');
      const appointmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(appointmentsList);
    }, (error) => {
      console.error('Error in appointments listener:', error);
    });

    // Listen for doctor notes in real-time
    const notesQuery = query(
      collection(db, 'doctorNotes'),
      where('patientId', '==', selectedPatient.id),
      orderBy('date', 'desc')
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      console.log('Notes snapshot received:', snapshot.docs.length, 'notes');
      const notesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoctorNote[];
      setDoctorNotes(notesList);
    }, (error) => {
      console.error('Error in notes listener:', error);
    });

    // Cleanup listeners
    return () => {
      console.log('Cleaning up listeners');
      unsubscribeAppointments();
      unsubscribeNotes();
    };
  }, [user, selectedPatient]);

  const fetchPatientDetails = async (patient: Patient) => {
    setLoadingPatientDetails(true);
    try {
      setSelectedPatient(patient);
      setShowPatientDetails(true);
      
      // Initial fetch of appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patient.id),
        orderBy('date', 'desc')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(appointmentsList);

      // Initial fetch of doctor notes
      const notesQuery = query(
        collection(db, 'doctorNotes'),
        where('patientId', '==', patient.id),
        orderBy('date', 'desc')
      );
      
      const notesSnapshot = await getDocs(notesQuery);
      const notesList = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoctorNote[];
      setDoctorNotes(notesList);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const searchAndAddPatient = async () => {
    if (!user || !newPatientEmail.trim()) return;
    setSearchError('');
    
    try {
      // Search for existing patient by email
      const patientQuery = query(
        collection(db, 'patients'),
        where('email', '==', newPatientEmail.trim().toLowerCase())
      );
      
      const patientSnapshot = await getDocs(patientQuery);
      
      if (!patientSnapshot.empty) {
        // Patient exists, link them to the doctor
        const patientDoc = patientSnapshot.docs[0];
        const patientData = patientDoc.data();
        
        // Check if patient is already linked to this doctor
        if (patientData.assignedDoctors?.includes(user.uid)) {
          setSearchError('This patient is already in your care');
          return;
        }
        
        // Add doctor to patient's assignedDoctors array
        await updateDoc(doc(db, 'patients', patientDoc.id), {
          assignedDoctors: arrayUnion(user.uid)
        });
        
        // Refresh patient list
        const updatedPatients = [...patients, {
          id: patientDoc.id,
          name: patientData.name,
          email: patientData.email
        }];
        setPatients(updatedPatients);
        setNewPatientEmail('');
        setShowAddPatient(false);
      } else {
        // Patient doesn't exist, create new patient
        if (!newPatientName.trim()) {
          setSearchError('Patient not found. Please enter their name to create a new account.');
          return;
        }
        
        const patientRef = await addDoc(collection(db, 'patients'), {
          name: newPatientName.trim(),
          email: newPatientEmail.trim().toLowerCase(),
          assignedDoctors: [user.uid],
          createdAt: new Date().toISOString(),
          id: '', // Placeholder for the ID
        });
        
        await updateDoc(doc(db, 'patients', patientRef.id), {
          id: patientRef.id
        });
        
        const newPatient = {
          id: patientRef.id,
          name: newPatientName.trim(),
          email: newPatientEmail.trim().toLowerCase()
        };
        
        setPatients([...patients, newPatient]);
        setNewPatientEmail('');
        setNewPatientName('');
        setShowAddPatient(false);
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      setSearchError('Failed to add patient. Please try again.');
    }
  };

  const deletePatient = async (patientId: string) => {
    if (!user) return;
    
    try {
      // Get the patient document
      const patientQuery = query(
        collection(db, 'patients'),
        where('id', '==', patientId)
      );
      const patientSnapshot = await getDocs(patientQuery);
      
      if (!patientSnapshot.empty) {
        const patientDoc = patientSnapshot.docs[0];
        const patientData = patientDoc.data();
        
        // Remove this doctor from the patient's assignedDoctors array
        const updatedDoctors = patientData.assignedDoctors.filter((id: string) => id !== user.uid);
        
        // Update the patient document
        await updateDoc(doc(db, 'patients', patientDoc.id), {
          assignedDoctors: updatedDoctors
        });
        
        // Update the local state to remove the patient from the list
        setPatients(patients.filter(p => p.id !== patientId));
        
        // If we're viewing this patient's details, close the modal
        if (selectedPatient?.id === patientId) {
          setShowPatientDetails(false);
          setSelectedPatient(null);
        }
      }
    } catch (error) {
      console.error('Error removing patient:', error);
      // You might want to show an error message to the user here
    }
  };

  const addAppointment = async () => {
    if (!user || !selectedPatient || !newAppointment.date) {
      console.log('Missing required fields:', { user, selectedPatient, date: newAppointment.date });
      return;
    }

    try {
      const appointmentData = {
        patientId: selectedPatient.id,
        doctorId: user.uid,
        doctorName: user.email?.split('@')[0] || 'Doctor',
        date: newAppointment.date,
        specialty: 'General',
        notes: newAppointment.notes || '',
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      console.log('Creating appointment with data:', appointmentData);

      // Add to Firestore
      await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Close modal and reset form
      setNewAppointment({ date: '', notes: '' });
      setShowAddAppointment(false);

      // Fetch updated appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', selectedPatient.id),
        orderBy('date', 'desc')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(appointmentsList);

    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const addDoctorNote = async () => {
    if (!user || !selectedPatient || !newNote.diagnosis || !newNote.treatment) {
      console.log('Missing required fields:', { user, selectedPatient, diagnosis: newNote.diagnosis, treatment: newNote.treatment });
      return;
    }

    try {
      const noteData = {
        patientId: selectedPatient.id,
        doctorId: user.uid,
        doctorName: user.email?.split('@')[0] || 'Doctor',
        diagnosis: newNote.diagnosis,
        treatment: newNote.treatment,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      console.log('Creating note with data:', noteData);

      // Add to Firestore
      await addDoc(collection(db, 'doctorNotes'), noteData);
      
      // Close modal and reset form
      setNewNote({ diagnosis: '', treatment: '' });
      setShowAddNote(false);

      // Fetch updated notes
      const notesQuery = query(
        collection(db, 'doctorNotes'),
        where('patientId', '==', selectedPatient.id),
        orderBy('date', 'desc')
      );
      
      const notesSnapshot = await getDocs(notesQuery);
      const notesList = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoctorNote[];
      setDoctorNotes(notesList);

    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!user || !selectedPatient) return;

    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user || !selectedPatient) return;

    try {
      await deleteDoc(doc(db, 'doctorNotes', noteId));
      setDoctorNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const addPatient = async (email: string, name: string, password: string) => {
    if (!user) return;
    
    try {
      // Create Firebase Auth account for the patient
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const patientUid = userCredential.user.uid;
      
      // Create patient document in Firestore with the same ID as the Auth account
      const patientDoc = {
        uid: patientUid,
        id: patientUid,
        name,
        email,
        type: 'patient',
        assignedDoctors: [user.uid],
        doctorNames: [user.email?.split('@')[0] || 'Doctor'],
        createdAt: new Date().toISOString()
      };
      
      // Add the patient document to the users collection
      await addDoc(collection(db, 'users'), patientDoc);
      
      // Also add to patients collection for backwards compatibility
      await addDoc(collection(db, 'patients'), patientDoc);
      
      // Add the new patient to the local state
      setPatients([...patients, {
        id: patientUid,
        name,
        email,
        assignedDoctors: [user.uid],
        doctorNames: [user.email?.split('@')[0] || 'Doctor']
      }]);
      
      // Sign out the patient account immediately so they need to log in separately
      await auth.signOut();
      
      // Close the modal and clear any errors
      setShowAddPatient(false);
      setSearchError('');
      
      // Open patient portal in new tab
      window.open('/patient/login', '_blank');
      
      // Sign back in as the doctor
      router.push('/login');
    } catch (error: unknown) {
      console.error('Error adding patient:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to add patient');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <nav className="bg-white/70 backdrop-blur-sm border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-32 h-4 bg-violet-100 rounded animate-pulse"></div>
              </div>
              <div className="w-24 h-8 bg-violet-100 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/70 backdrop-blur-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-violet-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-violet-900">Doctor Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-violet-900 font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl focus:outline-none transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-violet-900">Your Patients</h2>
              <p className="mt-2 text-sm text-violet-600">
                Manage and chat with your assigned patients in real-time
              </p>
            </div>
            <button
              onClick={() => setShowAddPatient(true)}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 flex items-center space-x-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Patient</span>
            </button>
          </div>

          {/* Add Patient Modal */}
          <AddPatientModal
            isOpen={showAddPatient}
            onClose={() => {
              setShowAddPatient(false);
              setSearchError('');
            }}
            onAddPatient={addPatient}
            error={searchError}
          />
          
          {/* Patient Details Modal */}
          {showPatientDetails && selectedPatient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl mx-4 my-8 shadow-xl border border-purple-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <span className="text-violet-600 font-medium text-lg">
                        {selectedPatient.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-violet-900">{selectedPatient.name}</h3>
                      <p className="text-sm text-violet-600">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPatientDetails(false);
                      setSelectedPatient(null);
                      setAppointments([]);
                      setDoctorNotes([]);
                    }}
                    className="text-violet-500 hover:text-violet-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Appointments Section */}
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-violet-900">Appointments</h4>
                      <button
                        onClick={() => setShowAddAppointment(true)}
                        className="px-3 py-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors text-sm"
                      >
                        Add Appointment
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="bg-violet-50/50 rounded-xl p-4 relative group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-violet-900 font-medium">
                                {new Date(appointment.date).toLocaleString()}
                              </div>
                              <div className="text-sm text-violet-600 mt-1">
                                By Dr. {appointment.doctorName}
                              </div>
                              {appointment.notes && (
                                <div className="text-sm text-violet-600 mt-2">
                                  {appointment.notes}
                                </div>
                              )}
                            </div>
                            {user && appointment.doctorId === user.uid && (
                              <button
                                onClick={() => deleteAppointment(appointment.id!)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {appointments.length === 0 && (
                        <p className="text-violet-600 text-sm">No appointments scheduled</p>
                      )}
                    </div>
                  </div>

                  {/* Doctor Notes Section */}
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-violet-900">Doctor Notes</h4>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="px-3 py-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors text-sm"
                      >
                        Add Note
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {doctorNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-violet-50/50 rounded-xl p-4 relative group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-violet-600 mb-2">
                                  {new Date(note.date).toLocaleDateString()} by Dr. {note.doctorName}
                                </div>
                                {user && note.doctorId === user.uid && (
                                  <button
                                    onClick={() => deleteNote(note.id!)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <div className="text-violet-900 mb-2">
                                <strong>Diagnosis:</strong> {note.diagnosis}
                              </div>
                              <div className="text-violet-700">
                                <strong>Treatment:</strong> {note.treatment}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {doctorNotes.length === 0 && (
                        <p className="text-violet-600 text-sm">No notes added</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => router.push(`/chat/${selectedPatient.id}`)}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Appointment Modal */}
          {showAddAppointment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl border border-purple-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-violet-900">Schedule Appointment</h3>
                  <button
                    onClick={() => {
                      setShowAddAppointment(false);
                      setNewAppointment({ date: '', notes: '' });
                    }}
                    className="text-violet-500 hover:text-violet-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addAppointment();
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-violet-900 mb-2">
                        Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-900 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                        placeholder="Add any additional notes..."
                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAppointment(false);
                        setNewAppointment({ date: '', notes: '' });
                      }}
                      className="px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200"
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Note Modal */}
          {showAddNote && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl border border-purple-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-violet-900">Add Doctor Note</h3>
                  <button
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote({ diagnosis: '', treatment: '' });
                    }}
                    className="text-violet-500 hover:text-violet-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addDoctorNote();
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-violet-900 mb-2">
                        Diagnosis
                      </label>
                      <textarea
                        value={newNote.diagnosis}
                        onChange={(e) => setNewNote({ ...newNote, diagnosis: e.target.value })}
                        placeholder="Enter diagnosis..."
                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-900 mb-2">
                        Treatment Plan
                      </label>
                      <textarea
                        value={newNote.treatment}
                        onChange={(e) => setNewNote({ ...newNote, treatment: e.target.value })}
                        placeholder="Enter treatment plan..."
                        className="w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddNote(false);
                        setNewNote({ diagnosis: '', treatment: '' });
                      }}
                      className="px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200"
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Patient List */}
          {patients.length === 0 ? (
            <EmptyState onAddPatient={() => setShowAddPatient(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewDetails={() => fetchPatientDetails(patient)}
                  onChat={() => router.push(`/chat/${patient.id}`)}
                  onDelete={() => deletePatient(patient.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 