import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, FolderGit2, CheckSquare, Flag, 
  Snowflake, ArrowRight 
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from '../layout/Sidebar';
import { Project, Task, Milestone } from '../../types/database';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab, projectId?: string) => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProjects(dataService.getAllProjects(user));
      setTasks(dataService.getTasks(undefined, user));
      setMilestones(dataService.getMilestones());
    }
  }, [isOpen, user]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedProjects = projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        type: 'Project' as const,
        title: p.name,
        subtitle: `${p.team_category} • ${p.progress}% complete`,
        isFrozen: p.status === 'frozen',
        onClick: () => {
          if (p.status === 'frozen') {
            onNavigate('cold-store');
          } else {
            onNavigate('project-details', p.id);
          }
          onClose();
        }
      }));

    const matchedTasks = tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        type: 'Task' as const,
        title: t.title,
        subtitle: `Priority: ${t.priority} • Status: ${t.status}`,
        isFrozen: false,
        onClick: () => {
          onNavigate('project-details', t.project_id);
          onClose();
        }
      }));

    const matchedMilestones = milestones
      .filter((m) => m.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        type: 'Milestone' as const,
        title: m.title,
        subtitle: `Milestone • ${m.status}`,
        isFrozen: false,
        onClick: () => {
          onNavigate('project-details', m.project_id);
          onClose();
        }
      }));

    return [...matchedProjects, ...matchedTasks, ...matchedMilestones];
  }, [query, projects, tasks, milestones, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-vault-surface border border-vault-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up text-vault-textPrimary">
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-vault-border gap-2.5 sm:gap-3">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-vault-textMuted shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-vault-textPrimary placeholder-vault-textMuted focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-vault-cardHover text-[11px] font-mono text-vault-textMuted border border-vault-border">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-vault-textMuted">
              Search by project name, task titles, team tags, or milestones.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-vault-textMuted">
              No matching results found for "{query}".
            </div>
          ) : (
            searchResults.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-vault-cardHover transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-vault-card border border-vault-border text-vault-textMuted group-hover:text-emerald-500 transition-colors">
                    {item.isFrozen ? (
                      <Snowflake className="w-4 h-4 text-cyan-500" />
                    ) : item.type === 'Project' ? (
                      <FolderGit2 className="w-4 h-4" />
                    ) : item.type === 'Task' ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Flag className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-vault-textPrimary group-hover:text-emerald-500 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-vault-textMuted truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-vault-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
