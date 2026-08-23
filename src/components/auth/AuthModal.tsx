import React, { useState } from 'react';
import { Shield, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Google OAuth failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      setMessage({ type: 'success', text: 'Authentication successful.' });
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to authenticate.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Slow Spider Security & Auth"
      description="Authenticate with Supabase Auth or Google OAuth."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Status banner */}
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
          isSupabaseConfigured
            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
            : 'bg-[#151922] border-[#222B3B] text-slate-300'
        }`}>
          {isSupabaseConfigured ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>
            {isSupabaseConfigured
              ? 'Supabase Backend Connected'
              : 'Local Database Active'}
          </span>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google OAuth</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-500 my-2">
          <div className="flex-1 h-px bg-[#1F2633]" />
          <span>or email credentials</span>
          <div className="flex-1 h-px bg-[#1F2633]" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161B24] border border-[#263246] rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161B24] border border-[#263246] rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="md" type="submit" isLoading={isLoading} className="w-full">
              Sign In to Slow Spider
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
