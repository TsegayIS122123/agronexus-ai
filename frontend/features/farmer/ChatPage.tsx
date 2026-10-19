'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { getAccessToken, useSession } from '@/features/auth/session';

const AI_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  createdAt?: string;
}

interface Session {
  id: string;
  title?: string;
  message_count?: number;
  messageCount?: number;
  created_at?: string;
  createdAt?: string;
}

export default function ChatAssistant() {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const language = user?.language ?? 'en';

  const authedFetch = useCallback(async <T,>(
    url: string,
    init?: RequestInit,
  ): Promise<T> => {
    const token = getAccessToken();
    const isForm = init?.body instanceof FormData;
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (body as { message?: string; detail?: string })?.message ??
        (body as { detail?: string })?.detail ??
        `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return body as T;
  }, []);

  const fetchMessages = useCallback(
    async (sessionId: string) => {
      try {
        const body = await authedFetch<{
          data?: Message[];
        } | Message[]>(`${AI_BASE}/api/v1/chat/messages/${sessionId}`);
        const data = Array.isArray(body) ? body : body.data ?? [];
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    },
    [authedFetch],
  );

  const fetchSessions = useCallback(async () => {
    try {
      const body = await authedFetch<{ data?: Session[] } | Session[]>(
        `${AI_BASE}/api/v1/chat/sessions`,
      );
      const data = Array.isArray(body) ? body : body.data ?? [];
      setSessions(data);
      if (data.length > 0) {
        setCurrentSessionId(data[0].id);
        await fetchMessages(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, [authedFetch, fetchMessages]);

  useEffect(() => {
    if (user) void fetchSessions();
    setLoading(false);
  }, [user, fetchSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async () => {
    try {
      const body = await authedFetch<{ data?: Session } | Session>(
        `${AI_BASE}/api/v1/chat/sessions`,
        { method: 'POST', body: JSON.stringify({ language }) },
      );
      const newSession = 'data' in body && body.data ? body.data : (body as Session);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setShowSidebar(false);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const body = await authedFetch<{
        data?: { message?: Message };
        message?: Message;
      }>(`${AI_BASE}/api/v1/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage.content,
          session_id: currentSessionId,
          language,
        }),
      });
      const aiMessage = body.data?.message ?? body.message ?? (body as unknown as Message);
      setMessages((prev) => [...prev, aiMessage]);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: (err as Error).message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await authedFetch(`${AI_BASE}/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const next = sessions.find((s) => s.id !== sessionId);
        if (next) {
          setCurrentSessionId(next.id);
          await fetchMessages(next.id);
        } else {
          setMessages([]);
          setCurrentSessionId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  if (loading) {
    return (
      <DashboardShell role="farmer">
        <div className="flex justify-center items-center py-24">
          <div className="text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!user) return null;

  return (
    <DashboardShell role="farmer">
      <div className="md:hidden px-4 pt-3">
        <button
          type="button"
          onClick={() => setShowSidebar(!showSidebar)}
          aria-expanded={showSidebar}
          aria-controls="chat-history-drawer"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
        >
          ☰ Sessions
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          id="chat-history-drawer"
          className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
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
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    void fetchMessages(session.id);
                    setShowSidebar(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {session.title ?? 'New Conversation'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.message_count ?? session.messageCount ?? 0} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteSession(session.id);
                    }}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {currentSessionId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🌾</div>
                    <h3 className="text-xl font-semibold text-gray-700">
                      Start a Conversation
                    </h3>
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
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleSend} className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about farming..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-700">
                  No Conversation Selected
                </h3>
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
    </DashboardShell>
  );
}
