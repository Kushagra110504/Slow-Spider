import React, { useState } from 'react';
import { LogOut, Mail, Check, Users, Bell } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';
import { deadlineService } from '../../services/deadlineService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNetwork?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onOpenNetwork }) => {
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [emailAlerts, setEmailAlerts] = useState<boolean>(deadlineService.isEmailAlertsEnabled());
  const [isSaved, setIsSaved] = useState(false);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile({
      name: name.trim(),
      avatar_url: avatarUrl.trim() || undefined,
    });
    deadlineService.setEmailAlertsEnabled(emailAlerts);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleSignOut = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile & Settings"
      description="Manage your account preferences and session."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* User Badge Banner */}
        <div className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar user={{ name, avatar_url: avatarUrl }} size="lg" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-vault-textPrimary truncate">{user.name}</h4>
              <p className="text-xs text-vault-textMuted flex items-center gap-1.5 mt-0.5 truncate font-mono">
                <Mail className="w-3 h-3 shrink-0" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>
          {onOpenNetwork && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNetwork();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#00E575]/15 border border-[#00E575]/40 text-[#045E33] dark:text-[#00E575] text-xs font-bold hover:bg-[#00E575]/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Network</span>
            </button>
          )}
        </div>

        {/* Edit Name */}
        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Edit Avatar URL */}
        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Avatar Image URL
          </label>
          <input
            type="text"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Notification Preferences */}
        <div className="p-3.5 rounded-xl bg-vault-cardHover/70 border border-vault-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00E575]" />
              <div>
                <h5 className="text-xs font-bold text-vault-textPrimary">Deadline Email Alerts</h5>
                <p className="text-[11px] text-vault-textMuted">Send automated notifications at 24h, 12h, and 1h before due dates.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-vault-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E575] border border-vault-border"></div>
            </label>
          </div>
        </div>

        {/* Account Info */}
        <div className="text-[11px] text-vault-textMuted pt-1">
          Member since {formatDate(user.created_at)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-vault-border">
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={handleSignOut}
            className="text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign Out
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
