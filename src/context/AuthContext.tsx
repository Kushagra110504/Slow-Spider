import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../services/dataService';
import { Validation } from '../lib/validation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = 'pv_auth_session_v1';
const AUTH_USER_KEY = 'pv_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Auth state from storage or Supabase session
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const dbUser = dataService.getUserByEmail(session.user.email || '') || dataService.getUserById(session.user.id);
            if (dbUser) {
              setUser(dbUser);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dbUser));
            } else {
              const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
              const newUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: displayName,
                avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=10b981,06b6d4,6366f1`,
                role: 'user',
                created_at: new Date().toISOString(),
              };
              dataService.registerUser(newUser);
              setUser(newUser);
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
            }
          } else {
            // Check local persistence
            const savedUser = localStorage.getItem(AUTH_USER_KEY);
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              if (parsed && !parsed.email?.endsWith('@projectvault.io') && parsed.name !== 'Alex Mercer') {
                setUser(parsed);
              } else {
                localStorage.removeItem(AUTH_USER_KEY);
                localStorage.removeItem(AUTH_SESSION_KEY);
              }
            }
          }
        } else {
          // Local Persistent Auth Mode
          const savedUser = localStorage.getItem(AUTH_USER_KEY);
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed && !parsed.email?.endsWith('@projectvault.io') && parsed.name !== 'Alex Mercer') {
              setUser(parsed);
            } else {
              localStorage.removeItem(AUTH_USER_KEY);
              localStorage.removeItem(AUTH_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth session', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000;
let failedAttempts = 0;
let lockoutExpiry = 0;

  const login = async (email: string, password: string): Promise<void> => {
    // Check Brute-force Throttling Lockout
    if (Date.now() < lockoutExpiry) {
      const remainingSec = Math.ceil((lockoutExpiry - Date.now()) / 1000);
      throw new Error(`Too many failed attempts. Account temporarily locked for ${remainingSec}s to prevent brute-force attacks.`);
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Fallback check local registered users
          const localCheck = await dataService.authenticateUser(email, password);
          if (localCheck.success && localCheck.user) {
            failedAttempts = 0;
            lockoutExpiry = 0;
            setUser(localCheck.user);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(localCheck.user));
            localStorage.setItem(AUTH_SESSION_KEY, `local-jwt-${Date.now()}`);
            return;
          }
          failedAttempts++;
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            lockoutExpiry = Date.now() + LOCKOUT_DURATION_MS;
          }
          throw error;
        }
        if (data.user) {
          failedAttempts = 0;
          lockoutExpiry = 0;
          let appUser = dataService.getUserByEmail(data.user.email || '') || dataService.getUserById(data.user.id);
          if (!appUser) {
            const displayName = data.user.user_metadata?.full_name || email.split('@')[0];
            appUser = {
              id: data.user.id,
              email: data.user.email || email,
              name: displayName,
              avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=10b981,06b6d4,6366f1`,
              role: 'user',
              created_at: new Date().toISOString(),
            };
            dataService.registerUser(appUser);
          }
          setUser(appUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
          localStorage.setItem(AUTH_SESSION_KEY, data.session?.access_token || 'active');
          return;
        }
      }

      // Local Database Authentication (with SHA-256 password hash verification)
      const result = await dataService.authenticateUser(email, password);
      if (!result.success || !result.user) {
        failedAttempts++;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          lockoutExpiry = Date.now() + LOCKOUT_DURATION_MS;
        }
        throw new Error(result.error || 'Invalid email or password.');
      }

      failedAttempts = 0;
      lockoutExpiry = 0;
      setUser(result.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      localStorage.setItem(AUTH_SESSION_KEY, `local-jwt-${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, _requestedRole: UserRole = 'user'): Promise<void> => {
    // Input Schema Validation
    const emailVal = Validation.validateEmail(email);
    if (!emailVal.isValid) throw new Error(emailVal.error);

    const passVal = Validation.validatePassword(password);
    if (!passVal.isValid) throw new Error(passVal.error);

    if (!name.trim()) throw new Error('Full name is required.');

    setIsLoading(true);
    // Force standard 'user' role on signup to prevent privilege escalation
    const sanitizedRole: UserRole = 'user';
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), role: sanitizedRole },
          },
        });
        if (error) throw error;
        if (data.user) {
          const newUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: name.trim(),
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=10b981,06b6d4,6366f1`,
            role: sanitizedRole,
            created_at: new Date().toISOString(),
          };
          dataService.registerUser(newUser);
          setUser(newUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
          localStorage.setItem(AUTH_SESSION_KEY, data.session?.access_token || 'active');
          return;
        }
      }

      // Local Registration with SHA-256 password hashing
      const result = await dataService.createUserAccount(email, password, name, sanitizedRole);
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Failed to create account.');
      }

      setUser(result.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      localStorage.setItem(AUTH_SESSION_KEY, `local-jwt-${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
        if (error) {
          throw new Error('Google OAuth provider is not enabled in your Supabase project yet. Please enable it in your Supabase dashboard or use Email/Password Sign In.');
        }
      } else {
        throw new Error('Supabase is not configured. Please sign up or sign in using your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.clear();
    
    // Purge dynamic Service Worker runtime caches on logout
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('dynamic') || name.includes('runtime')) {
            caches.delete(name);
          }
        });
      });
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = dataService.updateUser(user.id, updates);
    if (updated) {
      setUser(updated);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
