import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ArrowUpRight, Check, Plus, Trash2,
  FolderPlus, Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar, CircularGauge } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Project, Task, Milestone } from '../types/database';
import { NavTab } from '../components/layout/Sidebar';
import { formatDate } from '../lib/utils';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, projectId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [taskTab, setTaskTab] = useState<'overview' | 'priority'>('overview');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    const update = () => {
      const userProjects = dataService.getProjects(user);
      setProjects(userProjects);
      setTasks(dataService.getTasks(undefined, user));
      
      // Load milestones for user's projects
      const allMs: Milestone[] = [];
      userProjects.forEach(p => {
        allMs.push(...dataService.getMilestones(p.id));
      });
      setMilestones(allMs);
    };
    update();
    return dataService.subscribe(update);
  }, [user]);

  const handleToggleTask = (id: string) => {
    dataService.toggleTaskCompletion(id, user || undefined);
  };

  const handleTrashTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.trashTask(id, user || undefined);
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    if (projects.length === 0) {
      alert('Please create a project first before adding tasks.');
      return;
    }
    const defaultProject = projects[0]?.id;
    dataService.createTask({
      project_id: defaultProject,
      title: quickTaskTitle.trim(),
      status: 'todo',
      priority: 'warning',
      due_date: new Date().toISOString().split('T')[0],
      estimate: '1h estimate',
    }, user || undefined);
    setQuickTaskTitle('');
    setShowQuickAdd(false);
  };

  const filteredTasks = useMemo(() => {
    if (taskTab === 'overview') {
      return tasks.slice(0, 6);
    }
    return [...tasks].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, normal: 3 };
      return order[a.priority] - order[b.priority];
    }).slice(0, 6);
  }, [tasks, taskTab]);

  // Dynamically compute upcoming deadlines from user's milestones and tasks
  const upcomingDeadlines = useMemo(() => {
    const list: Array<{ day: string; title: string; subtitle: string; dotColor: string }> = [];
    
    // Milestones
    milestones
      .filter(m => m.status !== 'done')
      .slice(0, 3)
      .forEach(m => {
        list.push({
          day: formatDate(m.due_date),
          title: m.title,
          subtitle: m.description || 'Milestone delivery checkpoint',
          dotColor: m.status === 'overdue' ? 'bg-red-500' : 'bg-emerald-500',
        });
      });

    // If more needed, fill from upcoming tasks
    if (list.length < 3) {
      tasks
        .filter(t => t.status !== 'done' && t.due_date)
        .slice(0, 3 - list.length)
        .forEach(t => {
          list.push({
            day: formatDate(t.due_date),
            title: t.title,
            subtitle: t.estimate || 'Task deadline',
            dotColor: t.priority === 'critical' ? 'bg-red-500' : t.priority === 'warning' ? 'bg-amber-500' : 'bg-blue-500',
          });
        });
    }

    return list;
  }, [milestones, tasks]);

  // Overall average project delivery progress
  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const total = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(total / projects.length);
  }, [projects]);

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter(t => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'green' as const, color: 'green' as const };
      case 'at_risk':
        return { label: 'At risk', variant: 'amber' as const, color: 'amber' as const };
      case 'overdue':
        return { label: 'Overdue', variant: 'red' as const, color: 'red' as const };
      case 'completed':
        return { label: 'Completed', variant: 'green' as const, color: 'green' as const };
      default:
        return { label: 'In progress', variant: 'blue' as const, color: 'blue' as const };
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top 3 Metric Highlight Cards */}
      {projects.length === 0 ? (
        <Card className="bg-vault-card border-vault-border p-5 sm:p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-vault-textPrimary">No Active Projects Yet</h3>
            <p className="text-xs text-vault-textMuted mt-1 max-w-md mx-auto">
              Your personal workspace is empty. Create your first project using the <strong>"+ New Project"</strong> button in the top right to start tracking delivery and milestones.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {projects.slice(0, 3).map((proj) => {
            const badge = getStatusBadge(proj.status);
            return (
              <Card
                key={proj.id}
                hoverEffect
                onClick={() => onNavigate('project-details', proj.id)}
                className="cursor-pointer group relative overflow-hidden bg-vault-card border-vault-border p-4 sm:p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-vault-textSecondary group-hover:text-vault-textPrimary transition-colors">
                      {proj.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-extrabold text-vault-textPrimary tracking-tight">
                        {proj.progress}%
                      </span>
                    </div>
                  </div>
                  <Badge variant={badge.variant}>
                    {badge.label}
                  </Badge>
                </div>

                <p className="text-xs text-vault-textMuted mt-4 line-clamp-2 leading-relaxed">
                  {proj.description || 'Project delivery and task execution workspace.'}
                </p>

                <div className="mt-4">
                  <ProgressBar value={proj.progress} color={badge.color} size="sm" showGlow />
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-vault-textMuted" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Middle Section: Active Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Active Tasks Widget (7 Cols) */}
        <Card className="lg:col-span-7 flex flex-col justify-between bg-vault-card border-vault-border p-4 sm:p-5">
          <div>
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 sm:pb-4 border-b border-vault-border gap-3">
              <div>
                <h2 className="text-base font-bold text-vault-textPrimary">Active Tasks</h2>
                <p className="text-xs text-vault-textMuted mt-0.5">Focused work queue for today</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="p-1 rounded-xl bg-vault-cardHover border border-vault-border flex items-center gap-1">
                  <button
                    onClick={() => setTaskTab('overview')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      taskTab === 'overview'
                        ? 'bg-vault-card text-vault-textPrimary shadow-sm border border-vault-border'
                        : 'text-vault-textMuted hover:text-vault-textPrimary'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setTaskTab('priority')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      taskTab === 'priority'
                        ? 'bg-vault-card text-vault-textPrimary shadow-sm border border-vault-border'
                        : 'text-vault-textMuted hover:text-vault-textPrimary'
                    }`}
                  >
                    Priority
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  title="Add quick task"
                >
                  <Plus className="w-4 h-4 text-emerald-500" />
                </Button>
              </div>
            </div>

            {/* Quick Add Input */}
            {showQuickAdd && (
              <form onSubmit={handleCreateQuickTask} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder={projects.length === 0 ? "Create a project first..." : "Task title and press Enter..."}
                  disabled={projects.length === 0}
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  autoFocus
                  className="flex-1 bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                <Button variant="primary" size="sm" type="submit" disabled={projects.length === 0}>
                  Add
                </Button>
              </form>
            )}

            {/* Tasks Queue List */}
            <div className="mt-4 space-y-2.5">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-vault-textMuted text-xs">
                  <p>No active tasks in your queue.</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-black'
                              : 'bg-vault-card border-vault-border text-transparent hover:border-emerald-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate transition-colors ${
                              isDone ? 'line-through text-vault-textMuted' : 'text-vault-textPrimary'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-[11px] text-vault-textMuted mt-0.5">
                            {task.estimate || `Due ${task.due_date}`}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 ml-2">
                        <Badge
                          variant={
                            task.priority === 'critical'
                              ? 'red'
                              : task.priority === 'warning'
                              ? 'amber'
                              : 'blue'
                          }
                        >
                          {task.priority === 'critical'
                            ? 'Critical'
                            : task.priority === 'warning'
                            ? 'Warning'
                            : 'Info'}
                        </Badge>

                        <button
                          onClick={(e) => handleTrashTask(e, task.id)}
                          className="p-1 rounded-lg text-vault-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Delete Task (Move to Trash)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Upcoming Deadlines Widget (5 Cols) */}
        <Card className="lg:col-span-5 flex flex-col justify-between bg-vault-card border-vault-border">
          <div>
            <div className="pb-4 border-b border-vault-border">
              <h2 className="text-base font-bold text-vault-textPrimary">Upcoming Deadlines</h2>
              <p className="text-xs text-vault-textMuted mt-0.5">Timeline of milestones and due dates</p>
            </div>

            <div className="mt-4 space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-vault-textMuted text-xs">
                  <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p>No upcoming deadlines scheduled.</p>
                </div>
              ) : (
                upcomingDeadlines.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.dotColor}`} />
                    <div>
                      <span className="text-[11px] font-semibold text-vault-textMuted block uppercase tracking-wider">
                        {item.day}
                      </span>
                      <p className="text-xs font-bold text-vault-textPrimary mt-0.5">{item.title}</p>
                      <p className="text-[11px] text-vault-textMuted mt-0.5 leading-snug">{item.subtitle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-vault-border mt-6">
            <button
              onClick={() => onNavigate('calendar')}
              className="w-full flex items-center justify-between text-xs font-semibold text-emerald-500 hover:text-emerald-400 py-1 cursor-pointer group"
            >
              <span>Open Full Calendar</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Progress Summaries & Mini Calendar Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Progress Summaries */}
        <Card className="md:col-span-6 flex flex-col justify-between bg-vault-card border-vault-border">
          <div>
            <div className="pb-4 border-b border-vault-border">
              <h2 className="text-base font-bold text-vault-textPrimary">Progress Summaries</h2>
              <p className="text-xs text-vault-textMuted mt-0.5">Workspace throughput and completion</p>
            </div>

            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Donut Gauge */}
              <div className="shrink-0">
                <CircularGauge percentage={avgProgress} size={80} strokeWidth={8} color="#10B981" />
              </div>

              {/* Throughput Breakdown Bars */}
              <div className="flex-1 w-full space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-vault-textSecondary mb-1">
                    <span>Average Project Delivery</span>
                    <span>{avgProgress}%</span>
                  </div>
                  <ProgressBar value={avgProgress} color="green" size="sm" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-vault-textSecondary mb-1">
                    <span>Task Completion Velocity</span>
                    <span>{taskCompletionRate}%</span>
                  </div>
                  <ProgressBar value={taskCompletionRate} color="blue" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mini Calendar Preview Widget */}
        <Card
          onClick={() => onNavigate('calendar')}
          hoverEffect
          className="md:col-span-6 cursor-pointer flex flex-col justify-between bg-vault-card border-vault-border"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-vault-border">
              <div>
                <h2 className="text-base font-bold text-vault-textPrimary flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-500" />
                  <span>Calendar</span>
                </h2>
                <p className="text-xs text-vault-textMuted mt-0.5">Deadlines and milestones</p>
              </div>
              <span className="text-xs text-emerald-500 font-medium">View &rarr;</span>
            </div>

            {/* Calendar Mini Grid Preview */}
            <div className="mt-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-vault-textMuted mb-1.5">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {[...Array(35)].map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = dayNum === new Date().getDate();
                  return (
                    <div
                      key={i}
                      className={`h-7 flex flex-col items-center justify-center rounded-lg text-[11px] transition-colors relative ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-vault-textSecondary hover:bg-vault-cardHover'
                      }`}
                    >
                      <span>{dayNum <= 31 ? dayNum : dayNum - 31}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
