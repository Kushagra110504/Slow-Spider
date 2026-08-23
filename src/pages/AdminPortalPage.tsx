import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Users, FolderGit2, CheckCircle2, 
  Database, Activity, Search, 
  Snowflake, LogOut, ArrowLeft,
  Check, Lock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { User, Project, AdminPlatformStats } from '../types/database';
import { formatDate } from '../lib/utils';

export const AdminPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdminAuthenticated = user?.role === 'admin';

  // Admin Data State
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'audit'>('overview');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const loadData = () => {
      setStats(dataService.getAdminPlatformStats());
      setAllUsers(dataService.getAllPlatformUsers());
      setAllProjects(dataService.getAllPlatformProjects());
    };
    loadData();
    return dataService.subscribe(loadData);
  }, [isAdminAuthenticated]);

  const handleToggleUser = (userId: string, name: string) => {
    dataService.toggleUserStatus(userId);
    setNotification(`Updated account status for ${name}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (confirm(`Permanently remove user "${name}" and unassign their tasks?`)) {
      dataService.deletePlatformUser(userId);
      setNotification(`User ${name} deleted.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUnfreezeProject = (projId: string, name: string) => {
    dataService.restoreProject(projId);
    setNotification(`Thawed and restored project "${name}".`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
      p.team_category.toLowerCase().includes(projectSearch.toLowerCase())
    );
  }, [allProjects, projectSearch]);

  // Access Denied Screen for Non-Admin Users
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 p-[1px] shadow-2xl mb-1">
              <div className="w-full h-full bg-slate-900 rounded-[15px] flex items-center justify-center">
                <Lock className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Administrator Access Required
            </h1>
            <p className="text-xs text-slate-400">
              This portal is restricted to authorized platform administrators.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs leading-relaxed">
              {user ? (
                <span>
                  Logged in as <strong className="text-white">{user.email}</strong>. Your account does not possess administrator privileges.
                </span>
              ) : (
                <span>You must be authenticated with an administrator account to view this section.</span>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Workspace</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Master Admin Control Center Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">Slow Spider Master Control Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                  ADMINISTRATOR
                </span>
              </div>
              <p className="text-xs text-slate-400">Global tenant analytics, security oversight, and infrastructure state</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            User Directory ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'projects'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Projects Registry ({allProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Security & Infrastructure State
          </button>
        </div>

        {/* Tab 1: Overview & Telemetry */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Top Stat Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Total Accounts</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total_users}</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{stats.active_users} active accounts</span>
                </div>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Managed Projects</span>
                  <FolderGit2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total_projects}</div>
                <div className="text-[11px] text-slate-400">
                  {stats.active_projects} active • {stats.cold_store_projects} preserved
                </div>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Overall Delivery</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.avg_completion_rate}%</div>
                <div className="text-[11px] text-cyan-400">
                  {stats.completed_tasks} of {stats.total_tasks} tasks completed
                </div>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold">Storage Mode</span>
                  <Database className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  {stats.database_status}
                </div>
                <div className="text-[11px] text-slate-400">
                  Row-Level Security Enforced
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Registered User Directory</h2>
                <p className="text-xs text-slate-400">Manage user access, roles, and account lifecycle status.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Registered</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 flex items-center gap-3">
                          <img src={u.avatar_url || ''} alt={u.name} className="w-8 h-8 rounded-full bg-slate-800" />
                          <div>
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <Badge variant={u.role === 'admin' ? 'purple' : 'neutral'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active !== false 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {u.is_active !== false ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-400">{formatDate(u.created_at)}</td>
                        <td className="py-3.5 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleUser(u.id, u.name)}
                            className="text-[11px] py-1"
                          >
                            {u.is_active !== false ? 'Deactivate' : 'Reactivate'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="text-[11px] py-1"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Projects Registry */}
        {activeTab === 'projects' && (
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Global Projects Registry</h2>
                <p className="text-xs text-slate-400">View and manage all workspace initiatives across the platform.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search project..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Team Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No projects found.</td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold text-white">{p.name}</td>
                        <td className="py-3.5 text-slate-400">{p.team_category}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'frozen'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : p.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono">{p.progress}%</td>
                        <td className="py-3.5 text-slate-400">{formatDate(p.due_date)}</td>
                        <td className="py-3.5 text-right">
                          {p.status === 'frozen' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUnfreezeProject(p.id, p.name)}
                              className="text-[11px] py-1"
                            >
                              <Snowflake className="w-3 h-3 mr-1" />
                              Thaw
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Security & Infrastructure State */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Security Architecture & RLS Status</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Tenant Row-Level Security</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Granular isolation active across projects, tasks, milestones, inbox, and attachments.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Administrative endpoints strictly gated via verified database role. Client-side backdoor credentials permanently eradicated.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
