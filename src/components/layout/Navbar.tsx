import React from 'react';
import { Search, Bell, Plus, Users, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenNewProject: () => void;
  onOpenProfile: () => void;
  onOpenNetwork?: () => void;
  onToggleMobileSidebar?: () => void;
  unreadCount?: number;
  pendingRequestsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenNewProject,
  onOpenProfile,
  onOpenNetwork,
  onToggleMobileSidebar,
  unreadCount = 0,
  pendingRequestsCount = 0,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-vault-border bg-vault-surface/90 backdrop-blur-md px-3 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors w-full">
      {/* Left: Mobile hamburger toggle & Brand on mobile */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover border border-vault-border shrink-0 cursor-pointer active:scale-95 transition-all"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Brand indicator (when sidebar is hidden) */}
        <div className="flex md:hidden items-center gap-2 shrink-0 select-none">
          <img
            src="/logo.png"
            alt="Slow Spider"
            className="w-6 h-6 object-contain logo-stroke-outline"
          />
        </div>

        {/* Search trigger button */}
        <button
          onClick={onOpenSearch}
          className="flex-1 max-w-sm flex items-center justify-between px-3 py-1.5 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textMuted text-xs hover:border-vault-borderLight hover:text-vault-textPrimary transition-all cursor-pointer shadow-xs min-w-0"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate hidden sm:inline">Search projects, tasks, milestones...</span>
            <span className="truncate sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-vault-card border border-vault-border text-[9px] font-mono text-vault-textMuted ml-1">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Network quick trigger (visible on sm+) */}
        {onOpenNetwork && (
          <button
            onClick={onOpenNetwork}
            className="hidden sm:flex relative items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textSecondary hover:text-[#00C966] hover:border-[#00E575]/50 text-xs font-medium transition-all cursor-pointer"
            title="My Network"
          >
            <Users className="w-4 h-4 text-[#00C966] dark:text-[#00E575]" />
            <span className="hidden md:inline">Network</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textMuted hover:text-vault-textPrimary hover:border-vault-borderLight transition-colors cursor-pointer active:scale-95"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-glow-red" />
          )}
        </button>

        {/* New Project Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewProject}
          className="shadow-glow-green text-xs font-bold px-2.5 sm:px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline ml-1">New Project</span>
        </Button>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-vault-border" />

        {/* User Profile Trigger Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-vault-cardHover transition-colors cursor-pointer"
          title="User Profile & Settings"
        >
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </header>
  );
};
