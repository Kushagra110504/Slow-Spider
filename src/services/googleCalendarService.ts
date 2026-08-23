import { Task, User } from '../types/database';
import { dataService } from './dataService';
import { supabase } from '../lib/supabase';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

const STORAGE_KEYS = {
  GCAL_TOKEN: 'pv_gcal_token_v1',
  GCAL_EVENTS: 'pv_gcal_events_v1',
  GCAL_CONNECTED: 'pv_gcal_connected_v1',
  GCAL_LAST_SYNC: 'pv_gcal_last_sync_v1',
};

const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly';

class GoogleCalendarService {
  private listeners: Array<() => void> = [];

  constructor() {
    // Purge any legacy mock demo events from localStorage to enforce 100% real data
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GCAL_EVENTS);
      if (raw && (raw.includes('Product Roadmap & Sprint Planning') || raw.includes('UI/UX Design Sync'))) {
        this.disconnect();
      }
    } catch {}
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public isConnected(): boolean {
    return localStorage.getItem(STORAGE_KEYS.GCAL_CONNECTED) === 'true';
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GCAL_LAST_SYNC);
  }

  public getStoredEvents(): GoogleCalendarEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GCAL_EVENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Authorizes with Google Calendar API using real Google Identity Services (GIS) Token Client.
   * Prompts the official Google OAuth consent modal specifically for Calendar scopes.
   */
  public async connectGoogleCalendar(customClientId?: string): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
      const clientId = customClientId || (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        return {
          success: false,
          error: 'Google Client ID is missing. Please provide your Google OAuth 2.0 Client ID (or set VITE_GOOGLE_CLIENT_ID in your .env file).',
        };
      }

      if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
        return {
          success: false,
          error: 'Google Identity Services SDK is loading in your browser. Please try again in a few seconds.',
        };
      }

      return new Promise((resolve) => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GCAL_SCOPES,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              resolve({ 
                success: false, 
                error: tokenResponse.error_description || tokenResponse.error || 'Authorization cancelled or denied.' 
              });
              return;
            }
            if (tokenResponse.access_token) {
              localStorage.setItem(STORAGE_KEYS.GCAL_TOKEN, tokenResponse.access_token);
              localStorage.setItem(STORAGE_KEYS.GCAL_CONNECTED, 'true');
              const result = await this.syncEvents();
              resolve(result);
            } else {
              resolve({ success: false, error: 'No access token received from Google.' });
            }
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to authenticate with Google' };
    }
  }

  /**
   * Optional OAuth redirect via Supabase with explicit Google Calendar scopes.
   */
  public async connectViaSupabaseOAuth(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: GCAL_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.href,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'OAuth redirect failed' };
    }
  }

  /**
   * Fetches 100% real live events from the user's primary Google Calendar.
   */
  public async syncEvents(): Promise<{ success: boolean; count?: number; error?: string }> {
    const token = localStorage.getItem(STORAGE_KEYS.GCAL_TOKEN);
    if (!token) {
      this.disconnect();
      return { success: false, error: 'No active Google Calendar authorization found. Please connect your account.' };
    }

    try {
      const now = new Date();
      // Fetch window: 1 month past to 3 months future
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // If scope is missing or token expired, disconnect and prompt re-auth
        if (response.status === 401 || response.status === 403) {
          this.disconnect();
          const errJson = await response.json().catch(() => ({}));
          const detail = errJson.error?.message || 'Access denied';
          if (detail.toLowerCase().includes('scope') || response.status === 403) {
            return {
              success: false,
              error: 'Google Calendar permission required. Please click "Connect Google Calendar" to grant Calendar access.',
            };
          }
          return { success: false, error: 'Google session expired. Please reconnect.' };
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google Calendar API error (${response.status})`);
      }

      const data = await response.json();
      const rawItems: any[] = data.items || [];
      
      // Parse real events only
      const realEvents: GoogleCalendarEvent[] = rawItems
        .filter(item => item.status !== 'cancelled' && item.summary)
        .map(item => ({
          id: item.id,
          summary: item.summary,
          description: item.description,
          location: item.location,
          start: item.start || {},
          end: item.end || {},
          htmlLink: item.htmlLink,
        }));

      localStorage.setItem(STORAGE_KEYS.GCAL_EVENTS, JSON.stringify(realEvents));
      localStorage.setItem(STORAGE_KEYS.GCAL_LAST_SYNC, new Date().toISOString());
      this.notify();

      return { success: true, count: realEvents.length };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sync Google Calendar events' };
    }
  }

  public disconnect(): void {
    localStorage.removeItem(STORAGE_KEYS.GCAL_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GCAL_EVENTS);
    localStorage.setItem(STORAGE_KEYS.GCAL_CONNECTED, 'false');
    localStorage.removeItem(STORAGE_KEYS.GCAL_LAST_SYNC);
    this.notify();
  }

  public importGoogleEventAsTask(
    event: GoogleCalendarEvent, 
    targetProjectId: string, 
    user?: User | null
  ): Task | null {
    const eventDate = event.start.dateTime || event.start.date || new Date().toISOString();
    return dataService.createTask({
      project_id: targetProjectId,
      title: event.summary,
      description: event.description || `Imported from Google Calendar (${event.location || 'Google Event'})`,
      status: 'todo',
      priority: 'warning',
      due_date: eventDate,
      estimate: `Google Event: ${new Date(eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      assignee_id: user?.id,
      assignee: user || undefined,
    }, user || undefined);
  }
}

export const googleCalendarService = new GoogleCalendarService();
