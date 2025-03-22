'use client';

import { useEffect, useState } from 'react';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Doctor {
  id: string;
  email: string;
  name?: string;
  specialty?: string;
  uid?: string;
}

interface Appointment {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  doctorId: string;
}

interface DoctorNote {
  id: string;
  diagnosis: string;
  treatment: string;
  date: string;
  doctorName: string;
}

interface Message {
  id: string;
  doctorId: string;
  doctorName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function PatientDashboardPage() {
  const { patient, logoutPatient } = usePatientAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  useEffect(() => {
    if (!patient) {
      router.push('/patient/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch patient's data including assigned doctors
        const patientQuery = query(
          collection(db, 'patients'),
          where('id', '==', patient.uid)
        );
        
        const patientSnapshot = await getDocs(patientQuery);
        if (!patientSnapshot.empty) {
          const patientDoc = patientSnapshot.docs[0];
          const assignedDoctors = patientDoc.data().assignedDoctors || [];
          
          // Fetch doctor details
          const doctorPromises = assignedDoctors.map(async (doctorId: string) => {
            const doctorQuery = query(
              collection(db, 'users'),
              where('uid', '==', doctorId)
            );
            const doctorSnapshot = await getDocs(doctorQuery);
            if (!doctorSnapshot.empty) {
              const doctorData = doctorSnapshot.docs[0].data();
              return {
                id: doctorId,
                email: doctorData.email,
                name: doctorData.email?.split('@')[0] || 'Doctor',
                specialty: doctorData.specialty,
                uid: doctorData.uid
              };
            }
            return null;
          });
          
          const doctorList = (await Promise.all(doctorPromises)).filter((doctor): doctor is Doctor => doctor !== null);
          setDoctors(doctorList);

          // Fetch appointments
          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', patient.uid),
            where('date', '>=', new Date().toISOString()),
            orderBy('date', 'asc')
          );
          
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Appointment[];
          setAppointments(appointmentsList);

          // Fetch doctor notes
          const notesQuery = query(
            collection(db, 'doctorNotes'),
            where('patientId', '==', patient.uid),
            orderBy('date', 'desc')
          );
          
          const notesSnapshot = await getDocs(notesQuery);
          const notesList = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as DoctorNote[];
          setDoctorNotes(notesList);

          // Fetch recent messages
          const messagesQuery = query(
            collection(db, 'messages'),
            where('patientId', '==', patient.uid),
            orderBy('timestamp', 'desc')
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          const messagesList = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          setMessages(messagesList);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [patient, router]);

  const handleLogout = async () => {
    try {
      await logoutPatient();
      router.push('/patient/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const searchAndAddDoctor = async () => {
    if (!patient || !doctorEmail.trim()) {
      setSearchError('Please enter a doctor\'s email address');
      return;
    }
    setSearchError('');
    
    try {
      // Search for doctor by email (case insensitive)
      const normalizedEmail = doctorEmail.trim().toLowerCase();
      console.log('Searching for doctor with email:', normalizedEmail);
      
      const doctorQuery = query(
        collection(db, 'users'),
        where('email', '==', normalizedEmail)
      );
      
      const doctorSnapshot = await getDocs(doctorQuery);
      console.log('Doctor search results:', doctorSnapshot.size);
      
      if (!doctorSnapshot.empty) {
        const doctorDoc = doctorSnapshot.docs[0];
        const doctorData = doctorDoc.data();
        console.log('Found doctor:', doctorData);
        
        // Get patient document
        const patientQuery = query(
          collection(db, 'patients'),
          where('id', '==', patient.uid)
        );
        const patientSnapshot = await getDocs(patientQuery);
        
        if (!patientSnapshot.empty) {
          const patientDoc = patientSnapshot.docs[0];
          const patientData = patientDoc.data();
          
          // Check if doctor is already assigned
          if (patientData.assignedDoctors?.includes(doctorData.uid)) {
            setSearchError('This doctor is already assigned to you');
            return;
          }
          
          // Add doctor to patient's assignedDoctors array
          const patientRef = doc(db, 'patients', patientDoc.id);
          await updateDoc(patientRef, {
            assignedDoctors: arrayUnion(doctorData.uid),
            doctorNames: arrayUnion(doctorData.email?.split('@')[0] || 'Doctor')
          });
          
          // Refresh doctor list
          const newDoctor = {
            id: doctorData.uid,
            email: doctorData.email,
            name: doctorData.email?.split('@')[0] || 'Doctor',
            specialty: doctorData.specialty,
            uid: doctorData.uid
          };
          setDoctors([...doctors, newDoctor]);
          setDoctorEmail('');
          setShowAddDoctor(false);
          
          console.log('Successfully added doctor:', newDoctor);
        }
      } else {
        console.log('No doctor found with email:', normalizedEmail);
        setSearchError('Doctor not found. Please check the email address and try again.');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      setSearchError('An error occurred while adding the doctor. Please try again.');
    }
  };

  const removeDoctor = async (doctorId: string) => {
    if (!patient) return;
    
    try {
      const patientQuery = query(
        collection(db, 'patients'),
        where('id', '==', patient.uid)
      );
      const patientSnapshot = await getDocs(patientQuery);
      
      if (!patientSnapshot.empty) {
        const patientDoc = patientSnapshot.docs[0];
        const patientData = patientDoc.data();
        const updatedDoctors = patientData.assignedDoctors.filter((id: string) => id !== doctorId);
        
        await updateDoc(doc(db, 'patients', patientDoc.id), {
          assignedDoctors: updatedDoctors
        });
        
        setDoctors(doctors.filter(d => d.id !== doctorId));
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50">
        <div className="text-xl text-violet-600">Loading...</div>
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-violet-900">Patient Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {patient?.name?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-violet-900 font-medium">{patient?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl focus:outline-none transition-all duration-200"
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
          {/* Messages Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-violet-900">Recent Messages</h2>
                <p className="mt-2 text-sm text-violet-600">
                  View your recent conversations with healthcare providers
                </p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 mb-8">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-violet-600">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => router.push(`/chat/${message.doctorId}`)}
                      className="bg-violet-50/50 rounded-xl p-4 cursor-pointer hover:bg-violet-100/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-violet-900 font-medium">Dr. {message.doctorName}</div>
                          <div className="text-violet-600 text-sm mt-1">{message.lastMessage}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-violet-500">{new Date(message.timestamp).toLocaleDateString()}</span>
                          {message.unread && (
                            <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Appointments Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-violet-900">Your Appointments</h2>
                <p className="mt-2 text-sm text-violet-600">
                  View and manage your upcoming medical appointments
                </p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 mb-8">
              {appointments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-violet-600">No upcoming appointments</p>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-violet-50/50 rounded-xl p-4 mb-4 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-violet-900 font-medium">
                          {new Date(appointment.date).toLocaleString()}
                        </div>
                        <div className="text-xl font-bold text-violet-900">{appointment.doctorName}</div>
                        <div className="text-violet-600">{appointment.specialty}</div>
                      </div>
                      <div className="space-x-2">
                        <button 
                          onClick={() => router.push(`/chat/${appointment.doctorId}`)}
                          className="px-4 py-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors"
                        >
                          Message
                        </button>
                        <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Doctor Notes Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-violet-900">Doctor Notes</h2>
                <p className="mt-2 text-sm text-violet-600">
                  Recent updates and recommendations from your healthcare team
                </p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 mb-8">
              {doctorNotes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-violet-600">No doctor notes yet</p>
                </div>
              ) : (
                doctorNotes.map((note) => (
                  <div key={note.id} className="bg-violet-50/50 rounded-xl p-4 mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-violet-600">{new Date(note.date).toLocaleDateString()}</div>
                      <div className="text-sm font-medium text-violet-900">Dr. {note.doctorName}</div>
                    </div>
                    <div className="text-violet-900 mb-3">
                      <strong>Diagnosis:</strong> {note.diagnosis}
                    </div>
                    <div className="text-violet-700">
                      <strong>Treatment Plan:</strong> {note.treatment}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Your Doctors Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-violet-900">Your Healthcare Team</h2>
                <p className="mt-2 text-sm text-violet-600">
                  Manage your connected doctors and appointments
                </p>
              </div>
              <button
                onClick={() => setShowAddDoctor(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Doctor
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="group bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl border border-violet-100 hover:border-violet-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="px-6 py-5">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-violet-600 font-medium text-lg">
                            {doctor.name?.[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-violet-900">
                            Dr. {doctor.name}
                          </h3>
                          <p className="text-sm text-violet-600">Healthcare Provider</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => router.push(`/chat/${doctor.id}`)}
                          className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 flex items-center justify-center space-x-2"
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
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          <span>Open Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Doctor Modal */}
      {showAddDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-violet-900">Add Doctor</h3>
              <button
                onClick={() => setShowAddDoctor(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="doctorEmail" className="block text-sm font-medium text-violet-900">
                  Doctor's Email
                </label>
                <input
                  type="email"
                  id="doctorEmail"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-violet-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  placeholder="doctor@example.com"
                />
              </div>
              {searchError && (
                <p className="text-sm text-red-600">{searchError}</p>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddDoctor(false)}
                  className="px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-700 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={searchAndAddDoctor}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                >
                  Add Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 