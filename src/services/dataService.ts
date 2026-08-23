import { 
  Project, Task, Milestone, InboxItem, Notification, ActivityLog, 
  TrashItem, User, Attachment, UserRole, TeamCategory, TaskPriority,
  TeamInvitation, AdminPlatformStats, UserConnection, DeadlineReminder, ReminderTier 
} from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Validation } from '../lib/validation';

interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string;
  user: User;
}

// Safe async executor for Supabase queries
const safeSupabaseCall = (query: PromiseLike<any>) => {
  Promise.resolve(query).then((res) => {
    if (res && res.error) {
      console.warn('Supabase operation warning:', res.error);
    }
  }).catch((err) => {
    console.warn('Supabase operation warning:', err);
  });
};

// Known mock user identifiers to scrub from local storage
const MOCK_USER_EMAILS = new Set([
  'alex@projectvault.io',
  'maya@projectvault.io',
  'jordan@projectvault.io',
  'elena@projectvault.io',
  'devon@projectvault.io',
  'alex.mercer@google.com',
]);

const MOCK_USER_IDS = new Set([
  'usr-1',
  'usr-2',
  'usr-3',
  'usr-4',
  'usr-5',
]);

const MOCK_PROJECT_IDS = new Set([
  'proj-1',
  'proj-2',
  'proj-3',
  'proj-4',
  'proj-5',
  'proj-6',
  'proj-cold-1',
  'proj-cold-2',
  'proj-del-1',
]);

const isMockUser = (u: any): boolean => {
  if (!u) return true;
  if (typeof u.id === 'string' && (MOCK_USER_IDS.has(u.id) || u.id.startsWith('usr-google-'))) return true;
  if (typeof u.email === 'string' && (MOCK_USER_EMAILS.has(u.email.toLowerCase()) || u.email.toLowerCase().endsWith('@projectvault.io'))) return true;
  if (u.name === 'Alex Mercer' || u.name === 'Maya Chen' || u.name === 'Jordan Hayes' || u.name === 'Elena Rostova' || u.name === 'Devon Lane') return true;
  return false;
};

const STORAGE_KEYS = {
  USERS: 'pv_users_v1',
  CREDENTIALS: 'pv_credentials_v1',
  PROJECTS: 'pv_projects_v1',
  TASKS: 'pv_tasks_v1',
  MILESTONES: 'pv_milestones_v1',
  ACTIVITY: 'pv_activity_v1',
  TRASH: 'pv_trash_v1',
  INBOX: 'pv_inbox_v1',
  NOTIFICATIONS: 'pv_notifications_v1',
  ATTACHMENTS: 'pv_attachments_v1',
  INVITATIONS: 'pv_invitations_v1',
  CONNECTIONS: 'pv_connections_v1',
  DEADLINE_REMINDERS: 'pv_deadline_reminders_v1',
};

