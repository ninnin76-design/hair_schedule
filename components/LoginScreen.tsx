import React, { useState } from 'react';
import { Button } from './Button';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'smile999') {
      onLogin();
    } else {
      setError('비밀번호가 일치하지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Salon Mate</h1>
          <p className="text-slate-400 mt-2 text-sm">관리자 접속을 위해 비밀번호를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 transition-all text-center tracking-widest text-lg"
              placeholder="••••••••"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 text-center font-medium animate-pulse">
                ⚠️ {error}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full shadow-lg shadow-blue-900/20 py-3 text-lg"
          >
            로그인
          </Button>
        </form>
        
        <p className="mt-6 text-center text-xs text-slate-600">
          © Salon Mate Security
        </p>
      </div>
    </div>
  );
};