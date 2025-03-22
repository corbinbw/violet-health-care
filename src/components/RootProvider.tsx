'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { PatientAuthProvider } from '@/contexts/PatientAuthContext';

export default function RootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PatientAuthProvider>
        {children}
      </PatientAuthProvider>
    </AuthProvider>
  );
} 