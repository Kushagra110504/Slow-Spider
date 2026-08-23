import React, { useState, useEffect } from 'react';
import { Snowflake, RotateCcw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AvatarStack } from '../components/ui/Avatar';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types/database';
import { formatDate, formatDateTime } from '../lib/utils';
import { NavTab } from '../components/layout/Sidebar';

interface ColdStorePageProps {
  onNavigate?: (tab: NavTab, projectId?: string) => void;
}

export const ColdStorePage: React.FC<ColdStorePageProps> = () => {
  const { user } = useAuth();
  const [coldProjects, setColdProjects] = useState<Project[]>([]);
  const [thawingId, setThawingId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setColdProjects(dataService.getColdStoreProjects(user));
    update();
    return dataService.subscribe(update);
  }, [user]);

  const handleRestore = (id: string) => {
    setThawingId(id);
    setTimeout(() => {
      dataService.restoreProject(id, user || undefined);
      setThawingId(null);
    }, 600);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* Top Header & Preserved Counter matching Screen 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-vault-textPrimary tracking-tight">Cold Store</h1>
            <Badge variant="cyan" dot>
              Frozen archive
            </Badge>
          </div>
          <p className="text-xs text-vault-textMuted mt-1.5 max-w-xl leading-relaxed">
            Preserved project state after 60 days of inactivity. Notes, history, and progress thaw back into your workspace.
          </p>
        </div>

        {/* Preserved Counter Card matching Screen 4 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-vault-card border border-vault-border shadow-card w-full sm:w-auto text-left sm:text-right">
          <span className="text-[10px] font-bold text-vault-textMuted block uppercase tracking-widest">
            Frozen archive
          </span>
          <span className="text-2xl sm:text-3xl font-black text-vault-textPrimary tracking-tight mt-0.5 sm:mt-1 block">
            {coldProjects.length} projects
          </span>
          <span className="text-xs text-cyan-500 font-semibold block mt-0.5">
            preserved
          </span>
        </div>
      </div>

      {/* Frozen Projects Grid matching Screen 4 */}
      {coldProjects.length === 0 ? (
        <Card className="p-12 text-center text-vault-textMuted bg-vault-card border-vault-border">
          <Snowflake className="w-8 h-8 text-cyan-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-vault-textPrimary">No projects in Cold Store</h3>
          <p className="text-xs text-vault-textMuted mt-1">
            Projects with no activity for 60 days are automatically archived here to keep your active workspace uncluttered.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coldProjects.map((project) => {
            const isThawing = thawingId === project.id;
            return (
              <Card
                key={project.id}
                hoverEffect
                className="p-5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-vault-card border-vault-border"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
                        <h3 className="text-sm font-bold text-vault-textPrimary group-hover:text-cyan-500 transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-vault-textMuted mt-1 block font-medium">
                        Archived {formatDate(project.archived_at || project.updated_at)}
                      </span>
                    </div>

                    <Badge variant="cyan">Frozen</Badge>
                  </div>

                  <p className="text-xs text-vault-textMuted mt-3 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Cyan Progress Bar matching Screen 4 */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-vault-textMuted mb-1 font-mono">
                      <span>{project.progress}% preserved</span>
                      <span>Due {formatDateTime(project.due_date)}</span>
                    </div>
                    <ProgressBar
                      value={project.progress}
                      color="cyan"
                      size="sm"
                      showGlow
                    />
                  </div>

                  {/* Footer & Restore CTA matching Screen 4 */}
                  <div className="flex items-center justify-between pt-3 border-t border-vault-border">
                    {project.members && (
                      <AvatarStack users={project.members} max={3} size="xs" />
                    )}

                    <button
                      onClick={() => handleRestore(project.id)}
                      disabled={isThawing}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-500 hover:bg-cyan-500/10 border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Thaw and return project to active workspace"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isThawing ? 'animate-spin' : ''}`} />
                      <span>{isThawing ? 'Thawing...' : 'Restore'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
