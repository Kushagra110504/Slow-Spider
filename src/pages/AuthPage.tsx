import React, { useState } from 'react';
import { 
  Layers, Lock, Mail, User as UserIcon, 
  ArrowRight, ShieldCheck, AlertCircle, Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const AuthPage: React.FC = () => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleNotice, setShowGoogleNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await signup(email, password, name, 'user');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setShowGoogleNotice(true);
      setError(err.message || 'Google OAuth is not enabled in your Supabase project yet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-textPrimary flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background radial ambient glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl -translate-y-24 translate-x-24" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-glow-green mb-1">
            <div className="w-full h-full bg-vault-surface rounded-[15px] flex items-center justify-center">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-vault-textPrimary tracking-tight">
            ProjectVault
          </h1>
          <p className="text-xs text-vault-textMuted">
            Project Lifecycle Management System (PLMS)
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-vault-card border border-vault-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-vault-cardHover border border-vault-border mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setShowGoogleNotice(false); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-vault-card text-vault-textPrimary shadow-sm border border-vault-border'
                  : 'text-vault-textMuted hover:text-vault-textPrimary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setShowGoogleNotice(false); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-vault-card text-vault-textPrimary shadow-sm border border-vault-border'
                  : 'text-vault-textMuted hover:text-vault-textPrimary'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth Notice */}
          {showGoogleNotice && (
            <div className="p-3 mb-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <div>
                <strong>How to enable Google OAuth:</strong>
                <p className="mt-1 text-[11px] text-vault-textMuted">
                  In Supabase Console &rarr; <em>Authentication</em> &rarr; <em>Providers</em> &rarr; <em>Google</em>, enable the toggle and add your Google Client ID.
                </p>
                <p className="mt-1.5 text-[11px] text-emerald-400 font-semibold">
                  Tip: You can use Email/Password sign-in below immediately!
                </p>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 border border-slate-200"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-vault-textMuted my-5">
            <div className="flex-1 h-px bg-vault-border" />
            <span>or sign in with email</span>
            <div className="flex-1 h-px bg-vault-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2 shadow-glow-green"
            >
              <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        {/* Security Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-vault-textMuted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured with JWT Sessions & PostgreSQL RLS</span>
        </div>
      </div>
    </div>
  );
};
