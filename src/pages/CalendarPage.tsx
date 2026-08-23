import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, AlertTriangle, Flag, CheckCircle2, Circle,
  RefreshCw, Check, Download
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { dataService } from '../services/dataService';
import { googleCalendarService, GoogleCalendarEvent } from '../services/googleCalendarService';
import { useAuth } from '../context/AuthContext';
import { Task, Milestone, Project } from '../types/database';
import { formatDateTime } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  project: string;
  category: 'critical' | 'approaching' | 'milestone' | 'general' | 'google';
  time: string;
  status: 'pending' | 'in_progress' | 'completed';
  dateStr: string;
  day: number;
  rawGoogleEvent?: GoogleCalendarEvent;
}

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());

  // Category filter states
  const [filterCritical, setFilterCritical] = useState(true);
  const [filterApproaching, setFilterApproaching] = useState(true);
  const [filterMilestones, setFilterMilestones] = useState(true);
  const [filterGeneral, setFilterGeneral] = useState(true);
  const [filterGoogle, setFilterGoogle] = useState(true);

  // Live data from dataService
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Google Calendar Integration states
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => googleCalendarService.isConnected());
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>(() => googleCalendarService.getStoredEvents());
  const [isSyncing, setIsSyncing] = useState(false);
  const [importingEvent, setImportingEvent] = useState<GoogleCalendarEvent | null>(null);
  const [importTargetProjectId, setImportTargetProjectId] = useState<string>('');
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const userProjects = dataService.getProjects(user);
      setProjects(userProjects);
      setTasks(dataService.getTasks(undefined, user));
      
      const allMs: Milestone[] = [];
      userProjects.forEach(p => {
        allMs.push(...dataService.getMilestones(p.id));
      });
      setMilestones(allMs);
      if (userProjects.length > 0 && !importTargetProjectId) {
        setImportTargetProjectId(userProjects[0].id);
      }
    };
    update();
    const unsubData = dataService.subscribe(update);

    const updateGCal = () => {
      setIsGoogleConnected(googleCalendarService.isConnected());
      setGoogleEvents(googleCalendarService.getStoredEvents());
    };
    const unsubGCal = googleCalendarService.subscribe(updateGCal);

    // Check if returning from Google OAuth redirect with provider_token
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        const token = (data?.session as any)?.provider_token;
        if (token && !localStorage.getItem('pv_gcal_token_v1')) {
          localStorage.setItem('pv_gcal_token_v1', token);
          localStorage.setItem('pv_gcal_connected_v1', 'true');
          googleCalendarService.syncEvents();
        }
      });
    }

    return () => {
      unsubData();
      unsubGCal();
    };
  }, [user, importTargetProjectId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Derive real events from tasks, milestones, and synced Google Calendar events
  const allEvents: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];

    // 1. Add Milestones
    milestones.forEach(m => {
      if (!m.due_date) return;
      const mDate = new Date(m.due_date);
      if (mDate.getFullYear() === year && mDate.getMonth() === month) {
        list.push({
          id: `ms-${m.id}`,
          title: m.title,
          project: projectMap.get(m.project_id) || 'Workspace Project',
          category: 'milestone',
          time: formatDateTime(m.due_date) || 'Milestone Checkpoint',
          status: m.status === 'done' ? 'completed' : m.status === 'overdue' ? 'pending' : 'in_progress',
          dateStr: m.due_date,
          day: mDate.getDate(),
        });
      }
    });

    // 2. Add Tasks
    tasks.forEach(t => {
      if (!t.due_date) return;
      const tDate = new Date(t.due_date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        let category: CalendarEvent['category'] = 'general';
        if (t.priority === 'critical') category = 'critical';
        else if (t.priority === 'warning') category = 'approaching';

        list.push({
          id: `task-${t.id}`,
          title: t.title,
          project: projectMap.get(t.project_id) || 'Project Task',
          category,
          time: formatDateTime(t.due_date) || (t.estimate || 'All Day'),
          status: t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'pending',
          dateStr: t.due_date,
          day: tDate.getDate(),
        });
      }
    });

    // 3. Add Google Calendar Events (100% Real)
    if (isGoogleConnected) {
      googleEvents.forEach(ge => {
        const dateStr = ge.start.dateTime || ge.start.date;
        if (!dateStr) return;
        const gDate = new Date(dateStr);
        if (gDate.getFullYear() === year && gDate.getMonth() === month) {
          const timeFormatted = ge.start.dateTime 
            ? new Date(ge.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'All Day';

          list.push({
            id: `gcal-${ge.id}`,
            title: ge.summary,
            project: 'Google Calendar Event',
            category: 'google',
            time: timeFormatted,
            status: 'pending',
            dateStr: dateStr,
            day: gDate.getDate(),
            rawGoogleEvent: ge,
          });
        }
      });
    }

    return list;
  }, [milestones, tasks, googleEvents, isGoogleConnected, year, month, projectMap]);

  // Filter events based on active toggles
  const activeEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (ev.category === 'critical' && !filterCritical) return false;
      if (ev.category === 'approaching' && !filterApproaching) return false;
      if (ev.category === 'milestone' && !filterMilestones) return false;
      if (ev.category === 'general' && !filterGeneral) return false;
      if (ev.category === 'google' && !filterGoogle) return false;
      return true;
    });
  }, [allEvents, filterCritical, filterApproaching, filterMilestones, filterGeneral, filterGoogle]);

  const selectedDayEvents = activeEvents.filter((ev) => ev.day === selectedDay);

  const handleOpenAuthModal = () => {
    setGoogleAuthError(null);
    setShowGoogleAuthModal(true);
  };

  const handleAuthorizeWithGoogle = async () => {
    setIsSyncing(true);
    setGoogleAuthError(null);
    setShowGoogleAuthModal(false);

    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (clientId) {
      const res = await googleCalendarService.connectGoogleCalendar(clientId);
      setIsSyncing(false);
      if (!res.success) {
        setGoogleAuthError(res.error || 'Failed to connect Google Calendar');
      } else {
        setImportSuccessMessage(`Google Calendar connected! Synced ${res.count || 0} live event${res.count === 1 ? '' : 's'}.`);
        setTimeout(() => setImportSuccessMessage(null), 4000);
      }
      return;
    }

    // Direct Supabase Google OAuth Redirect with Calendar scopes
    const res = await googleCalendarService.connectViaSupabaseOAuth();
    setIsSyncing(false);
    if (!res.success) {
      setGoogleAuthError(res.error || 'Failed to redirect to Google authorization');
    }
  };

  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    setGoogleAuthError(null);
    const res = await googleCalendarService.syncEvents();
    setIsSyncing(false);
    if (!res.success) {
      setGoogleAuthError(res.error || 'Sync failed');
    } else {
      setImportSuccessMessage(`Synced ${res.count || 0} event${res.count === 1 ? '' : 's'} from Google Calendar.`);
      setTimeout(() => setImportSuccessMessage(null), 4000);
    }
  };

  const handleDisconnectGoogle = () => {
    googleCalendarService.disconnect();
    setGoogleAuthError(null);
  };

  const handleImportGoogleEvent = () => {
    if (!importingEvent || !importTargetProjectId) return;
    googleCalendarService.importGoogleEventAsTask(importingEvent, importTargetProjectId, user);
    setImportSuccessMessage(`Imported "${importingEvent.summary}" as a task in your project.`);
    setImportingEvent(null);
    setTimeout(() => setImportSuccessMessage(null), 4000);
  };

  const getCategoryDot = (category: CalendarEvent['category']) => {
    switch (category) {
      case 'critical':
        return 'bg-red-500';
      case 'approaching':
        return 'bg-amber-500';
      case 'milestone':
        return 'bg-[#00E575] shadow-[0_0_8px_rgba(0,229,117,0.7)]';
      case 'general':
        return 'bg-blue-500';
      case 'google':
        return 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]';
    }
  };

  const getCategoryBadge = (category: CalendarEvent['category']) => {
    switch (category) {
      case 'critical':
        return <Badge variant="red">Critical</Badge>;
      case 'approaching':
        return <Badge variant="amber">Approaching</Badge>;
      case 'milestone':
        return <Badge variant="green">Milestone</Badge>;
      case 'general':
        return <Badge variant="blue">General</Badge>;
      case 'google':
        return <Badge variant="purple">Google Event</Badge>;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-vault-textPrimary tracking-tight">Calendar</h1>
          <p className="text-xs text-vault-textMuted mt-1">
            Deadlines, scheduled milestones, and Google Calendar event sync.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Google Calendar Connect / Sync Button */}
          {!isGoogleConnected ? (
            <button
              onClick={handleOpenAuthModal}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-vault-card border border-vault-border hover:border-indigo-500/50 hover:bg-indigo-500/10 text-xs font-semibold text-vault-textPrimary flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Connect Google Calendar to sync external meetings and events"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isSyncing ? 'Connecting...' : 'Connect Google Calendar'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-vault-card border border-indigo-500/30 rounded-xl px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-400">Google Calendar</span>
              <button
                onClick={handleSyncGoogle}
                disabled={isSyncing}
                className="p-1 text-vault-textMuted hover:text-vault-textPrimary rounded cursor-pointer"
                title="Sync Google Events Now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={handleDisconnectGoogle}
                className="text-[10px] text-vault-textMuted hover:text-red-400 ml-1 cursor-pointer"
                title="Disconnect Google Calendar"
              >
                Disconnect
              </button>
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>

          {/* Month Steppers */}
          <div className="flex items-center gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-vault-cardHover text-vault-textMuted hover:text-vault-textPrimary transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-vault-textPrimary px-2 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-vault-cardHover text-vault-textMuted hover:text-vault-textPrimary transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Success banner if imported */}
      {importSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* Google Error Banner */}
      {googleAuthError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{googleAuthError}</span>
          </div>
          <button
            onClick={() => setGoogleAuthError(null)}
            className="text-red-400 hover:text-red-300 text-xs cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Calendar Matrix & Agenda */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Section: Month Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-3.5 sm:p-6 bg-vault-card border-vault-border">
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="min-w-[420px] sm:min-w-[460px]">
                {/* Weekdays header */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-vault-textMuted uppercase tracking-wider mb-2.5 sm:mb-3">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* 35-Day Matrix */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {[...Array(35)].map((_, idx) => {
                    const dayNum = idx - firstDayOfWeek + 1;
                    const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                    const isSelected = isCurrentMonth && dayNum === selectedDay;
                    const dayEvents = isCurrentMonth ? activeEvents.filter((e) => e.day === dayNum) : [];
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => isCurrentMonth && setSelectedDay(dayNum)}
                        className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between group relative ${
                          !isCurrentMonth
                            ? 'bg-vault-card/20 border-vault-border/30 text-vault-textMuted/30 cursor-default'
                            : isSelected
                            ? 'bg-[#00E575]/15 border-[#00E575] text-vault-textPrimary shadow-[0_0_15px_rgba(0,229,117,0.25)] cursor-pointer'
                            : 'bg-vault-cardHover border-vault-border hover:border-vault-borderLight text-vault-textSecondary cursor-pointer'
                        }`}
                      >
                        {/* Day number header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-[#00C966] dark:text-[#00E575] font-extrabold'
                                : isCurrentMonth
                                ? 'text-vault-textPrimary'
                                : 'text-vault-textMuted/40'
                            }`}
                          >
                            {isCurrentMonth ? dayNum : ''}
                          </span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] shadow-[0_0_6px_rgba(0,229,117,0.8)]" />
                          )}
                        </div>

                        {/* Event indicators / dots */}
                        {hasEvents && (
                          <div className="flex items-center gap-1 flex-wrap mt-auto">
                            {dayEvents.map((ev) => (
                              <span
                                key={ev.id}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getCategoryDot(ev.category)}`}
                                title={`${ev.title} (${ev.project})`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Category Filters Toggle Panel */}
          <Card className="p-4 sm:p-5 bg-vault-card border-vault-border">
            <h3 className="text-xs font-bold text-vault-textMuted uppercase tracking-wider mb-3 sm:mb-4">
              Category Filters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Critical */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Critical</span>
                </div>
                <Toggle checked={filterCritical} onChange={setFilterCritical} />
              </div>

              {/* Approaching */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Approaching</span>
                </div>
                <Toggle checked={filterApproaching} onChange={setFilterApproaching} />
              </div>

              {/* Milestones */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Milestones</span>
                </div>
                <Toggle checked={filterMilestones} onChange={setFilterMilestones} />
              </div>

              {/* General */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-vault-textPrimary">General</span>
                </div>
                <Toggle checked={filterGeneral} onChange={setFilterGeneral} />
              </div>

              {/* Google Events */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Google</span>
                </div>
                <Toggle checked={filterGoogle} onChange={setFilterGoogle} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Section: Selected Day Agenda (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-4 sm:p-6 flex flex-col justify-between h-full bg-vault-card border-vault-border">
            <div>
              {/* Header */}
              <div className="pb-4 border-b border-vault-border">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00C966] dark:text-[#00E575] uppercase tracking-wider">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Selected Day Schedule</span>
                </div>
                <h2 className="text-xl font-extrabold text-vault-textPrimary tracking-tight mt-1">
                  {monthNames[month].slice(0, 3)} {selectedDay}, {year}
                </h2>
                <p className="text-xs text-vault-textMuted mt-0.5">
                  {selectedDayEvents.length} scheduled item{selectedDayEvents.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* Agenda items list */}
              <div className="mt-5 space-y-3.5">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-12 text-center text-vault-textMuted">
                    <Clock className="w-8 h-8 mx-auto text-vault-textMuted mb-2 opacity-50" />
                    <p className="text-xs">No scheduled items on this day.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all group space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-vault-textPrimary group-hover:text-[#00C966] dark:group-hover:text-[#00E575] transition-colors">
                            {ev.title}
                          </h3>
                          <p className="text-[11px] text-vault-textMuted mt-0.5">
                            {ev.project}
                          </p>
                        </div>
                        {getCategoryBadge(ev.category)}
                      </div>

                      <div className="pt-2 border-t border-vault-border flex items-center justify-between text-[11px] text-vault-textMuted font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-vault-textMuted" />
                          <span>{ev.time}</span>
                        </div>
                        
                        {ev.category === 'google' && ev.rawGoogleEvent ? (
                          <button
                            onClick={() => setImportingEvent(ev.rawGoogleEvent || null)}
                            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20"
                            title="Import this Google Calendar event into a Slow Spider project"
                          >
                            <Download className="w-3 h-3" />
                            <span>Import Task</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            {ev.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00C966] dark:text-[#00E575]" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <span className="capitalize">{ev.status.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Legend Info */}
            <div className="mt-6 pt-4 border-t border-vault-border text-xs text-vault-textMuted space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#00C966] dark:text-[#00E575]" />
                  Milestones
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Critical Due Dates
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Google Event to Project Modal */}
      {importingEvent && (
        <Modal
          isOpen={true}
          onClose={() => setImportingEvent(null)}
          title="Import Google Calendar Event"
          description="Convert this external calendar event directly into a Slow Spider project task."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border space-y-1">
              <span className="text-xs font-bold text-vault-textPrimary block">{importingEvent.summary}</span>
              {importingEvent.description && (
                <p className="text-xs text-vault-textMuted">{importingEvent.description}</p>
              )}
              <span className="text-[11px] text-vault-textMuted font-mono block">
                {importingEvent.start.dateTime || importingEvent.start.date}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                Select Destination Project
              </label>
              <select
                value={importTargetProjectId}
                onChange={(e) => setImportTargetProjectId(e.target.value)}
                className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.team_category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setImportingEvent(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleImportGoogleEvent}>
                Confirm Import
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Real Google OAuth Authorization Modal */}
      {showGoogleAuthModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowGoogleAuthModal(false)}
          title="Connect Google Calendar"
          description="Authorize Slow Spider to synchronize your calendar events and deadlines in real time."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-vault-textPrimary">Sync Meetings & Schedule</p>
                <p className="text-xs text-vault-textMuted leading-relaxed">
                  Would you like to authorize Slow Spider to read your Google Calendar events and deadlines?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowGoogleAuthModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSyncing}
                onClick={handleAuthorizeWithGoogle}
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                {isSyncing ? 'Authorizing...' : 'Authorize with Google'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
