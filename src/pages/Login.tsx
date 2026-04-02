import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⏳</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeCoin</h1>
        <p className="text-gray-500 mb-8">The Tinder of Local Micro-Skills</p>
        
        <p className="text-sm text-gray-600 mb-8">
          Exchange your time and skills with people nearby. No money involved.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <LogIn size={20} />
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
      </div>
    </div>
  );
}