class DataService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initStorage();
    this.checkColdStoreInactivity();
    if (isSupabaseConfigured && supabase) {
      this.syncWithSupabase();
    }
  }

  private initStorage() {
    // 1. Clean Users & Credentials
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers) {
      try {
        const parsed: User[] = JSON.parse(rawUsers);
        const cleaned = parsed.filter(u => !isMockUser(u));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }

    const rawCreds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (rawCreds) {
      try {
        const parsed: UserCredentials[] = JSON.parse(rawCreds);
        const cleaned = parsed.filter(c => !isMockUser(c.user) && !MOCK_USER_EMAILS.has(c.email.toLowerCase()));
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify([]));
    }

    // 2. Clean Projects
    const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (rawProjects) {
      try {
        const parsed: Project[] = JSON.parse(rawProjects);
        const cleaned = parsed.filter(p => !MOCK_PROJECT_IDS.has(p.id)).map(p => ({
          ...p,
          members: (p.members || []).filter(m => !isMockUser(m))
        }));
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    }

    // 3. Clean Tasks
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawTasks) {
      try {
        const parsed: Task[] = JSON.parse(rawTasks);
        const cleaned = parsed.filter(t => !MOCK_PROJECT_IDS.has(t.project_id) && !t.id.startsWith('task-1') && !t.id.startsWith('task-2') && !t.id.startsWith('task-3') && !t.id.startsWith('task-4') && !t.id.startsWith('task-5') && !t.id.startsWith('task-6') && !t.id.startsWith('task-7') && !t.id.startsWith('task-8') && !t.id.startsWith('task-9'));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    }

    // 4. Clean Milestones
    const rawMilestones = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    if (rawMilestones) {
      try {
        const parsed: Milestone[] = JSON.parse(rawMilestones);
        const cleaned = parsed.filter(m => !MOCK_PROJECT_IDS.has(m.project_id) && !m.id.startsWith('ms-1') && !m.id.startsWith('ms-2') && !m.id.startsWith('ms-3') && !m.id.startsWith('ms-4') && !m.id.startsWith('ms-5') && !m.id.startsWith('ms-6'));
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify([]));
    }

    // 5. Clean Activity
    const rawActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (rawActivity) {
      try {
        const parsed: ActivityLog[] = JSON.parse(rawActivity);
        const cleaned = parsed.filter(a => !MOCK_PROJECT_IDS.has(a.project_id) && (!a.user_id || !MOCK_USER_IDS.has(a.user_id)) && a.user_name !== 'Alex Mercer' && a.user_name !== 'Maya Chen' && a.user_name !== 'Jordan Hayes');
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify([]));
    }

    // 6. Clean Trash
    const rawTrash = localStorage.getItem(STORAGE_KEYS.TRASH);
    if (rawTrash) {
      try {
        const parsed: TrashItem[] = JSON.parse(rawTrash);
        const cleaned = parsed.filter(t => !t.id.startsWith('trash-1') && !t.id.startsWith('trash-2') && !t.id.startsWith('trash-3') && !MOCK_PROJECT_IDS.has(t.original_id));
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify([]));
    }

    // 7. Clean Inbox
    const rawInbox = localStorage.getItem(STORAGE_KEYS.INBOX);
    if (rawInbox) {
      try {
        const parsed: InboxItem[] = JSON.parse(rawInbox);
        const cleaned = parsed.filter(i => !i.id.startsWith('inbox-1') && !i.id.startsWith('inbox-2') && !MOCK_USER_IDS.has(i.user_id));
        localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify([]));
    }

    // 8. Clean Notifications
    const rawNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (rawNotifs) {
      try {
        const parsed: Notification[] = JSON.parse(rawNotifs);
        const cleaned = parsed.filter(n => !n.id.startsWith('notif-1') && !n.id.startsWith('notif-2') && !MOCK_USER_IDS.has(n.user_id));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }

    // 9. Clean Attachments
    const rawAttachments = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
    if (rawAttachments) {
      try {
        const parsed: Attachment[] = JSON.parse(rawAttachments);
        const cleaned = parsed.filter(a => !MOCK_PROJECT_IDS.has(a.project_id) && !a.id.startsWith('att-1') && !a.id.startsWith('att-2'));
        localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify([]));
    }

    // 10. Clean Invitations
    if (!localStorage.getItem(STORAGE_KEYS.INVITATIONS)) {
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify([]));
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // --- SUPABASE CLOUD SYNC & REALTIME SUBSCRIPTIONS ---
  public async syncWithSupabase(_user?: User | null) {
    if (!supabase) return;
    try {
      // 1. Sync real Users from Supabase public.users
      const { data: dbUsers, error: uErr } = await supabase.from('users').select('*');
      if (!uErr && dbUsers && dbUsers.length > 0) {
        const existingLocal = this.getUsers();
        const combined = [...existingLocal];
        dbUsers.forEach((u: User) => {
          if (!isMockUser(u)) {
            const idx = combined.findIndex(c => c.id === u.id || c.email.toLowerCase() === u.email.toLowerCase());
            if (idx !== -1) {
              combined[idx] = { ...combined[idx], ...u };
            } else {
              combined.push(u);
            }
          }
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(combined));
        this.notify();
      }

      // 2. Sync Projects
      const { data: dbProjects, error: pErr } = await supabase.from('projects').select('*');
      if (!pErr && dbProjects) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(dbProjects));
        this.notify();
      }

      // 3. Sync Tasks
      const { data: dbTasks, error: tErr } = await supabase.from('tasks').select('*');
      if (!tErr && dbTasks) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(dbTasks));
        this.notify();
      }

      // 4. Sync Milestones
      const { data: dbMilestones, error: mErr } = await supabase.from('milestones').select('*');
      if (!mErr && dbMilestones) {
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(dbMilestones));
        this.notify();
      }

      // 5. Sync Inbox
      const { data: dbInbox, error: iErr } = await supabase.from('inbox_items').select('*');
      if (!iErr && dbInbox) {
        localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(dbInbox));
        this.notify();
      }

      // 6. Sync User Connections
      const { data: dbConns, error: cErr } = await supabase.from('user_connections').select('*');
      if (!cErr && dbConns) {
        const existingConns = this.getConnections();
        const combined = [...existingConns];
        const allUsers = this.getUsers();
        
        dbConns.forEach((c: any) => {
          const reqUser = allUsers.find(u => u.id === c.requester_id);
          const recUser = allUsers.find(u => u.id === c.recipient_id);
          const formatted: UserConnection = {
            id: c.id,
            requester_id: c.requester_id,
            requester_name: reqUser?.name || c.requester_name || 'Member',
            requester_avatar: reqUser?.avatar_url || c.requester_avatar,
            requester_email: reqUser?.email || c.requester_email,
            recipient_id: c.recipient_id,
            recipient_name: recUser?.name || c.recipient_name || 'Member',
            recipient_avatar: recUser?.avatar_url || c.recipient_avatar,
            recipient_email: recUser?.email || c.recipient_email,
            status: c.status,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at || new Date().toISOString(),
          };

          const idx = combined.findIndex(x => x.id === c.id || (x.requester_id === c.requester_id && x.recipient_id === c.recipient_id));
          if (idx !== -1) {
            combined[idx] = { ...combined[idx], ...formatted };
          } else {
            combined.unshift(formatted);
          }
        });
        localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(combined));
        this.notify();
      }

      // 7. Sync Deadline Reminders Log
      const { data: dbReminders, error: remErr } = await supabase.from('deadline_reminders').select('*');
      if (!remErr && dbReminders) {
        const existing = this.getSentDeadlineReminders();
        const combined = [...existing];
        dbReminders.forEach((r: any) => {
          if (!combined.some(x => x.entity_id === r.entity_id && x.recipient_email.toLowerCase() === r.recipient_email.toLowerCase() && x.reminder_tier === r.reminder_tier)) {
            combined.push(r);
          }
        });
        localStorage.setItem(STORAGE_KEYS.DEADLINE_REMINDERS, JSON.stringify(combined));
      }

      // Realtime channel subscriptions
      supabase
        .channel('projectvault-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          this.handleRealtimeUserChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
          this.handleRealtimeProjectChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          this.handleRealtimeTaskChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, (payload) => {
          this.handleRealtimeMilestoneChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_items' }, (payload) => {
          this.handleRealtimeInboxChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_connections' }, (payload) => {
          this.handleRealtimeConnectionChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, (payload) => {
          this.handleRealtimeInvitationChange(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          this.handleRealtimeNotificationChange(payload);
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase sync initialized in fallback mode', err);
    }
  }

  private handleRealtimeUserChange(payload: any) {
    if (!payload.new || isMockUser(payload.new)) return;
    const all = this.getUsers();
    if (payload.eventType === 'INSERT') {
      if (!all.some(u => u.id === payload.new.id || u.email.toLowerCase() === payload.new.email.toLowerCase())) {
        all.push(payload.new);
      }
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(u => u.id === payload.new.id);
      if (idx !== -1) all[idx] = { ...all[idx], ...payload.new };
      else all.push(payload.new);
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(u => u.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeConnectionChange(payload: any) {
    if (!payload.new && payload.eventType !== 'DELETE') return;
    const all = this.getConnections();
    if (payload.eventType === 'INSERT') {
      if (!all.some(c => c.id === payload.new.id)) {
        const reqUser = this.getUserById(payload.new.requester_id);
        const recUser = this.getUserById(payload.new.recipient_id);
        all.unshift({
          ...payload.new,
          requester_name: reqUser?.name || 'Member',
          requester_avatar: reqUser?.avatar_url,
          requester_email: reqUser?.email,
          recipient_name: recUser?.name || 'Member',
          recipient_avatar: recUser?.avatar_url,
          recipient_email: recUser?.email,
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(c => c.id === payload.new.id);
      if (idx !== -1) all[idx] = { ...all[idx], ...payload.new };
      else all.unshift(payload.new);
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(c => c.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeInvitationChange(payload: any) {
    const all = this.getTeamInvitations();
    if (payload.eventType === 'INSERT') {
      if (!all.some(i => i.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(i => i.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(i => i.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeNotificationChange(payload: any) {
    const all = this.getNotifications();
    if (payload.eventType === 'INSERT') {
      if (!all.some(n => n.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(n => n.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(n => n.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeProjectChange(payload: any) {
    const all = this.getAllRawProjects();
    if (payload.eventType === 'INSERT') {
      if (!all.some(p => p.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(p => p.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(p => p.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeTaskChange(payload: any) {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const all: Task[] = data ? JSON.parse(data) : [];
    if (payload.eventType === 'INSERT') {
      if (!all.some(t => t.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(t => t.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(t => t.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeMilestoneChange(payload: any) {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const all: Milestone[] = data ? JSON.parse(data) : [];
    if (payload.eventType === 'INSERT') {
      if (!all.some(m => m.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(m => m.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(m => m.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));
    this.notify();
  }

  private handleRealtimeInboxChange(payload: any) {
    const data = localStorage.getItem(STORAGE_KEYS.INBOX);
    const all: InboxItem[] = data ? JSON.parse(data) : [];
    if (payload.eventType === 'INSERT') {
      if (!all.some(i => i.id === payload.new.id)) all.unshift(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = all.findIndex(i => i.id === payload.new.id);
      if (idx !== -1) all[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      const filtered = all.filter(i => i.id !== payload.old.id);
      localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(filtered));
      this.notify();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(all));
    this.notify();
  }

  // --- USERS & AUTHENTICATION ---
  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const parsed: User[] = data ? JSON.parse(data) : [];
    
    // Deduplicate by ID and email, and scrub any mock users
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const cleaned: User[] = [];

    for (const u of parsed) {
      if (!u || !u.id || !u.email) continue;
      if (isMockUser(u)) continue;
      const normalizedEmail = u.email.toLowerCase().trim();
      if (seenIds.has(u.id) || seenEmails.has(normalizedEmail)) continue;
      seenIds.add(u.id);
      seenEmails.add(normalizedEmail);
      cleaned.push(u);
    }

    return cleaned;
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public registerUser(user: User): User {
    if (isMockUser(user)) return user;
    const users = this.getUsers();
    const existingIdx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase().trim());
    
    if (existingIdx !== -1) {
      users[existingIdx] = { ...users[existingIdx], ...user };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (supabase) {
        safeSupabaseCall(supabase.from('users').upsert([users[existingIdx]]));
      }
      this.notify();
      return users[existingIdx];
    }

    const newUser: User = {
      ...user,
      is_active: true,
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (supabase) {
      safeSupabaseCall(supabase.from('users').upsert([newUser]));
    }

    this.notify();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;

    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (supabase) {
      safeSupabaseCall(supabase.from('users').update(updates).eq('id', id));
    }

    this.notify();
    return users[idx];
  }

  private async hashPassword(password: string, email: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${email.toLowerCase().trim()}:pv_salt_v1:${password}`);
      const buffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return btoa(`${email}:${password}`);
    }
  }

  public async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    const credentials: UserCredentials[] = data ? JSON.parse(data) : [];
    const normalizedEmail = email.toLowerCase().trim();
    const record = credentials.find(c => c.email.toLowerCase() === normalizedEmail);

    if (!record) {
      return { success: false, error: 'No account found with this email address.' };
    }

    const computedHash = await this.hashPassword(password, normalizedEmail);
    if (record.passwordHash !== computedHash && record.passwordHash !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    // Auto-upgrade legacy plaintext record to SHA-256
    if (record.passwordHash === password) {
      record.passwordHash = computedHash;
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    }

    const currentUsers = this.getUsers();
    const liveUser = currentUsers.find(u => u.id === record.user.id) || record.user;
    if (liveUser.is_active === false) {
      return { success: false, error: 'This account has been deactivated by administrator.' };
    }
    return { success: true, user: liveUser };
  }

  public async createUserAccount(email: string, password: string, name: string, role: UserRole = 'user'): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !password || !name) {
      return { success: false, error: 'All fields are required.' };
    }

    const currentUsers = this.getUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=10b981,06b6d4,6366f1`,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    currentUsers.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));

    const computedHash = await this.hashPassword(password, normalizedEmail);
    const credsData = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    const credentials: UserCredentials[] = credsData ? JSON.parse(credsData) : [];
    credentials.push({
      id: newUser.id,
      email: normalizedEmail,
      passwordHash: computedHash,
      user: newUser,
    });
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

    if (supabase) {
      safeSupabaseCall(supabase.from('users').upsert([newUser]));
    }

    this.notify();
    return { success: true, user: newUser };
  }

  // --- PROJECTS (USER SCOPED) ---
  private getAllRawProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  private isUserProjectMember(project: Project, user?: User | null): boolean {
    if (!user) return true;
    if (project.owner_id === user.id) return true;
    if (project.members?.some(m => m.id === user.id || m.email.toLowerCase() === user.email.toLowerCase())) return true;
    return false;
  }

  public getProjects(user?: User | null): Project[] {
    const all = this.getAllRawProjects();
    const active = all.filter(p => p.status !== 'trashed' && p.status !== 'frozen');
    if (!user) return active;
    return active.filter(p => this.isUserProjectMember(p, user));
  }

  public getAllProjects(user?: User | null): Project[] {
    const all = this.getAllRawProjects();
    if (!user) return all;
    return all.filter(p => this.isUserProjectMember(p, user));
  }

  public getProjectById(id: string, user?: User | null): Project | undefined {
    const all = this.getAllRawProjects();
    const project = all.find(p => p.id === id);
    if (!project) return undefined;
    if (user && !this.isUserProjectMember(project, user)) {
      return undefined;
    }
    return project;
  }

  public getColdStoreProjects(user?: User | null): Project[] {
    const all = this.getAllRawProjects();
    const frozen = all.filter(p => p.status === 'frozen');
    if (!user) return frozen;
    return frozen.filter(p => this.isUserProjectMember(p, user));
  }

  public createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'last_active_at' | 'trashed_at' | 'archived_at'>, creator?: User | null): Project {
    const all = this.getAllRawProjects();
    const initialMembers = project.members && project.members.length > 0 
      ? project.members 
      : (creator ? [creator] : []);

    const sanitizedName = Validation.sanitizeText(project.name || 'Untitled Initiative').slice(0, 100);
    const sanitizedDesc = project.description ? Validation.sanitizeText(project.description).slice(0, 2000) : '';

    const newProject: Project = {
      ...project,
      name: sanitizedName,
      description: sanitizedDesc,
      id: `proj-${Date.now()}`,
      owner_id: creator?.id || project.owner_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      trashed_at: null,
      archived_at: null,
      members: initialMembers,
    };
    all.unshift(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(
        supabase.from('projects').insert([{
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          owner_id: newProject.owner_id || null,
          status: newProject.status,
          progress: newProject.progress,
          due_date: newProject.due_date,
          team_category: newProject.team_category,
          tags: newProject.tags,
          last_active_at: newProject.last_active_at,
          created_at: newProject.created_at,
          updated_at: newProject.updated_at,
        }])
      );
    }

    if (creator) {
      this.logActivity(newProject.id, 'created', `Project created: ${newProject.name}`, creator);
    }
    this.notify();
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const all = this.getAllRawProjects();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = {
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('projects').update(updates).eq('id', id));
    }

    this.notify();
    return all[idx];
  }

  public archiveProject(id: string, actor?: User | null): boolean {
    const project = this.getProjectById(id, actor);
    if (!project) return false;
    this.updateProject(id, {
      status: 'frozen',
      archived_at: new Date().toISOString(),
    });
    if (actor) {
      this.logActivity(id, 'archived', `Moved project "${project.name}" to Cold Store archive.`, actor);
    }
    this.notify();
    return true;
  }

  public restoreProject(id: string, actor?: User | null): boolean {
    const project = this.getProjectById(id, actor);
    if (!project) return false;
    this.updateProject(id, {
      status: 'active',
      archived_at: null,
      last_active_at: new Date().toISOString(),
    });
    if (actor) {
      this.logActivity(id, 'restored', `Thawed and restored project "${project.name}" back to active workspace.`, actor);
    }
    this.notify();
    return true;
  }

  public trashProject(id: string, actor?: User | null): boolean {
    const project = this.getProjectById(id, actor);
    if (!project) return false;
    this.updateProject(id, {
      status: 'trashed',
      trashed_at: new Date().toISOString(),
    });
    const trash = this.getTrashItems();
    trash.unshift({
      id: `trash-${Date.now()}`,
      original_id: project.id,
      entity_type: 'Project',
      title: project.name,
      deleted_at: new Date().toISOString(),
      source_workspace: `${project.team_category} workspace`,
      days_remaining: 90,
      data: project,
    });
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    this.notify();
    return true;
  }

  // --- TEAM INVITATIONS ENGINE ---
  public getTeamInvitations(): TeamInvitation[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return data ? JSON.parse(data) : [];
  }

  public getPendingInvitationsForUser(email: string): TeamInvitation[] {
    const all = this.getTeamInvitations();
    return all.filter(i => i.invitee_email.toLowerCase() === email.toLowerCase().trim() && i.status === 'pending');
  }

  public getProjectInvitations(projectId: string): TeamInvitation[] {
    const all = this.getTeamInvitations();
    return all.filter(i => i.project_id === projectId);
  }

  public createTeamInvitation(projectId: string, inviteeEmail: string, inviter: User, role: 'member' | 'viewer' = 'member'): TeamInvitation {
    const project = this.getProjectById(projectId, inviter);
    if (!project) throw new Error('Project not found or you are not authorized to invite members.');

    const all = this.getTeamInvitations();
    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    // Check if user is already a member
    if (project.members?.some(m => m.email.toLowerCase() === normalizedEmail)) {
      throw new Error(`${inviteeEmail} is already a member of this project.`);
    }

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      project_id: project.id,
      project_name: project.name,
      inviter_id: inviter.id,
      inviter_name: inviter.name,
      inviter_avatar: inviter.avatar_url,
      invitee_email: normalizedEmail,
      role,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    all.unshift(invitation);
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));

    // Send notification to invitee
    this.sendNotification({
      user_id: normalizedEmail,
      title: 'Team Invitation',
      message: `${inviter.name} invited you to join "${project.name}".`,
      type: 'info',
      invitation_id: invitation.id,
    });

    this.logActivity(project.id, 'alert', `Invited ${normalizedEmail} to join the project team.`, inviter);
    this.notify();
    return invitation;
  }

  public acceptTeamInvitation(invitationId: string, user: User): boolean {
    const invitations = this.getTeamInvitations();
    const invite = invitations.find(i => i.id === invitationId);
    if (!invite || invite.status !== 'pending') return false;

    // Add user to project members
    const allProjects = this.getAllRawProjects();
    const projIdx = allProjects.findIndex(p => p.id === invite.project_id);
    if (projIdx !== -1) {
      const proj = allProjects[projIdx];
      const members = proj.members || [];
      if (!members.some(m => m.id === user.id || m.email.toLowerCase() === user.email.toLowerCase())) {
        members.push(user);
        proj.members = members;
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(allProjects));
      }
    }

    invite.status = 'accepted';
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));

    this.logActivity(invite.project_id, 'alert', `${user.name} accepted the invitation and joined the team.`, user);
    this.notify();
    return true;
  }

  public declineTeamInvitation(invitationId: string): boolean {
    const invitations = this.getTeamInvitations();
    const invite = invitations.find(i => i.id === invitationId);
    if (!invite) return false;

    invite.status = 'declined';
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
    this.notify();
    return true;
  }

  // --- USER CONNECTIONS (MUTUAL NETWORK SYSTEM) ---
  public getConnections(user?: User | null): UserConnection[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    const all: UserConnection[] = data ? JSON.parse(data) : [];
    if (!user) return all;
    return all.filter(c => 
      c.requester_id === user.id || 
      c.recipient_id === user.id ||
      (c.requester_email && c.requester_email.toLowerCase() === user.email.toLowerCase()) ||
      (c.recipient_email && c.recipient_email.toLowerCase() === user.email.toLowerCase())
    );
  }

  public getAcceptedConnections(user?: User | null): UserConnection[] {
    return this.getConnections(user).filter(c => c.status === 'accepted');
  }

  public getPendingConnections(user?: User | null): UserConnection[] {
    return this.getConnections(user).filter(c => c.status === 'pending');
  }

  public getNetworkUsers(user?: User | null): User[] {
    if (!user) return this.getUsers();
    const accepted = this.getAcceptedConnections(user);
    const allUsers = this.getUsers();
    
    // Connected user IDs
    const connectedIds = new Set<string>();
    const connectedEmails = new Set<string>();

    accepted.forEach(c => {
      if (c.requester_id === user.id) {
        connectedIds.add(c.recipient_id);
        if (c.recipient_email) connectedEmails.add(c.recipient_email.toLowerCase());
      } else {
        connectedIds.add(c.requester_id);
        if (c.requester_email) connectedEmails.add(c.requester_email.toLowerCase());
      }
    });

    // Also include co-members from existing shared projects
    const userProjects = this.getProjects(user);
    userProjects.forEach(p => {
      p.members?.forEach(m => {
        if (m.id !== user.id) {
          connectedIds.add(m.id);
          connectedEmails.add(m.email.toLowerCase());
        }
      });
    });

    const network = allUsers.filter(u => 
      u.id === user.id || 
      connectedIds.has(u.id) || 
      connectedEmails.has(u.email.toLowerCase())
    );

    // Make sure currentUser is always included at the top
    if (!network.some(u => u.id === user.id)) {
      network.unshift(user);
    }
    return network;
  }

  public sendConnectionRequest(target: User | string, currentUser: User): { success: boolean; error?: string } {
    if (!currentUser) return { success: false, error: 'You must be logged in.' };

    let recipient: User | undefined;
    let targetEmail = '';

    if (typeof target === 'string') {
      const trimmed = target.trim();
      recipient = this.getUserById(trimmed) || this.getUserByEmail(trimmed);
      if (!recipient && trimmed.includes('@')) {
        targetEmail = trimmed.toLowerCase();
      } else if (!recipient) {
        return { success: false, error: `User "${trimmed}" not found. Please enter a valid email address.` };
      }
    } else {
      recipient = target;
    }

    if (recipient) {
      targetEmail = recipient.email.toLowerCase();
      if (recipient.id === currentUser.id || recipient.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return { success: false, error: 'Cannot connect with yourself.' };
      }
    } else if (targetEmail && targetEmail === currentUser.email.toLowerCase()) {
      return { success: false, error: 'Cannot connect with yourself.' };
    }

    const all = this.getConnections();
    const existing = all.find(c => 
      (recipient && ((c.requester_id === currentUser.id && c.recipient_id === recipient.id) || (c.requester_id === recipient.id && c.recipient_id === currentUser.id))) ||
      (targetEmail && ((c.requester_email?.toLowerCase() === currentUser.email.toLowerCase() && c.recipient_email?.toLowerCase() === targetEmail) ||
       (c.requester_email?.toLowerCase() === targetEmail && c.recipient_email?.toLowerCase() === currentUser.email.toLowerCase())))
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, error: 'You are already connected with this user.' };
      }
      if (existing.status === 'pending') {
        if (existing.requester_id === currentUser.id || existing.requester_email?.toLowerCase() === currentUser.email.toLowerCase()) {
          return { success: false, error: 'Connection request already sent and pending.' };
        } else {
          // If the other user already sent a request, auto-accept it!
          this.acceptConnectionRequest(existing.id, currentUser);
          return { success: true };
        }
      }
    }

    const newConnection: UserConnection = {
      id: `conn-${Date.now()}`,
      requester_id: currentUser.id,
      requester_name: currentUser.name,
      requester_avatar: currentUser.avatar_url,
      requester_email: currentUser.email,
      recipient_id: recipient?.id || `pending-email-${Date.now()}`,
      recipient_name: recipient?.name || targetEmail.split('@')[0],
      recipient_avatar: recipient?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetEmail.split('@')[0])}`,
      recipient_email: targetEmail,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newConnection);
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('user_connections').insert([{
        id: newConnection.id,
        requester_id: newConnection.requester_id,
        recipient_id: recipient?.id || null,
        status: newConnection.status,
        created_at: newConnection.created_at,
        updated_at: newConnection.updated_at,
      }]));
    }

    // Send interactive notification to recipient if known
    if (recipient) {
      this.sendNotification({
        user_id: recipient.id,
        title: 'New Connection Request',
        message: `${currentUser.name} wants to connect with you on Slow Spider.`,
        type: 'info',
        connection_id: newConnection.id,
      });
    }

    this.notify();
    return { success: true };
  }

  public acceptConnectionRequest(connectionId: string, currentUser: User): boolean {
    const all = this.getConnections();
    const idx = all.findIndex(c => c.id === connectionId);
    if (idx === -1) return false;

    const conn = all[idx];
    conn.status = 'accepted';
    conn.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('user_connections').update({ status: 'accepted', updated_at: conn.updated_at }).eq('id', connectionId));
    }

    // Notify requester
    const otherUserId = conn.requester_id === currentUser.id ? conn.recipient_id : conn.requester_id;
    this.sendNotification({
      user_id: otherUserId,
      title: 'Connection Accepted',
      message: `${currentUser.name} accepted your connection request. You can now collaborate on projects!`,
      type: 'success',
    });

    this.notify();
    return true;
  }

  public declineConnectionRequest(connectionId: string, _currentUser: User): boolean {
    const all = this.getConnections();
    const idx = all.findIndex(c => c.id === connectionId);
    if (idx === -1) return false;

    all.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('user_connections').delete().eq('id', connectionId));
    }

    this.notify();
    return true;
  }

  public removeConnection(connectionId: string, currentUser: User): boolean {
    return this.declineConnectionRequest(connectionId, currentUser);
  }

  public searchUsersToConnect(query: string, currentUser?: User | null): { user: User; connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'self' }[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const allUsers = this.getUsers();
    const connections = currentUser ? this.getConnections(currentUser) : [];

    return allUsers
      .filter(u => 
        u.name.toLowerCase().includes(normalizedQuery) || 
        u.email.toLowerCase().includes(normalizedQuery)
      )
      .map(u => {
        if (currentUser && u.id === currentUser.id) {
          return { user: u, connectionStatus: 'self' as const };
        }

        const conn = connections.find(c => 
          (c.requester_id === u.id || c.recipient_id === u.id) ||
          (c.requester_email?.toLowerCase() === u.email.toLowerCase() || c.recipient_email?.toLowerCase() === u.email.toLowerCase())
        );

        if (!conn) return { user: u, connectionStatus: 'none' as const };
        if (conn.status === 'accepted') return { user: u, connectionStatus: 'connected' as const };
        if (conn.status === 'pending') {
          if (currentUser && (conn.requester_id === currentUser.id || conn.requester_email?.toLowerCase() === currentUser.email.toLowerCase())) {
            return { user: u, connectionStatus: 'pending_sent' as const };
          }
          return { user: u, connectionStatus: 'pending_received' as const };
        }
        return { user: u, connectionStatus: 'none' as const };
      });
  }

  public async searchUsersAsync(query: string, currentUser?: User | null): Promise<{ user: User; connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'self' }[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Live query from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbUsers, error } = await supabase
          .from('users')
          .select('*')
          .or(`name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
          .limit(25);

        if (!error && dbUsers && dbUsers.length > 0) {
          const existing = this.getUsers();
          const combined = [...existing];
          let updated = false;

          dbUsers.forEach((u: User) => {
            if (!isMockUser(u)) {
              const idx = combined.findIndex(c => c.id === u.id || c.email.toLowerCase() === u.email.toLowerCase());
              if (idx !== -1) {
                combined[idx] = { ...combined[idx], ...u };
              } else {
                combined.push(u);
                updated = true;
              }
            }
          });

          if (updated) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(combined));
            this.notify();
          }
        }
      } catch (err) {
        console.warn('Live user search warning:', err);
      }
    }

    return this.searchUsersToConnect(query, currentUser);
  }

  // --- TASKS (USER SCOPED) ---
  public getTasks(projectId?: string, user?: User | null): Task[] {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    const active = allTasks.filter(t => !t.trashed_at);

    if (projectId) {
      return active.filter(t => t.project_id === projectId);
    }

    if (user) {
      const userProjects = this.getProjects(user);
      const userProjectIds = new Set(userProjects.map(p => p.id));
      return active.filter(t => userProjectIds.has(t.project_id) || t.assignee_id === user.id || t.assignee?.email?.toLowerCase() === user.email?.toLowerCase());
    }

    return active;
  }

  public createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'trashed_at'>, actor?: User | null): Task {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const all: Task[] = data ? JSON.parse(data) : [];
    const assignedUser = task.assignee || (task.assignee_id ? this.getUserById(task.assignee_id) : (actor || undefined));
    
    const sanitizedTitle = Validation.sanitizeText(task.title || 'Untitled task').slice(0, 150);
    const sanitizedDesc = task.description ? Validation.sanitizeText(task.description).slice(0, 3000) : '';

    const newTask: Task = {
      ...task,
      title: sanitizedTitle,
      description: sanitizedDesc,
      id: `task-${Date.now()}`,
      trashed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assignee: assignedUser,
    };
    all.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(
        supabase.from('tasks').insert([{
          id: newTask.id,
          project_id: newTask.project_id,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.due_date,
          estimate: newTask.estimate,
          assignee_id: newTask.assignee_id || null,
          created_at: newTask.created_at,
          updated_at: newTask.updated_at,
        }])
      );
    }

    this.updateProjectActivity(newTask.project_id);
    this.notify();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const all: Task[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    all[idx] = {
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('tasks').update(updates).eq('id', id));
    }

    this.updateProjectActivity(all[idx].project_id);
    this.notify();
    return all[idx];
  }

  public toggleTaskCompletion(id: string, actor?: User | null): Task | undefined {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const all: Task[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    const newStatus = all[idx].status === 'done' ? 'todo' : 'done';
    all[idx].status = newStatus;
    all[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('tasks').update({ status: newStatus, updated_at: all[idx].updated_at }).eq('id', id));
    }
    
    if (newStatus === 'done' && actor) {
      this.logActivity(all[idx].project_id, 'task_completed', `Completed task: "${all[idx].title}"`, actor);
    }
    this.updateProjectActivity(all[idx].project_id);
    this.notify();
    return all[idx];
  }

  public trashTask(id: string, actor?: User | null): boolean {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const all: Task[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const task = all[idx];
    task.trashed_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('tasks').update({ trashed_at: task.trashed_at }).eq('id', id));
    }
    
    const trash = this.getTrashItems();
    trash.unshift({
      id: `trash-${Date.now()}`,
      original_id: task.id,
      entity_type: 'Task',
      title: task.title,
      deleted_at: new Date().toISOString(),
      source_workspace: 'Project tasks',
      days_remaining: 90,
      data: task,
    });
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    if (actor) {
      this.logActivity(task.project_id, 'alert', `Deleted task "${task.title}" and moved to Trash.`, actor);
    }
    this.notify();
    return true;
  }

  // --- MILESTONES ---
  public getMilestones(projectId?: string): Milestone[] {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const milestones: Milestone[] = data ? JSON.parse(data) : [];
    const active = milestones.filter(m => !m.trashed_at);
    if (projectId) {
      return active.filter(m => m.project_id === projectId);
    }
    return active;
  }

  public createMilestone(milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at' | 'trashed_at'>): Milestone {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const all: Milestone[] = data ? JSON.parse(data) : [];
    const sanitizedTitle = Validation.sanitizeText(milestone.title || 'Checkpoint').slice(0, 150);

    const newMilestone: Milestone = {
      ...milestone,
      title: sanitizedTitle,
      id: `ms-${Date.now()}`,
      trashed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(newMilestone);
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(
        supabase.from('milestones').insert([{
          id: newMilestone.id,
          project_id: newMilestone.project_id,
          title: newMilestone.title,
          description: newMilestone.description,
          status: newMilestone.status,
          due_date: newMilestone.due_date,
          created_at: newMilestone.created_at,
          updated_at: newMilestone.updated_at,
        }])
      );
    }

    this.recalculateProjectProgress(newMilestone.project_id);
    this.notify();
    return newMilestone;
  }

  public toggleMilestoneDone(id: string, actor?: User | null): Milestone | undefined {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const all: Milestone[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    const current = all[idx];
    const newStatus = current.status === 'done' ? 'upcoming' : 'done';
    current.status = newStatus;
    current.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('milestones').update({ status: newStatus, updated_at: current.updated_at }).eq('id', id));
    }
    
    this.recalculateProjectProgress(current.project_id);
    if (actor) {
      this.logActivity(current.project_id, 'status_change', `Milestone "${current.title}" marked as ${newStatus === 'done' ? 'Done' : 'In Progress'}`, actor);
    }
    this.notify();
    return current;
  }

  public trashMilestone(id: string, actor?: User | null): boolean {
    const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    const all: Milestone[] = data ? JSON.parse(data) : [];
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return false;
    const ms = all[idx];
    ms.trashed_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(supabase.from('milestones').update({ trashed_at: ms.trashed_at }).eq('id', id));
    }
    
    this.recalculateProjectProgress(ms.project_id);
    const trash = this.getTrashItems();
    trash.unshift({
      id: `trash-${Date.now()}`,
      original_id: ms.id,
      entity_type: 'Milestone',
      title: ms.title,
      deleted_at: new Date().toISOString(),
      source_workspace: 'Project milestones',
      days_remaining: 90,
      data: ms,
    });
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trash));
    if (actor) {
      this.logActivity(ms.project_id, 'alert', `Deleted milestone "${ms.title}" and moved to Trash.`, actor);
    }
    this.notify();
    return true;
  }

  public recalculateProjectProgress(projectId: string) {
    const milestones = this.getMilestones(projectId);
    if (milestones.length === 0) return;
    const done = milestones.filter(m => m.status === 'done').length;
    const progress = Math.round((done / milestones.length) * 100);
    this.updateProject(projectId, { progress });
  }

  // --- TRASH & RETENTION ---
  public getTrashItems(user?: User | null): TrashItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRASH);
    const all: TrashItem[] = data ? JSON.parse(data) : [];
    if (!user) return all;
    return all;
  }

  public restoreTrashItem(trashId: string): boolean {
    const trash = this.getTrashItems();
    const item = trash.find(t => t.id === trashId);
    if (!item) return false;

    if (item.entity_type === 'Project') {
      const all = this.getAllRawProjects();
      const proj = all.find(p => p.id === item.original_id);
      if (proj) {
        proj.status = 'active';
        proj.trashed_at = null;
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
        if (supabase) {
          safeSupabaseCall(supabase.from('projects').update({ status: 'active', trashed_at: null }).eq('id', proj.id));
        }
      }
    } else if (item.entity_type === 'Task') {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      const all: Task[] = data ? JSON.parse(data) : [];
      const t = all.find(x => x.id === item.original_id);
      if (t) {
        t.trashed_at = null;
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all));
        if (supabase) {
          safeSupabaseCall(supabase.from('tasks').update({ trashed_at: null }).eq('id', t.id));
        }
      }
    } else if (item.entity_type === 'Milestone') {
      const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      const all: Milestone[] = data ? JSON.parse(data) : [];
      const m = all.find(x => x.id === item.original_id);
      if (m) {
        m.trashed_at = null;
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all));
        if (supabase) {
          safeSupabaseCall(supabase.from('milestones').update({ trashed_at: null }).eq('id', m.id));
        }
        this.recalculateProjectProgress(m.project_id);
      }
    }

    const filtered = trash.filter(t => t.id !== trashId);
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(filtered));
    this.notify();
    return true;
  }

  public permanentDeleteTrashItem(trashId: string): boolean {
    const trash = this.getTrashItems();
    const item = trash.find(t => t.id === trashId);
    if (!item) return false;

    if (item.entity_type === 'Project') {
      const all = this.getAllRawProjects().filter(p => p.id !== item.original_id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
      if (supabase) safeSupabaseCall(supabase.from('projects').delete().eq('id', item.original_id));
    } else if (item.entity_type === 'Task') {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      const all: Task[] = data ? JSON.parse(data) : [];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(all.filter(t => t.id !== item.original_id)));
      if (supabase) safeSupabaseCall(supabase.from('tasks').delete().eq('id', item.original_id));
    } else if (item.entity_type === 'Milestone') {
      const data = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      const all: Milestone[] = data ? JSON.parse(data) : [];
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(all.filter(m => m.id !== item.original_id)));
      if (supabase) safeSupabaseCall(supabase.from('milestones').delete().eq('id', item.original_id));
    }

    const filtered = trash.filter(t => t.id !== trashId);
    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(filtered));
    this.notify();
    return true;
  }

  public restoreAllTrash(): void {
    const trash = this.getTrashItems();
    trash.forEach(t => this.restoreTrashItem(t.id));
  }

  // --- INBOX (USER SCOPED) ---
  public getInboxItems(user?: User | null): InboxItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.INBOX);
    const items: InboxItem[] = data ? JSON.parse(data) : [];
    const active = items.filter(i => i.status === 'inbox');
    if (!user) return active;
    return active.filter(i => i.user_id === user.id || i.user_id === user.email);
  }

  public createInboxItem(item: Omit<InboxItem, 'id' | 'created_at' | 'status' | 'user_id'>, user?: User | null): InboxItem {
    const data = localStorage.getItem(STORAGE_KEYS.INBOX);
    const all: InboxItem[] = data ? JSON.parse(data) : [];
    const newItem: InboxItem = {
      ...item,
      id: `inbox-${Date.now()}`,
      user_id: user?.id || '',
      status: 'inbox',
      created_at: new Date().toISOString(),
    };
    all.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(all));

    if (supabase && user?.id) {
      safeSupabaseCall(
        supabase.from('inbox_items').insert([{
          id: newItem.id,
          user_id: newItem.user_id,
          type: newItem.type,
          title: newItem.title,
          content: newItem.content,
          status: newItem.status,
          created_at: newItem.created_at,
        }])
      );
    }

    this.notify();
    return newItem;
  }

  public deleteInboxItem(id: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.INBOX);
    const all: InboxItem[] = data ? JSON.parse(data) : [];
    const filtered = all.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(filtered));
    if (supabase) safeSupabaseCall(supabase.from('inbox_items').delete().eq('id', id));
    this.notify();
  }

  public convertInboxItemToTask(inboxId: string, projectId: string, priority: TaskPriority = 'normal', user?: User | null): Task | null {
    const item = this.getInboxItems(user).find(i => i.id === inboxId);
    if (!item) return null;
    const task = this.createTask({
      project_id: projectId,
      title: item.title,
      description: item.content,
      status: 'todo',
      priority,
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
      assignee_id: user?.id,
      assignee: user || undefined,
    }, user);
    this.deleteInboxItem(inboxId);
    return task;
  }

  public convertInboxItemToProject(inboxId: string, teamCategory: TeamCategory = 'Product team', user?: User | null): Project | null {
    const item = this.getInboxItems(user).find(i => i.id === inboxId);
    if (!item) return null;
    const project = this.createProject({
      name: item.title,
      description: item.content || '',
      owner_id: user?.id || '',
      status: 'active',
      progress: 0,
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      team_category: teamCategory,
      tags: ['NEW'],
      members: user ? [user] : [],
    }, user);
    this.deleteInboxItem(inboxId);
    return project;
  }

  // --- ACTIVITY LOGS ---
  public getActivityLogs(projectId?: string): ActivityLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const all: ActivityLog[] = data ? JSON.parse(data) : [];
    if (projectId) {
      return all.filter(a => a.project_id === projectId);
    }
    return all;
  }

  public logActivity(projectId: string, actionType: ActivityLog['action_type'], description: string, actor?: User): void {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const all: ActivityLog[] = data ? JSON.parse(data) : [];
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      project_id: projectId,
      user_id: actor?.id,
      user_name: actor?.name || 'Workspace Member',
      user_avatar: actor?.avatar_url,
      action_type: actionType,
      description,
      created_at: new Date().toISOString(),
    };
    all.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(all));

    if (supabase) {
      safeSupabaseCall(
        supabase.from('activity_logs').insert([{
          id: newLog.id,
          project_id: newLog.project_id,
          user_id: newLog.user_id || null,
          user_name: newLog.user_name,
          user_avatar: newLog.user_avatar || null,
          action_type: newLog.action_type,
          description: newLog.description,
          created_at: newLog.created_at,
        }])
      );
    }

    this.notify();
  }

  // --- NOTIFICATIONS ---
  public getNotifications(user?: User | null): Notification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: Notification[] = data ? JSON.parse(data) : [];
    if (!user) return all;
    return all.filter(n => n.user_id === user.id || n.user_id.toLowerCase() === user.email.toLowerCase());
  }

  public sendNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Notification {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: Notification[] = data ? JSON.parse(data) : [];
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    all.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: Notification[] = data ? JSON.parse(data) : [];
    const item = all.find(n => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(user?: User | null): void {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: Notification[] = data ? JSON.parse(data) : [];
    all.forEach(n => {
      if (!user || n.user_id === user.id || n.user_id === user.email) {
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  // --- ATTACHMENTS ---
  public getAttachments(projectId: string): Attachment[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
    const all: Attachment[] = data ? JSON.parse(data) : [];
    return all.filter(a => a.project_id === projectId);
  }

  public addAttachment(attachment: Omit<Attachment, 'id' | 'created_at'>): Attachment {
    const data = localStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
    const all: Attachment[] = data ? JSON.parse(data) : [];
    const newAtt: Attachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(newAtt);
    localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(all));
    this.notify();
    return newAtt;
  }

  // --- MASTER ADMIN PORTAL ENGINE ---
  public getAdminPlatformStats(): AdminPlatformStats {
    const users = this.getUsers();
    const projects = this.getAllRawProjects();
    const dataTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks: Task[] = dataTasks ? JSON.parse(dataTasks) : [];
    const activeTasks = tasks.filter(t => !t.trashed_at);
    const completedTasks = activeTasks.filter(t => t.status === 'done');
    const avgRate = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;

    return {
      total_users: users.length,
      active_users: users.filter(u => u.is_active !== false).length,
      total_projects: projects.length,
      active_projects: projects.filter(p => p.status === 'active' || p.status === 'at_risk' || p.status === 'overdue').length,
      cold_store_projects: projects.filter(p => p.status === 'frozen').length,
      trashed_projects: projects.filter(p => p.status === 'trashed').length,
      total_tasks: activeTasks.length,
      completed_tasks: completedTasks.length,
      avg_completion_rate: avgRate,
      database_status: isSupabaseConfigured ? 'Connected' : 'Local Mode',
      recent_logins_24h: Math.max(1, users.length),
    };
  }

  public getAllPlatformUsers(): User[] {
    return this.getUsers();
  }

  public getAllPlatformProjects(): Project[] {
    return this.getAllRawProjects();
  }

  public toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const u = users.find(x => x.id === userId);
    if (!u) return false;
    u.is_active = u.is_active === false ? true : false;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
    return true;
  }

  public deletePlatformUser(userId: string): boolean {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
    return true;
  }

  // --- DEADLINE REMINDERS LOG ---
  public getSentDeadlineReminders(): DeadlineReminder[] {
    const data = localStorage.getItem(STORAGE_KEYS.DEADLINE_REMINDERS);
    return data ? JSON.parse(data) : [];
  }

  public isDeadlineReminderSent(entityType: string, entityId: string, recipientEmail: string, tier: ReminderTier): boolean {
    const all = this.getSentDeadlineReminders();
    const normalizedEmail = recipientEmail.toLowerCase().trim();
    return all.some(r => 
      r.entity_type === entityType && 
      r.entity_id === entityId && 
      r.recipient_email.toLowerCase().trim() === normalizedEmail && 
      r.reminder_tier === tier
    );
  }

  public recordDeadlineReminder(reminder: DeadlineReminder): void {
    const all = this.getSentDeadlineReminders();
    if (!this.isDeadlineReminderSent(reminder.entity_type, reminder.entity_id, reminder.recipient_email, reminder.reminder_tier)) {
      all.push(reminder);
      localStorage.setItem(STORAGE_KEYS.DEADLINE_REMINDERS, JSON.stringify(all));

      if (supabase) {
        safeSupabaseCall(supabase.from('deadline_reminders').insert([{
          id: reminder.id,
          entity_type: reminder.entity_type,
          entity_id: reminder.entity_id,
          recipient_id: reminder.recipient_id || null,
          recipient_email: reminder.recipient_email,
          reminder_tier: reminder.reminder_tier,
          sent_at: reminder.sent_at,
        }]));
      }
    }
  }

  private updateProjectActivity(projectId: string) {
    const all = this.getAllRawProjects();
    const p = all.find(x => x.id === projectId);
    if (p) {
      p.last_active_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    }
  }

  private checkColdStoreInactivity() {
    const all = this.getAllRawProjects();
    const now = Date.now();
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    let modified = false;

    all.forEach(p => {
      if (p.status === 'active') {
        const lastActive = new Date(p.last_active_at).getTime();
        if (now - lastActive > SIXTY_DAYS_MS) {
          p.status = 'frozen';
          p.archived_at = new Date().toISOString();
          modified = true;
        }
      }
    });

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    }
  }
}

export const dataService = new DataService();
