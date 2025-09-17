'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit3, FiUser, FiKey } from 'react-icons/fi';

export default function TeacherPage() {
  const router = useRouter();
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [joinKey, setJoinKey] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const createClass = async () => {
    setError('');
    if (!className || !teacherName) {
      setError('Please fill Class Name and Name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className, teacherName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create class');
      setJoinKey(data.joinKey);
      setRoomName(data.roomName);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startClass = async () => {
    if (!joinKey) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinKey, active: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to start class');
      // Store info for LiveClass to use
      sessionStorage.setItem('join_key', joinKey);
      sessionStorage.setItem('display_name', teacherName || 'Teacher');
      if (roomName) sessionStorage.setItem('room_name_hint', roomName);
      // Store the plain class name (without suffix) for UI display
      try { sessionStorage.setItem('class_name_hint', className); } catch {}
      router.push('/teacher/live');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!joinKey) return;
    try {
      await navigator.clipboard.writeText(joinKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 p-6">
      <div className={`w-full ${joinKey ? 'max-w-5xl' : 'max-w-md'} bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-400`}>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Class Management</h1>
        <div className={`${joinKey ? 'grid grid-cols-1 md:[grid-template-columns:1fr_auto_1fr] md:gap-12 items-start' : ''}`}>
          {/* Left form */}
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name</label>
            <div className="relative mb-4">
              <FiEdit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="w-full h-11 rounded-md border border-gray-300 bg-gray-100 px-3 pl-10 text-gray-900 placeholder-gray-500"
                placeholder="Input Class Name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={!!joinKey}
              />
            </div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <div className="relative mb-6">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="w-full h-11 rounded-md border border-gray-300 bg-gray-100 px-3 pl-10 text-gray-900 placeholder-gray-500"
                placeholder="Teacher Name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                disabled={!!joinKey}
              />
            </div>
            <button
              onClick={createClass}
              disabled={!!joinKey || loading}
              className={`self-end mt-2 w-44 h-11 rounded-lg font-semibold ${joinKey ? 'bg-emerald-100 text-emerald-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
            >
              {loading && !joinKey ? 'Creating...' : 'Create Class'}
            </button>
          </div>

          {/* Vertical divider on md+ (middle column) */}
          {joinKey && (
            <div className="hidden md:block w-px bg-gray-200 self-stretch mx-4" aria-hidden />
          )}
          {/* Right key panel (revealed after Create) */}
          {joinKey && (
            <div className="flex flex-col items-start justify-start">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Key Class</label>
              <div className="flex items-center gap-4 w-full">
                <div className="relative flex-1">
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    className="w-full h-11 rounded-md bg-gray-200 px-3 pl-10 text-gray-900 placeholder-gray-500"
                    placeholder="—"
                    value={joinKey || ''}
                    readOnly
                  />
                </div>
                <button
                  onClick={copyKey}
                  className={`h-11 px-5 rounded-lg text-white transition ${copied ? 'bg-emerald-600 ring-2 ring-emerald-300 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {copied ? 'copied' : 'copy'}
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <button onClick={() => { setJoinKey(null); setRoomName(null); }} className="h-11 px-7 rounded-lg border border-emerald-500 text-emerald-600 bg-white">Back</button>
                <button onClick={startClass} disabled={loading} className="h-11 px-7 rounded-lg bg-emerald-500 text-white disabled:opacity-50">{loading ? 'Start…' : 'Start Class'}</button>
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-6 text-red-600 text-sm">{error}</p>}
      </div>
    </main>
  );
}
