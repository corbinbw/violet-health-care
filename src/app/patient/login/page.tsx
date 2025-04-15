'use client';

import { useState } from 'react';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { loginAsPatient, registerPatient } = usePatientAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        // Registration
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await registerPatient(email, password, name);
      } else {
        // Login
        await loginAsPatient(email, password);
      }
      router.push('/patient/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-2xl flex items-center justify-center">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-violet-900 mb-2">
          {isRegistering ? 'Create Patient Account' : 'Patient Login'}
        </h1>
        <p className="text-violet-600">
          {isRegistering 
            ? 'Create your account to get started with your healthcare journey'
            : 'Sign in to access your healthcare information'}
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-violet-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-violet-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors bg-white/50"
                  placeholder="John Doe"
                  required={isRegistering}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-violet-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors bg-white/50"
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
                className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors bg-white/50"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-violet-900 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors bg-white/50"
                  placeholder="••••••••"
                  required={isRegistering}
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-4 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="w-full px-6 py-4 bg-white text-violet-600 rounded-xl border-2 border-violet-200 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-sm text-violet-600 hover:text-violet-700 flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
} 