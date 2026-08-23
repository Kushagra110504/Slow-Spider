import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, CheckCircle2, Circle, AlertTriangle, 
  Plus, Check, Snowflake, Trash2,
  Send
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SegmentedProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Project, Task, Milestone, ActivityLog, TaskPriority } from '../types/database';
import { formatTimeAgo } from '../lib/utils';
import { NavTab } from '../components/layout/Sidebar';
import { AttachmentManager } from '../components/attachments/AttachmentManager';
import { InviteMemberModal } from '../components/team/InviteMemberModal';
import { UserPlus } from 'lucide-react';

interface ProjectDetailsPageProps {
  projectId: string;
  onNavigate: (tab: NavTab, projectId?: string) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  projectId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Modals & form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('normal');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-08-28');
  const [showAddTask, setShowAddTask] = useState(false);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const update = () => {
      const p = dataService.getProjectById(projectId, user) || dataService.getProjects(user)[0];
      if (p) {
        setProject(p);
        setTasks(dataService.getTasks(p.id, user));
        setMilestones(dataService.getMilestones(p.id));
        setActivities(dataService.getActivityLogs(p.id));
      }
    };
    update();
    return dataService.subscribe(update);
  }, [projectId, user]);

  if (!project) {
    return (
      <div className="p-12 text-center text-vault-textMuted">
        <p>Project not found or archived.</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('projects')}
          className="mt-4"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  // Calculate milestone progress metrics
  const totalMilestones = milestones.length;
  const doneMilestones = milestones.filter(m => m.status === 'done').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'upcoming' || m.status === 'overdue').length;
  
  const completedPercent = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : project.progress;
  const inProgressPercent = totalMilestones > 0 ? Math.round((inProgressMilestones / totalMilestones) * 35) : 20;

  const handleToggleTask = (id: string) => {
    dataService.toggleTaskCompletion(id, user || undefined);
  };

  const handleTrashTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.trashTask(id, user || undefined);
  };

  const handleToggleMilestone = (id: string) => {
    const updated = dataService.toggleMilestoneDone(id, user || undefined);
    if (updated?.status === 'done') {
      const allDone = dataService.getMilestones(project.id).every(m => m.status === 'done');
      if (allDone) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleTrashMilestone = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.trashMilestone(id, user || undefined);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    dataService.createTask({
      project_id: project.id,
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: newTaskPriority,
      due_date: newTaskDueDate,
      estimate: 'Due soon',
    }, user || undefined);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    dataService.createMilestone({
      project_id: project.id,
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || 'Milestone verification deliverable.',
      status: 'upcoming',
      due_date: '2026-09-15',
    });
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setShowAddMilestone(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const authorName = user?.name || 'User';
    dataService.logActivity(project.id, 'comment', `${authorName} commented: "${newComment.trim()}"`, user || undefined);
    setNewComment('');
  };

  const handleArchiveProject = () => {
    if (confirm(`Archive project "${project.name}" to Cold Store? It will be preserved in read-only mode until restored.`)) {
      dataService.archiveProject(project.id, user || undefined);
      onNavigate('cold-store');
    }
  };

  const handleTrashProject = () => {
    if (confirm(`Move project "${project.name}" to Trash? It will be recoverable for 90 days.`)) {
      dataService.trashProject(project.id);
      onNavigate('trash');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => onNavigate('projects')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-vault-textMuted hover:text-vault-textPrimary transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleArchiveProject}
            className="text-cyan-600 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
            title="Archive project to Cold Store"
          >
            <Snowflake className="w-3.5 h-3.5 mr-1" />
            <span>Archive</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTrashProject}
            className="text-red-500 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
            title="Move project to 90-day Trash"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Trash</span>
          </Button>
        </div>
      </div>

      {/* Main Project Details Header Card matching Screen 2 */}
      <Card className="bg-vault-card border-vault-border p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-vault-textPrimary tracking-tight">
                {project.name}
              </h1>
              <Badge variant="blue" dot>
                In Progress
              </Badge>
            </div>
            <p className="text-xs text-vault-textMuted mt-1.5 max-w-2xl leading-relaxed">
              {project.description || 'A premium project overview with task execution, milestone tracking, and a live activity feed for the team.'}
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <span className="text-[11px] sm:text-xs font-semibold text-vault-textMuted uppercase tracking-wider block">
              Overall progress
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-vault-textPrimary tracking-tight">
              {completedPercent}%
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar matching Screen 2 */}
        <div className="mt-5 sm:mt-6">
          <SegmentedProgressBar
            completedPercent={completedPercent}
            inProgressPercent={inProgressPercent}
          />
        </div>

        {/* Team Collaboration Bar */}
        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-vault-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-vault-textMuted uppercase tracking-wider">
              Project Team ({project.members?.length || 1})
            </span>
            <div className="flex items-center -space-x-2 overflow-hidden">
              {(project.members || (user ? [user] : [])).map((m, idx) => (
                <Avatar
                  key={m?.id || idx}
                  user={m}
                  size="sm"
                  className="ring-2 ring-vault-card"
                />
              ))}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="text-[#00C966] dark:text-[#00E575] hover:text-[#00D069] border-[#00E575]/40 hover:bg-[#00E575]/10 text-xs font-semibold self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Invite Member
          </Button>
        </div>
      </Card>

      {/* Invite Member Modal */}
      {project && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          project={project}
        />
      )}

      {/* Dual Column: Tasks & Milestones List matching Screen 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks List (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="flex flex-col justify-between bg-vault-card border-vault-border">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-vault-border">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-vault-textPrimary">Tasks</h2>
                    <span className="px-2 py-0.5 rounded-full bg-vault-cardHover text-vault-textMuted text-xs font-medium border border-vault-border">
                      {tasks.length} tasks
                    </span>
                  </div>
                  <p className="text-xs text-vault-textMuted mt-0.5">
                    Execution list with ownership, urgency, and removal.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="text-[#00C966] dark:text-[#00E575] hover:text-[#00D069]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Add Task Form */}
              {showAddTask && (
                <form onSubmit={handleCreateTask} className="p-3 bg-vault-cardHover rounded-xl border border-vault-border my-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    autoFocus
                    className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="bg-vault-card border border-vault-border rounded-lg px-2.5 py-1 text-xs text-vault-textPrimary"
                    >
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="normal">Normal</option>
                      <option value="info">Info</option>
                    </select>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="bg-vault-card border border-vault-border rounded-lg px-2 py-1 text-xs text-vault-textPrimary"
                    />
                    <Button variant="primary" size="sm" type="submit" className="ml-auto">
                      Save
                    </Button>
                  </div>
                </form>
              )}

              {/* Tasks List with Delete/Trash Action */}
              <div className="mt-4 space-y-2.5">
                {tasks.length === 0 ? (
                  <p className="text-xs text-vault-textMuted text-center py-6">No tasks in this project.</p>
                ) : (
                  tasks.map((task) => {
                    const isDone = task.status === 'done';
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                              isDone
                                ? 'bg-[#00E575] border-[#00E575] text-[#052916]'
                                : 'bg-vault-card border-vault-border text-transparent hover:border-[#00E575]'
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
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar
                                user={task.assignee}
                                size="xs"
                              />
                              <span className="text-[11px] text-vault-textMuted">
                                {task.estimate || `Due ${task.due_date}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Priority Badge & Delete Button */}
                        <div className="shrink-0 flex items-center gap-2 ml-2">
                          <Badge
                            variant={
                              task.priority === 'critical'
                                ? 'red'
                                : task.priority === 'warning'
                                ? 'amber'
                                : task.priority === 'normal'
                                ? 'blue'
                                : 'neutral'
                            }
                          >
                            {task.priority === 'critical'
                              ? 'Critical'
                              : task.priority === 'warning'
                              ? 'Warning'
                              : task.priority === 'normal'
                              ? 'Normal'
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
        </div>

        {/* Right Column: Milestones List (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="flex flex-col justify-between bg-vault-card border-vault-border">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-vault-border">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-vault-textPrimary">Milestones</h2>
                    <span className="px-2 py-0.5 rounded-full bg-vault-cardHover text-vault-textMuted text-xs font-medium border border-vault-border">
                      {milestones.length} milestones
                    </span>
                  </div>
                  <p className="text-xs text-vault-textMuted mt-0.5">
                    Key checkpoints and delivery status.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  className="text-[#00C966] dark:text-[#00E575] hover:text-[#00D069]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Add Milestone Form */}
              {showAddMilestone && (
                <form onSubmit={handleCreateMilestone} className="p-3 bg-vault-cardHover rounded-xl border border-vault-border my-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Milestone title..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    autoFocus
                    className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                  />
                  <input
                    type="text"
                    placeholder="Milestone description..."
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="primary" size="sm" type="submit">
                      Save Milestone
                    </Button>
                  </div>
                </form>
              )}

              {/* Milestones List with Delete Action */}
              <div className="mt-4 space-y-2.5">
                {milestones.map((ms) => {
                  const isDone = ms.status === 'done';
                  const isOverdue = ms.status === 'overdue';
                  return (
                    <div
                      key={ms.id}
                      onClick={() => handleToggleMilestone(ms.id)}
                      className="p-3.5 rounded-xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all flex items-start justify-between cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-[#00C966] dark:text-[#00E575]" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-vault-textMuted group-hover:text-vault-textPrimary" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-vault-textPrimary">
                            {ms.title}
                          </p>
                          <p className="text-[11px] text-vault-textMuted mt-1 leading-relaxed">
                            {ms.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 ml-2">
                        <Badge
                          variant={
                            isDone ? 'green' : isOverdue ? 'red' : 'neutral'
                          }
                        >
                          {isDone ? 'Done' : isOverdue ? 'Overdue' : 'Upcoming'}
                        </Badge>

                        <button
                          onClick={(e) => handleTrashMilestone(e, ms.id)}
                          className="p-1 rounded-lg text-vault-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Delete Milestone (Move to Trash)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentManager projectId={project.id} />

      {/* Bottom Section: Activity Timeline matching Screen 2 */}
      <Card className="p-6 bg-vault-card border-vault-border">
        <div className="flex items-center justify-between pb-4 border-b border-vault-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-vault-textPrimary">Activity Timeline</h2>
              <Badge variant="neutral">Live feed</Badge>
            </div>
            <p className="text-xs text-vault-textMuted mt-0.5">
              Recent updates and team comments on this project.
            </p>
          </div>
        </div>

        {/* Comment input */}
        <form onSubmit={handlePostComment} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Write a comment or status update..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575]"
          />
          <Button variant="secondary" size="sm" type="submit">
            <Send className="w-3.5 h-3.5 mr-1 text-[#00C966] dark:text-[#00E575]" />
            Post
          </Button>
        </form>

        {/* Timeline List */}
        <div className="mt-6 relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-vault-border">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start justify-between group">
              {/* Dot indicator */}
              <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-[#00E575] shadow-[0_0_8px_rgba(0,229,117,0.8)] ring-4 ring-vault-card" />
              
              <div className="flex items-start gap-3">
                <Avatar
                  name={act.user_name}
                  src={act.user_avatar}
                  size="sm"
                />
                <div>
                  <p className="text-xs text-vault-textPrimary leading-snug">
                    <span className="font-bold">{act.user_name}</span>{' '}
                    {act.description.replace(act.user_name, '')}
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-vault-textMuted shrink-0 ml-4 font-mono">
                {formatTimeAgo(act.created_at)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
