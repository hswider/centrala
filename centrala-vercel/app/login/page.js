'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        setError('Nieprawidlowy login lub haslo');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Blad podczas logowania');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">
                <Image
                  src="/poom-logo.png"
                  alt="POOM Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Zaloguj się do centrali POOM
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Login
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/50 text-white placeholder-gray-500 transition-all"
                placeholder="Wprowadz login"
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Haslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/50 text-white placeholder-gray-500 transition-all"
                placeholder="Wprowadz haslo"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-xl text-green-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Poprawnie zalogowano! Przekierowanie...
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className={`w-full py-3 rounded-xl font-medium transition-all transform hover:scale-[1.02] ${
                success
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gradient-to-r from-blue-500 via-blue-600 to-violet-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {success ? 'Zalogowano!' : isLoading ? 'Logowanie...' : 'Zaloguj sie'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Panel zarzadzania POOM
        </p>
      </div>
    </div>
  );
}
