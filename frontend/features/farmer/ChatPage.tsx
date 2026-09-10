"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export default function ChatAssistant() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [language, setLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(userData);
      const role = (parsed.role || 'farmer').toLowerCase();
      if (role !== 'farmer') {
        router.push(`/${role}/dashboard`);
        return;
      }
      setUser({ ...parsed, role });
      setLanguage(parsed.language || 'en');
      fetchSessions();
    } catch (e) {
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSessions(response.data.data);
        if (response.data.data.length > 0) {
          setCurrentSessionId(response.data.data[0].id);
          fetchMessages(response.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/chat/messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const createNewSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/v1/chat/sessions', 
        { language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const newSession = response.data.data;
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setMessages([]);
        setShowSidebar(false);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    // Add user message optimistically
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/v1/chat/messages', 
        {
          message: userMessage.content,
          session_id: currentSessionId,
          language
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const aiMessage = response.data.data.message;
        setMessages(prev => [...prev, aiMessage]);
        // Refresh sessions to update message count
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId && sessions.length > 1) {
        const nextSession = sessions.find(s => s.id !== sessionId);
        if (nextSession) {
          setCurrentSessionId(nextSession.id);
          fetchMessages(nextSession.id);
        }
      } else if (sessions.length <= 1) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    fetchMessages(sessionId);
    setShowSidebar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden text-white text-2xl hover:text-green-200 transition"
              >
                ☰
              </button>
              <span className="text-2xl">💬</span>
              <h1 className="text-xl font-bold text-white">AgroNexus AI Assistant</h1>
              <span className="ml-2 text-xs bg-green-700 text-green-100 px-2 py-1 rounded">Farmer</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden md:block">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40 w-72 bg-white shadow-lg 
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 h-full flex flex-col">
            <button
              onClick={createNewSession}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition mb-4 text-sm font-medium"
            >
              + New Conversation
            </button>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    currentSessionId === session.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => switchSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {session.title || 'New Conversation'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{sessions.length} conversations</span>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {currentSessionId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🌾</div>
                    <h3 className="text-xl font-semibold text-gray-700">Start a Conversation</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                      Ask me anything about farming, crops, diseases, market prices, or weather in Ethiopia.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setInput('How do I treat teff rust?')}
                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                      >
                        🌾 Teff rust treatment
                      </button>
                      <button
                        onClick={() => setInput('What are the current market prices?')}
                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                      >
                        💰 Market prices
                      </button>
                      <button
                        onClick={() => setInput('When should I plant maize?')}
                        className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
                      >
                        🌽 Planting advice
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleSend} className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about farming..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Powered by AI • Get farming advice in {language === 'am' ? 'Amharic' : language === 'om' ? 'Oromo' : 'English'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-700">No Conversation Selected</h3>
                <p className="text-gray-500 mt-2">Start a new conversation or select one from the sidebar</p>
                <button
                  onClick={createNewSession}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
