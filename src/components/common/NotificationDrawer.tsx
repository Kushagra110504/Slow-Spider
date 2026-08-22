import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, Info, CheckCircle2, UserPlus, Check } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Notification, TeamInvitation } from '../../types/database';
import { formatTimeAgo } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);

  useEffect(() => {
    const update = () => {
      setNotifications(dataService.getNotifications(user));
      if (user?.email) {
        setInvitations(dataService.getPendingInvitationsForUser(user.email));
      }
    };
    update();
    return dataService.subscribe(update);
  }, [user]);

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    dataService.markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    dataService.markAllNotificationsAsRead(user);
  };

  const handleAcceptInvite = (inviteId: string) => {
    if (!user) return;
    dataService.acceptTeamInvitation(inviteId, user);
  };

  const handleDeclineInvite = (inviteId: string) => {
    dataService.declineTeamInvitation(inviteId);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm bg-vault-surface border-l border-vault-border h-full shadow-2xl z-10 flex flex-col animate-slide-up text-vault-textPrimary">
        {/* Header */}
        <div className="p-5 border-b border-vault-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-vault-textPrimary">Notifications & Invites</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-vault-textMuted hover:text-emerald-500 flex items-center gap-1 transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications & Invites List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Pending Team Invitations Section */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Pending Team Invites ({invitations.length})</span>
              </h3>
              {invitations.map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-vault-textPrimary space-y-2.5 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      user={{ name: inv.inviter_name, avatar_url: inv.inviter_avatar }}
                      size="sm"
                      className="shrink-0 mt-0.5 border border-emerald-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight">
                        <span className="text-emerald-400">{inv.inviter_name}</span> invited you to join:
                      </p>
                      <p className="text-xs font-bold text-vault-textPrimary mt-0.5">{inv.project_name}</p>
                      <span className="text-[10px] text-vault-textMuted font-mono block mt-1">Role: {inv.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1 py-1.5 text-xs font-bold"
                      onClick={() => handleAcceptInvite(inv.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="py-1.5 text-xs text-vault-textMuted hover:text-red-400"
                      onClick={() => handleDeclineInvite(inv.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standard Notifications */}
          {notifications.length === 0 && invitations.length === 0 ? (
            <div className="py-16 text-center text-vault-textMuted text-xs">
              No notifications right now.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  n.read
                    ? 'bg-vault-card/60 border-vault-border text-vault-textMuted'
                    : 'bg-vault-cardHover border-vault-borderLight text-vault-textPrimary shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-vault-card border border-vault-border shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate">{n.title}</h4>
                    <p className="text-[11px] text-vault-textMuted mt-0.5 leading-snug">{n.message}</p>
                    <span className="text-[10px] text-vault-textMuted block mt-2 font-mono">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
