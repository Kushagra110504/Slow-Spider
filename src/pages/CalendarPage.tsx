import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, AlertTriangle, Flag, CheckCircle2, Circle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Task, Milestone, Project } from '../types/database';

interface CalendarEvent {
  id: string;
  title: string;
  project: string;
  category: 'critical' | 'approaching' | 'milestone' | 'general';
  time: string;
  status: 'pending' | 'in_progress' | 'completed';
  dateStr: string;
  day: number;
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

  // Live data from dataService
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

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
    };
    update();
    return dataService.subscribe(update);
  }, [user]);

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

  // Derive real events from tasks and milestones
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
          time: 'Due Date Checkpoint',
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
          time: t.estimate || 'All Day',
          status: t.status === 'done' ? 'completed' : t.status === 'in_progress' ? 'in_progress' : 'pending',
          dateStr: t.due_date,
          day: tDate.getDate(),
        });
      }
    });

    return list;
  }, [milestones, tasks, year, month, projectMap]);

  // Filter events based on active toggles
  const activeEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (ev.category === 'critical' && !filterCritical) return false;
      if (ev.category === 'approaching' && !filterApproaching) return false;
      if (ev.category === 'milestone' && !filterMilestones) return false;
      if (ev.category === 'general' && !filterGeneral) return false;
      return true;
    });
  }, [allEvents, filterCritical, filterApproaching, filterMilestones, filterGeneral]);

  const selectedDayEvents = activeEvents.filter((ev) => ev.day === selectedDay);

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
            Deadlines, scheduled milestones, and time-sensitive project deliverables.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
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

      {/* Main Grid: Calendar Matrix & Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Month Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 sm:p-6 bg-vault-card border-vault-border">
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[460px]">
                {/* Weekdays header */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-vault-textMuted uppercase tracking-wider mb-3">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* 35-Day Matrix */}
                <div className="grid grid-cols-7 gap-2">
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
                    className={`h-20 p-2 rounded-2xl border transition-all flex flex-col justify-between group relative ${
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
                            className={`w-2 h-2 rounded-full ${getCategoryDot(ev.category)}`}
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
          <Card className="p-5 bg-vault-card border-vault-border">
            <h3 className="text-xs font-bold text-vault-textMuted uppercase tracking-wider mb-4">
              Category Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Critical */}
              <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Critical</span>
                </div>
                <Toggle checked={filterCritical} onChange={setFilterCritical} />
              </div>

              {/* Approaching */}
              <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Approaching</span>
                </div>
                <Toggle checked={filterApproaching} onChange={setFilterApproaching} />
              </div>

              {/* Milestones */}
              <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-vault-textPrimary">Milestones</span>
                </div>
                <Toggle checked={filterMilestones} onChange={setFilterMilestones} />
              </div>

              {/* General */}
              <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-vault-textPrimary">General</span>
                </div>
                <Toggle checked={filterGeneral} onChange={setFilterGeneral} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Section: Selected Day Agenda (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 flex flex-col justify-between h-full bg-vault-card border-vault-border">
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
                  {selectedDayEvents.length} scheduled deliverable{selectedDayEvents.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* Agenda items list */}
              <div className="mt-5 space-y-3.5">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-12 text-center text-vault-textMuted">
                    <Clock className="w-8 h-8 mx-auto text-vault-textMuted mb-2 opacity-50" />
                    <p className="text-xs">No scheduled events on this day.</p>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all group"
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

                      <div className="mt-3 pt-3 border-t border-vault-border flex items-center justify-between text-[11px] text-vault-textMuted font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-vault-textMuted" />
                          <span>{ev.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {ev.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C966] dark:text-[#00E575]" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="capitalize">{ev.status.replace('_', ' ')}</span>
                        </div>
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
    </div>
  );
};
