import React, { useState, useEffect } from 'react';
import { 
  Inbox, Sparkles, CheckSquare, FolderGit2, 
  Trash2, X, Target, Lightbulb, Plus
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { InboxItem, InboxType, Project, TaskPriority, TeamCategory } from '../../types/database';
import { formatTimeAgo } from '../../lib/utils';

interface FloatingInboxProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProject?: (projectId: string) => void;
}

type ConversionMode = 'TASK' | 'MILESTONE' | 'PROJECT';

export const FloatingInbox: React.FC<FloatingInboxProps> = ({
  isOpen,
  onClose,
  onNavigateToProject,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedType, setSelectedType] = useState<InboxType>('IDEA');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Conversion Panel state
  const [activeConvertingItem, setActiveConvertingItem] = useState<{ id: string; mode: ConversionMode } | null>(null);
  const [destinationMode, setDestinationMode] = useState<'existing' | 'new'>('existing');
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectCategory, setNewProjectCategory] = useState<TeamCategory>('Product team');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [dueTime, setDueTime] = useState<string>('17:00');

  useEffect(() => {
    const update = () => {
      setItems(dataService.getInboxItems(user));
      const p = dataService.getProjects(user);
      setProjects(p);
      if (p.length > 0 && !targetProjectId) {
        setTargetProjectId(p[0].id);
      }
    };
    update();
    return dataService.subscribe(update);
  }, [user, targetProjectId]);

  if (!isOpen) return null;

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    dataService.createInboxItem({
      type: selectedType,
      title: title.trim(),
      content: content.trim(),
    }, user || undefined);
    setTitle('');
    setContent('');
  };

  const handleDelete = (id: string) => {
    dataService.deleteInboxItem(id);
    if (activeConvertingItem?.id === id) {
      setActiveConvertingItem(null);
    }
  };

  const openConversion = (id: string, mode: ConversionMode, itemTitle: string) => {
    setActiveConvertingItem({ id, mode });
    setNewProjectName(itemTitle);
    if (projects.length === 0) {
      setDestinationMode('new');
    } else {
      setDestinationMode('existing');
      if (!targetProjectId && projects.length > 0) {
        setTargetProjectId(projects[0].id);
      }
    }
  };

  const handleExecuteConversion = (inboxId: string) => {
    if (!activeConvertingItem) return;
    const fullDueDate = dueTime ? `${dueDate}T${dueTime}` : dueDate;

    let finalProjectId = targetProjectId;

    // 1. If user selected to create a new project first
    if (destinationMode === 'new' || activeConvertingItem.mode === 'PROJECT') {
      const projName = newProjectName.trim() || 'New Workspace Project';
      const createdProj = dataService.createProject({
        name: projName,
        description: content || `Project created from captured ${activeConvertingItem.mode.toLowerCase()}`,
        owner_id: user?.id || '',
        status: 'active',
        progress: 0,
        due_date: fullDueDate,
        team_category: newProjectCategory,
        tags: ['QUICK CAPTURE'],
        members: user ? [user] : [],
      }, user || undefined);

      if (!createdProj) return;
      finalProjectId = createdProj.id;

      // If the target mode was PROJECT itself, we're done!
      if (activeConvertingItem.mode === 'PROJECT') {
        dataService.deleteInboxItem(inboxId);
        setActiveConvertingItem(null);
        if (onNavigateToProject) {
          onClose();
          onNavigateToProject(finalProjectId);
        }
        return;
      }
    }

    // 2. Add as Task or Milestone to finalProjectId
    if (activeConvertingItem.mode === 'TASK') {
      const task = dataService.convertInboxItemToTask(inboxId, finalProjectId, priority, fullDueDate, user || undefined);
      setActiveConvertingItem(null);
      if (task && onNavigateToProject) {
        onClose();
        onNavigateToProject(finalProjectId);
      }
    } else if (activeConvertingItem.mode === 'MILESTONE') {
      const milestone = dataService.convertInboxItemToMilestone(inboxId, finalProjectId, fullDueDate, user || undefined);
      setActiveConvertingItem(null);
      if (milestone && onNavigateToProject) {
        onClose();
        onNavigateToProject(finalProjectId);
      }
    }
  };

  const getTypeBadge = (type: InboxType) => {
    switch (type) {
      case 'IDEA':
        return <Badge variant="purple"><Lightbulb className="w-3 h-3 mr-1 inline" />Idea</Badge>;
      case 'TASK':
        return <Badge variant="amber"><CheckSquare className="w-3 h-3 mr-1 inline" />Task</Badge>;
      case 'MILESTONE':
        return <Badge variant="green"><Target className="w-3 h-3 mr-1 inline" />Milestone</Badge>;
      case 'PROJECT':
        return <Badge variant="blue"><FolderGit2 className="w-3 h-3 mr-1 inline" />Project</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Floating Modal */}
      <div className="relative w-full max-w-2xl bg-vault-surface border border-vault-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 animate-slide-up flex flex-col max-h-[88vh] text-vault-textPrimary">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-vault-border">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00E575] shrink-0">
              <Inbox className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-vault-textPrimary">Quick Capture</h2>
              <p className="text-[11px] sm:text-xs text-vault-textMuted">Rapidly capture Ideas, Tasks, Milestones, and Projects</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capture Input Box */}
        <form onSubmit={handleCapture} className="mt-3.5 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-vault-cardHover border border-vault-border space-y-3">
          {/* 4 Core Capture Type Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              { type: 'IDEA' as InboxType, label: 'Idea', icon: Lightbulb },
              { type: 'TASK' as InboxType, label: 'Task', icon: CheckSquare },
              { type: 'MILESTONE' as InboxType, label: 'Milestone', icon: Target },
              { type: 'PROJECT' as InboxType, label: 'Project', icon: FolderGit2 },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === type
                    ? 'bg-vault-card text-[#00C966] dark:text-[#00E575] shadow-sm border border-[#00E575]/40'
                    : 'text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-card/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder={`Capture a quick ${selectedType.toLowerCase()}...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-vault-card border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575]"
          />

          <textarea
            placeholder="Add optional notes, details, context, or links..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full bg-vault-card border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button variant="primary" size="sm" type="submit" disabled={!title.trim()}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Capture Item
            </Button>
          </div>
        </form>

        {/* Unorganized Captures List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-vault-textMuted uppercase tracking-wider">
              Captured Items ({items.length})
            </h3>
            <span className="text-[11px] text-vault-textMuted">
              Items remain safely here until you organize or convert them.
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-vault-textMuted text-xs">
              No captured items yet. Press <kbd className="px-1.5 py-0.5 rounded bg-vault-cardHover text-[10px] border border-vault-border">I</kbd> anytime to capture ideas.
            </div>
          ) : (
            items.map((item) => {
              const isConverting = activeConvertingItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        <h4 className="text-xs font-bold text-vault-textPrimary truncate">{item.title}</h4>
                      </div>
                      {item.content && (
                        <p className="text-xs text-vault-textMuted line-clamp-2 leading-relaxed">{item.content}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-vault-textMuted font-mono">
                        {formatTimeAgo(item.created_at)}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-lg text-vault-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete capture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Action Buttons based on Capture Type */}
                  {!isConverting ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-vault-border flex-wrap">
                      {item.type === 'IDEA' && (
                        <>
                          <button
                            onClick={() => openConversion(item.id, 'TASK', item.title)}
                            className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Add as Task</span>
                          </button>

                          <button
                            onClick={() => openConversion(item.id, 'MILESTONE', item.title)}
                            className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
                          >
                            <Target className="w-3 h-3" />
                            <span>Add as Milestone</span>
                          </button>

                          <button
                            onClick={() => openConversion(item.id, 'PROJECT', item.title)}
                            className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20"
                          >
                            <FolderGit2 className="w-3 h-3" />
                            <span>Convert to Project</span>
                          </button>
                        </>
                      )}

                      {item.type === 'TASK' && (
                        <button
                          onClick={() => openConversion(item.id, 'TASK', item.title)}
                          className="text-[11px] font-semibold text-[#00C966] dark:text-[#00E575] hover:underline flex items-center gap-1 cursor-pointer bg-[#00E575]/10 px-2.5 py-1 rounded-lg border border-[#00E575]/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task to Project</span>
                        </button>
                      )}

                      {item.type === 'MILESTONE' && (
                        <button
                          onClick={() => openConversion(item.id, 'MILESTONE', item.title)}
                          className="text-[11px] font-semibold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Milestone to Project</span>
                        </button>
                      )}

                      {item.type === 'PROJECT' && (
                        <button
                          onClick={() => openConversion(item.id, 'PROJECT', item.title)}
                          className="text-[11px] font-semibold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Initialize as Workspace Project</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Conversion Selector Panel */
                    <div className="pt-3 border-t border-vault-border space-y-3 animate-fade-in bg-vault-card p-3 rounded-xl border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-vault-textPrimary flex items-center gap-1.5">
                          Converting into <Badge variant="neutral">{activeConvertingItem.mode}</Badge>
                        </span>
                        <button
                          onClick={() => setActiveConvertingItem(null)}
                          className="text-[11px] text-vault-textMuted hover:text-vault-textPrimary cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Destination Choice for Tasks & Milestones */}
                      {activeConvertingItem.mode !== 'PROJECT' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDestinationMode('existing')}
                              disabled={projects.length === 0}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                destinationMode === 'existing'
                                  ? 'bg-[#00E575]/20 text-[#045E33] dark:text-[#00E575] border-[#00E575]/40 font-bold'
                                  : 'bg-vault-cardHover text-vault-textMuted border-vault-border hover:text-vault-textPrimary'
                              }`}
                            >
                              Add to Existing Project
                            </button>
                            <button
                              type="button"
                              onClick={() => setDestinationMode('new')}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                destinationMode === 'new'
                                  ? 'bg-[#00E575]/20 text-[#045E33] dark:text-[#00E575] border-[#00E575]/40 font-bold'
                                  : 'bg-vault-cardHover text-vault-textMuted border-vault-border hover:text-vault-textPrimary'
                              }`}
                            >
                              + Create New Project
                            </button>
                          </div>

                          {destinationMode === 'existing' ? (
                            <select
                              value={targetProjectId}
                              onChange={(e) => setTargetProjectId(e.target.value)}
                              className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                            >
                              {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.team_category})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="New Project Name..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                              />
                              <select
                                value={newProjectCategory}
                                onChange={(e) => setNewProjectCategory(e.target.value as TeamCategory)}
                                className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                              >
                                <option value="Product team">Product team</option>
                                <option value="Engineering team">Engineering team</option>
                                <option value="Design team">Design team</option>
                                <option value="Growth team">Growth team</option>
                                <option value="Marketing team">Marketing team</option>
                                <option value="Ops team">Ops team</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Project Mode inputs */}
                      {activeConvertingItem.mode === 'PROJECT' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Project Name..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                          />
                          <select
                            value={newProjectCategory}
                            onChange={(e) => setNewProjectCategory(e.target.value as TeamCategory)}
                            className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                          >
                            <option value="Product team">Product team</option>
                            <option value="Engineering team">Engineering team</option>
                            <option value="Design team">Design team</option>
                            <option value="Growth team">Growth team</option>
                            <option value="Marketing team">Marketing team</option>
                            <option value="Ops team">Ops team</option>
                          </select>
                        </div>
                      )}

                      {/* Priority (Tasks only) */}
                      {activeConvertingItem.mode === 'TASK' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-vault-textSecondary mb-1">
                            Task Priority
                          </label>
                          <div className="flex gap-2">
                            {(['critical', 'warning', 'normal', 'info'] as TaskPriority[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border uppercase font-bold transition-all cursor-pointer ${
                                  priority === p
                                    ? 'bg-[#00E575]/20 text-[#045E33] dark:text-[#00E575] border-[#00E575]/40'
                                    : 'bg-vault-cardHover text-vault-textMuted border-vault-border'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Due Date & Time */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-vault-textSecondary">
                          Target Due Date & Time
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                          />
                          <input
                            type="time"
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            className="bg-vault-cardHover border border-vault-border rounded-xl px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setActiveConvertingItem(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleExecuteConversion(item.id)}
                        >
                          Confirm & Convert
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
