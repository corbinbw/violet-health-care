'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-block">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <svg className="h-12 w-12 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                Violet
              </h1>
            </div>
            <p className="text-2xl text-violet-800 font-light max-w-2xl mx-auto">
              Connecting Healthcare Professionals with Patients
            </p>
          </div>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Doctor Card */}
          <div 
            onClick={() => router.push('/login')}
            className="group cursor-pointer bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-200"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-violet-900 mb-2 group-hover:text-violet-600 transition-colors duration-300">
              Healthcare Providers
            </h2>
            <p className="text-violet-600 mb-6">
              Access your patient communications and manage care in real-time
            </p>
            <span className="inline-flex items-center text-violet-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Sign in as Doctor
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>

          {/* Patient Card */}
          <div 
            onClick={() => router.push('/patient/login')}
            className="group cursor-pointer bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-200"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-violet-900 mb-2 group-hover:text-violet-600 transition-colors duration-300">
              Patients
            </h2>
            <p className="text-violet-600 mb-6">
              Stay connected with your healthcare team and access your care information
            </p>
            <span className="inline-flex items-center text-violet-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
              Sign in as Patient
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-violet-600 text-sm">
            Secure • HIPAA Compliant • Real-time Communication
          </p>
        </div>
      </div>
    </div>
  );
}
