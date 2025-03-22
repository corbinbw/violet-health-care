'use client';

import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
} 