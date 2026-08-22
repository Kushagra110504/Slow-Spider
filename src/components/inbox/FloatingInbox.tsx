import React, { useState, useEffect } from 'react';
import { 
  Inbox, Sparkles, CheckSquare, FolderPlus, 
  Trash2, X 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { InboxItem, InboxType, Project, TaskPriority } from '../../types/database';
import { formatTimeAgo } from '../../lib/utils';

interface FloatingInboxProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProject?: (projectId: string) => void;
}

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
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertTargetProjectId, setConvertTargetProjectId] = useState<string>('');
  const [convertPriority, setConvertPriority] = useState<TaskPriority>('normal');

  useEffect(() => {
    const update = () => {
      setItems(dataService.getInboxItems(user));
      const p = dataService.getProjects(user);
      setProjects(p);
      if (p.length > 0 && !convertTargetProjectId) {
        setConvertTargetProjectId(p[0].id);
      }
    };
    update();
    return dataService.subscribe(update);
  }, [user, convertTargetProjectId]);

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
  };

  const handleExecuteConvertTask = (inboxId: string) => {
    if (!convertTargetProjectId) return;
    const task = dataService.convertInboxItemToTask(inboxId, convertTargetProjectId, convertPriority, user || undefined);
    setConvertingId(null);
    if (task && onNavigateToProject) {
      onClose();
      onNavigateToProject(convertTargetProjectId);
    }
  };

  const handleExecuteConvertProject = (inboxId: string) => {
    const proj = dataService.convertInboxItemToProject(inboxId, 'Product team', user || undefined);
    setConvertingId(null);
    if (proj && onNavigateToProject) {
      onClose();
      onNavigateToProject(proj.id);
    }
  };

  const getTypeBadge = (type: InboxType) => {
    switch (type) {
      case 'IDEA':
        return <Badge variant="purple">Idea</Badge>;
      case 'TASK':
        return <Badge variant="amber">Task</Badge>;
      case 'NOTE':
        return <Badge variant="blue">Note</Badge>;
      case 'PROJECT':
        return <Badge variant="green">Project</Badge>;
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
      <div className="relative w-full max-w-2xl bg-vault-surface border border-vault-border rounded-3xl p-6 shadow-2xl z-10 animate-slide-up flex flex-col max-h-[85vh] text-vault-textPrimary">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-vault-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-vault-textPrimary">Floating Inbox</h2>
              <p className="text-xs text-vault-textMuted">Rapid capture space for thoughts, tasks, and ideas</p>
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
        <form onSubmit={handleCapture} className="mt-4 p-4 rounded-2xl bg-vault-cardHover border border-vault-border space-y-3">
          {/* Capture Type Tabs */}
          <div className="flex items-center gap-2">
            {(['IDEA', 'TASK', 'NOTE', 'PROJECT'] as InboxType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-vault-card text-emerald-500 shadow-sm border border-vault-border'
                    : 'text-vault-textMuted hover:text-vault-textPrimary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder={`Capture a quick ${selectedType.toLowerCase()}...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-vault-card border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-emerald-500"
          />

          <textarea
            placeholder="Add optional notes, links, or context (optional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full bg-vault-card border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-emerald-500 resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button variant="primary" size="sm" type="submit" disabled={!title.trim()}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Capture
            </Button>
          </div>
        </form>

        {/* Unorganized Captures List */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          <h3 className="text-xs font-bold text-vault-textMuted uppercase tracking-wider">
            Unorganized Captures ({items.length})
          </h3>

          {items.length === 0 ? (
            <div className="py-8 text-center text-vault-textMuted text-xs">
              Inbox is clean. Press <kbd className="px-1.5 py-0.5 rounded bg-vault-cardHover text-[10px] border border-vault-border">I</kbd> anytime to capture ideas.
            </div>
          ) : (
            items.map((item) => {
              const isConverting = convertingId === item.id;
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
                        className="p-1 rounded-lg text-vault-textMuted hover:text-red-500 transition-colors"
                        title="Delete capture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Conversion Actions */}
                  {!isConverting ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-vault-border">
                      <button
                        onClick={() => setConvertingId(item.id)}
                        className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Convert to Task</span>
                      </button>

                      <span className="text-vault-textMuted">•</span>

                      <button
                        onClick={() => handleExecuteConvertProject(item.id)}
                        className="text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                      >
                        <FolderPlus className="w-3 h-3" />
                        <span>Convert to Project</span>
                      </button>
                    </div>
                  ) : (
                    /* Conversion Selector Panel */
                    <div className="pt-3 border-t border-vault-border space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <select
                          value={convertTargetProjectId}
                          onChange={(e) => setConvertTargetProjectId(e.target.value)}
                          className="flex-1 bg-vault-card border border-vault-border rounded-lg px-2.5 py-1 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.team_category})
                            </option>
                          ))}
                        </select>

                        <select
                          value={convertPriority}
                          onChange={(e) => setConvertPriority(e.target.value as TaskPriority)}
                          className="bg-vault-card border border-vault-border rounded-lg px-2 py-1 text-xs text-vault-textPrimary"
                        >
                          <option value="critical">Critical</option>
                          <option value="warning">Warning</option>
                          <option value="normal">Normal</option>
                          <option value="info">Info</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setConvertingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleExecuteConvertTask(item.id)}
                        >
                          Confirm Task
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
