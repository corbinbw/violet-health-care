'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  senderName: string;
}

export default function ChatPage({ params }: { params: { patientId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [patientName, setPatientName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch patient name
    const fetchPatientName = async () => {
      const patientDoc = await getDoc(doc(db, 'patients', params.patientId));
      if (patientDoc.exists()) {
        setPatientName(patientDoc.data().name);
      }
    };

    fetchPatientName();

    // Subscribe to messages
    const q = query(
      collection(db, `patients/${params.patientId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(newMessages);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [params.patientId, user, router]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, `patients/${params.patientId}/messages`), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.email,
        timestamp: new Date().toISOString()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl focus:outline-none transition-all duration-200"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <span className="text-violet-600 font-medium text-lg">
                    {patientName[0]?.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-violet-900">
                  Chat with {patientName}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-purple-100 h-[calc(100vh-12rem)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-sm rounded-2xl px-4 py-3 ${
                      message.senderId === user?.uid
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900'
                    }`}
                  >
                    <div className={`text-xs ${
                      message.senderId === user?.uid
                        ? 'text-violet-100'
                        : 'text-violet-600'
                    } mb-1`}>
                      {message.senderName}
                    </div>
                    <div className="text-sm">{message.text}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-purple-100 p-4 bg-white/30 backdrop-blur-sm rounded-b-2xl">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 text-violet-900 placeholder-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Send</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 