import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, LayoutGrid, List, Plus, 
  Snowflake, Trash2, Calendar as CalendarIcon 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { AvatarStack } from '../components/ui/Avatar';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus } from '../types/database';
import { formatDate, formatDateTime } from '../lib/utils';
import { NavTab } from '../components/layout/Sidebar';

interface ProjectsPageProps {
  onNavigate: (tab: NavTab, projectId?: string) => void;
  onOpenNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onNavigate,
  onOpenNewProject,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  useEffect(() => {
    const update = () => setProjects(dataService.getProjects(user));
    update();
    return dataService.subscribe(update);
  }, [user]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesTeam = teamFilter === 'all' || p.team_category === teamFilter;

      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [projects, searchQuery, statusFilter, teamFilter]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="green">Active</Badge>;
      case 'at_risk':
        return <Badge variant="amber">At risk</Badge>;
      case 'overdue':
        return <Badge variant="red">Overdue</Badge>;
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getProgressColor = (status: ProjectStatus) => {
    switch (status) {
      case 'at_risk':
        return 'amber' as const;
      case 'overdue':
        return 'red' as const;
      case 'completed':
      case 'active':
      default:
        return 'green' as const;
    }
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.archiveProject(id, user || undefined);
  };

  const handleTrash = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.trashProject(id);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-vault-textPrimary tracking-tight">Projects</h1>
          <p className="text-xs text-vault-textMuted mt-1">
            Track delivery, status, and team ownership in one place
          </p>
        </div>

        {/* View switcher & New Project */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-vault-card border border-vault-border flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-vault-textMuted hover:text-vault-textPrimary transition-colors ${
                viewMode === 'grid' ? 'bg-vault-cardHover text-[#00C966] dark:text-[#00E575] shadow-sm font-semibold' : ''
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-vault-textMuted hover:text-vault-textPrimary transition-colors ${
                viewMode === 'list' ? 'bg-vault-cardHover text-[#00C966] dark:text-[#00E575] shadow-sm font-semibold' : ''
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={onOpenNewProject}>
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 bg-vault-card p-3 rounded-2xl border border-vault-border">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-9 pr-3.5 py-2 sm:py-1.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-vault-cardHover border border-vault-border rounded-xl px-3 py-2 sm:py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575] transition-colors cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="at_risk">At risk</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full sm:w-auto bg-vault-cardHover border border-vault-border rounded-xl px-3 py-2 sm:py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575] transition-colors cursor-pointer"
          >
            <option value="all">Team: All</option>
            <option value="Design team">Design team</option>
            <option value="Product team">Product team</option>
            <option value="Engineering team">Engineering team</option>
            <option value="Growth team">Growth team</option>
            <option value="Marketing team">Marketing team</option>
            <option value="Ops team">Ops team</option>
          </select>
        </div>
      </div>

      {/* Projects List / Grid View */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-vault-textMuted bg-vault-card border border-vault-border rounded-2xl space-y-3">
          <p className="text-sm font-medium">No active projects match your filters.</p>
          <Button variant="secondary" size="sm" onClick={onOpenNewProject} className="text-[#00C966] dark:text-[#00E575] hover:border-[#00E575]/50">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Project
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3.5">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hoverEffect
              onClick={() => onNavigate('project-details', project.id)}
              className="p-4 sm:p-5 cursor-pointer group relative bg-vault-card border-vault-border"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
                {/* Left Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-vault-textPrimary group-hover:text-[#00C966] dark:group-hover:text-[#00E575] transition-colors truncate">
                      {project.name}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-xs text-vault-textMuted mt-1 line-clamp-1">
                    {project.description}
                  </p>
                </div>

                {/* Right Info: Due Date */}
                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs font-semibold text-vault-textMuted flex items-center md:justify-end gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-vault-textMuted" />
                    Due {formatDate(project.due_date)}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="mt-3.5 sm:mt-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-vault-textMuted">
                  <span>{project.progress}% complete</span>
                </div>
                <ProgressBar
                  value={project.progress}
                  color={getProgressColor(project.status)}
                  size="sm"
                  showGlow
                />
              </div>

              {/* Bottom Meta Bar: Tags & Members */}
              <div className="mt-3.5 sm:mt-4 pt-3 border-t border-vault-border flex flex-wrap items-center justify-between gap-2.5 text-xs text-vault-textMuted">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-semibold text-vault-textSecondary uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-vault-cardHover border border-vault-border">
                    {project.team_category}
                  </span>
                  {project.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-vault-cardHover text-vault-textMuted border border-vault-border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  {project.members && project.members.length > 0 && (
                    <AvatarStack users={project.members} size="xs" max={3} />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleArchive(e, project.id)}
                      className="p-1.5 rounded-lg hover:bg-vault-cardHover text-vault-textMuted hover:text-cyan-500 transition-colors cursor-pointer"
                      title="Archive Project"
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleTrash(e, project.id)}
                      className="p-1.5 rounded-lg hover:bg-vault-cardHover text-vault-textMuted hover:text-red-500 transition-colors cursor-pointer"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              onClick={() => onNavigate('project-details', project.id)}
              className="p-5 flex flex-col justify-between hover:border-vault-borderLight hover:shadow-xl transition-all cursor-pointer group bg-vault-card border-vault-border"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="neutral">
                    {project.team_category}
                  </Badge>
                  {getStatusBadge(project.status)}
                </div>

                <h3 className="text-base font-bold text-vault-textPrimary mt-3.5 group-hover:text-[#00E575] transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-vault-textMuted mt-1.5 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="mt-5 space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-vault-textMuted mb-1.5">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar
                    value={project.progress}
                    color={getProgressColor(project.status)}
                    size="sm"
                    showGlow
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-vault-textMuted font-mono">
                  <span className="text-[11px]">Due {formatDateTime(project.due_date)}</span>
                  {project.members && project.members.length > 0 && (
                    <AvatarStack users={project.members} size="xs" max={3} />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
