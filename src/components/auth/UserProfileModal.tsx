import React, { useState } from 'react';
import { LogOut, Mail, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile({
      name: name.trim(),
      avatar_url: avatarUrl.trim() || undefined,
    });
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
        <div className="p-4 rounded-2xl bg-vault-cardHover border border-vault-border flex items-center gap-4">
          <Avatar user={{ name, avatar_url: avatarUrl }} size="lg" />
          <div>
            <h4 className="text-sm font-bold text-vault-textPrimary">{user.name}</h4>
            <p className="text-xs text-vault-textMuted flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
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

        {/* Account Info */}
        <div className="text-[11px] text-vault-textMuted pt-2">
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
