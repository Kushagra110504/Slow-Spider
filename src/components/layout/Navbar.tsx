import React from 'react';
import { Search, Bell, Plus, Inbox as InboxIcon, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenInbox: () => void;
  onOpenNewProject: () => void;
  onOpenProfile: () => void;
  onOpenNetwork?: () => void;
  unreadCount?: number;
  inboxCount?: number;
  pendingRequestsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenInbox,
  onOpenNewProject,
  onOpenProfile,
  onOpenNetwork,
  unreadCount = 0,
  inboxCount = 0,
  pendingRequestsCount = 0,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-vault-border bg-vault-surface/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Search trigger button */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textMuted text-xs hover:border-vault-borderLight hover:text-vault-textPrimary transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search projects, tasks, or milestones...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded bg-vault-card border border-vault-border text-[10px] font-mono text-vault-textMuted">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Network quick trigger */}
        {onOpenNetwork && (
          <button
            onClick={onOpenNetwork}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textSecondary hover:text-[#00C966] hover:border-[#00E575]/50 text-xs font-medium transition-all cursor-pointer"
            title="My Network (Colleagues & Connections)"
          >
            <Users className="w-4 h-4 text-[#00C966] dark:text-[#00E575]" />
            <span>Network</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        )}

        {/* Floating Inbox quick trigger */}
        <button
          onClick={onOpenInbox}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textSecondary hover:text-[#00C966] hover:border-[#00E575]/50 text-xs font-medium transition-all cursor-pointer"
          title="Floating Inbox (Quick capture space)"
        >
          <InboxIcon className="w-4 h-4 text-[#00C966] dark:text-[#00E575]" />
          <span>Floating Inbox</span>
          {inboxCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#00E575]/20 text-[#045E33] dark:text-[#00E575] text-[10px] font-bold">
              {inboxCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-vault-cardHover border border-vault-border text-vault-textMuted hover:text-vault-textPrimary hover:border-vault-borderLight transition-colors cursor-pointer"
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
          className="shadow-glow-green"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-vault-border" />

        {/* User Profile Trigger Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 pl-1 p-1 rounded-xl hover:bg-vault-cardHover transition-colors cursor-pointer"
          title="Open Profile Settings"
        >
          <Avatar user={user} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-vault-textPrimary leading-tight">
              {user?.name || 'User'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
