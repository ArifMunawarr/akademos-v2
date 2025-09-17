'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiKey } from 'react-icons/fi';

export default function StudentJoinPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !key) { setError('Please fill Name and Key'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/rooms/by-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinKey: key.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid key');
      if (!data.isActive) throw new Error('Class is not active yet');
      sessionStorage.setItem('join_key', key.trim());
      sessionStorage.setItem('display_name', name.trim());
      if (data.roomName) sessionStorage.setItem('room_name_hint', data.roomName);
      // Derive a readable class name by stripping numeric suffix from room_name
      try {
        if (data.roomName && typeof data.roomName === 'string') {
          const friendly = String(data.roomName).replace(/-\d+(?:-\d+)?$/, '');
          sessionStorage.setItem('class_name_hint', friendly);
        }
      } catch {}
      router.push('/student/live');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-400">
        <form onSubmit={handleJoin}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <div className="relative mb-5">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="w-full h-11 rounded-md border border-gray-300 bg-gray-100 px-3 pl-10 text-gray-900 placeholder-gray-500" placeholder="Student Name" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Key</label>
          <div className="relative mb-6">
            <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input className="w-full h-11 rounded-md border border-gray-300 bg-gray-100 px-3 pl-10 text-gray-900 placeholder-gray-500" placeholder="Input Key" value={key} onChange={(e)=>setKey(e.target.value)} />
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="block ml-auto h-10 w-36 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-md disabled:opacity-60">{loading ? 'Joining…' : 'Join Class'}</button>
        </form>
      </div>
    </main>
  );
}
