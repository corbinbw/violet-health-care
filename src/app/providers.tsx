'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { PatientAuthProvider } from '../contexts/PatientAuthContext';
import ClientLayout from './ClientLayout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PatientAuthProvider>
        <ClientLayout>{children}</ClientLayout>
      </PatientAuthProvider>
    </AuthProvider>
  );
} 