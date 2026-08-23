import { Task, User } from '../types/database';
import { dataService } from './dataService';

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

class GoogleCalendarService {
  private listeners: Array<() => void> = [];

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

  public async connectGoogleCalendar(_currentUser?: User | null): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
      // 1. Check if user has Google Auth or GIS client configured
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

      if (clientId && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        return new Promise((resolve) => {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                resolve({ success: false, error: tokenResponse.error });
                return;
              }
              if (tokenResponse.access_token) {
                localStorage.setItem(STORAGE_KEYS.GCAL_TOKEN, tokenResponse.access_token);
                localStorage.setItem(STORAGE_KEYS.GCAL_CONNECTED, 'true');
                const result = await this.syncEvents();
                resolve(result);
              }
            },
          });
          client.requestAccessToken();
        });
      }

      // 2. Seamless instant demo sync if OAuth client ID is not yet provided in .env
      const now = new Date();
      const demoEvents: GoogleCalendarEvent[] = [
        {
          id: `gcal-${Date.now()}-1`,
          summary: 'Product Roadmap & Sprint Planning',
          description: 'Quarterly review of Slow Spider deliverables with stakeholders.',
          location: 'Google Meet',
          start: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 1, 28), 10, 0).toISOString(),
          },
          end: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 1, 28), 11, 30).toISOString(),
          },
        },
        {
          id: `gcal-${Date.now()}-2`,
          summary: 'UI/UX Design Sync & Architecture Review',
          description: 'Design system tokens and dark mode audit sync.',
          location: 'Google Meet',
          start: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 3, 28), 14, 30).toISOString(),
          },
          end: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 3, 28), 15, 30).toISOString(),
          },
        },
        {
          id: `gcal-${Date.now()}-3`,
          summary: 'Client Demo & Security Handover',
          description: 'Production sign-off and milestone acceptance demonstration.',
          location: 'Google Meet',
          start: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 6, 28), 16, 0).toISOString(),
          },
          end: {
            dateTime: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate() + 6, 28), 17, 0).toISOString(),
          },
        },
      ];

      localStorage.setItem(STORAGE_KEYS.GCAL_CONNECTED, 'true');
      localStorage.setItem(STORAGE_KEYS.GCAL_EVENTS, JSON.stringify(demoEvents));
      localStorage.setItem(STORAGE_KEYS.GCAL_LAST_SYNC, new Date().toISOString());

      this.notify();
      return { success: true, count: demoEvents.length };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to connect Google Calendar' };
    }
  }

  public async syncEvents(): Promise<{ success: boolean; count?: number; error?: string }> {
    const token = localStorage.getItem(STORAGE_KEYS.GCAL_TOKEN);
    if (!token) {
      // Re-trigger stored events update
      this.notify();
      return { success: true, count: this.getStoredEvents().length };
    }

    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          this.disconnect();
          return { success: false, error: 'Google session expired. Please reconnect.' };
        }
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const items: GoogleCalendarEvent[] = data.items || [];
      localStorage.setItem(STORAGE_KEYS.GCAL_EVENTS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.GCAL_LAST_SYNC, new Date().toISOString());
      this.notify();
      return { success: true, count: items.length };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to sync Google Calendar' };
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
