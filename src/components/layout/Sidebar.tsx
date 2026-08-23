import React from 'react';
import {
  LayoutGrid, FolderGit2, Calendar, Snowflake, Trash2,
  Users, AlertCircle, LucideIcon, X
} from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 'dashboard' | 'projects' | 'project-details' | 'calendar' | 'cold-store' | 'trash';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: (val?: boolean) => void;
  selectedProjectId?: string;
  trashCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  trashCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'cold-store', label: 'Cold Store', icon: Snowflake },
    { id: 'trash', label: 'Trash', icon: Trash2, badge: trashCount > 0 ? trashCount : undefined },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        className={cn(
          "w-64 bg-vault-sidebar border-r border-vault-border flex flex-col justify-between h-screen shrink-0 select-none z-50 transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 md:sticky md:top-0 md:translate-x-0",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header / Workspace */}
        <div>
          <div className="p-5 pb-6 border-b border-vault-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Slow Spider"
                className="w-8 h-8 object-contain logo-stroke-outline shrink-0"
              />
              <div>
                <h1 className="text-sm font-bold text-vault-textPrimary tracking-tight">
                  SLOW SPIDER
                </h1>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.id === 'projects' && currentTab === 'project-details');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as NavTab);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer text-left',
                    isActive
                      ? 'bg-[#00E575]/10 text-vault-textPrimary shadow-sm border border-[#00E575]/30'
                    : 'text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-[#00C966] dark:text-[#00E575]' : 'text-vault-textMuted group-hover:text-vault-textPrimary'
                    )}
                  />
                  <span className={isActive ? 'font-semibold text-vault-textPrimary' : ''}>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        {/* Dynamic Context Card based on tab */}
        {currentTab === 'cold-store' ? (
          <div className="p-3.5 rounded-xl bg-vault-cardHover border border-vault-border text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-500 font-semibold">
              <Snowflake className="w-3.5 h-3.5" />
              <span>60-day preservation</span>
            </div>
            <p className="text-vault-textMuted leading-relaxed text-[11px]">
              Projects inactive for 60 days are preserved here until restored. Notes, history, and progress thaw back into your workspace.
            </p>
          </div>
        ) : currentTab === 'trash' ? (
          <div className="p-3.5 rounded-xl bg-vault-cardHover border border-vault-border text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>90-day retention</span>
            </div>
            <p className="text-vault-textMuted leading-relaxed text-[11px]">
              Items are permanently deleted automatically once the 90-day countdown ends.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-vault-cardHover border border-vault-border text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#00E575]/15 border border-[#00E575]/30 flex items-center justify-center text-[#00C966] dark:text-[#00E575] shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-vault-textPrimary text-[11px] truncate">
                  {user ? `${user.name.split(' ')[0]}'s Workspace` : 'Active Workspace'}
                </p>
                <p className="text-vault-textMuted text-[10px]">Personal Space</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#00E575] shadow-[0_0_8px_rgba(0,229,117,0.7)] animate-pulse shrink-0"></span>
          </div>
        )}

        {/* Appearance switch */}
        <div
          onClick={() => onToggleDarkMode(!isDarkMode)}
          className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between cursor-pointer hover:border-vault-borderLight transition-all"
        >
          <div>
            <p className="text-[10px] text-vault-textMuted uppercase tracking-wider font-semibold">Appearance</p>
            <p className="text-xs text-vault-textPrimary font-medium mt-0.5">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </p>
          </div>
          <Toggle checked={isDarkMode} onChange={onToggleDarkMode} />
        </div>
      </div>
    </aside>
  </>
  );
};
