import React, { useState } from 'react';
import { UserPlus, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Project } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Validation } from '../../lib/validation';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onInviteSent?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  project,
  onInviteSent,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const emailValidation = Validation.validateEmail(email.trim());
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || 'Please enter a valid email address.');
      }
      dataService.createTeamInvitation(project.id, email.trim(), user, role);
      setSuccess(`Invitation sent to ${email.trim()}! Once they accept, they will see "${project.name}" in their workspace.`);
      setEmail('');
      if (onInviteSent) onInviteSent();
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleInvite} className="space-y-4">
        <p className="text-xs text-vault-textMuted leading-relaxed">
          Invite a colleague to collaborate on <strong className="text-vault-textPrimary font-semibold">{project.name}</strong>. They will only see this project once they accept the invitation.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Colleague's Email Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors"
            />
          </div>

          {/* Quick pick from network */}
          {user && (() => {
            const network = dataService.getNetworkUsers(user).filter(u => 
              u.id !== user.id && 
              !project.members?.some(m => m.id === u.id || m.email.toLowerCase() === u.email.toLowerCase())
            );
            if (network.length === 0) return null;
            return (
              <div className="mt-2">
                <span className="text-[10px] text-vault-textMuted font-semibold uppercase tracking-wider block mb-1">
                  Quick Pick from Network:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {network.map((nu) => (
                    <button
                      key={nu.id}
                      type="button"
                      onClick={() => setEmail(nu.email)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        email.toLowerCase() === nu.email.toLowerCase()
                          ? 'bg-[#00E575]/20 border-[#00E575]/50 text-[#045E33] dark:text-[#00E575] font-bold'
                          : 'bg-vault-cardHover border-vault-border text-vault-textSecondary hover:text-vault-textPrimary'
                      }`}
                    >
                      <span>{nu.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Project Role & Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('member')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                role === 'member'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-vault-textPrimary'
                  : 'bg-vault-cardHover border-vault-border text-vault-textMuted hover:text-vault-textPrimary'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-emerald-400">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Team Member</span>
              </div>
              <p className="text-[10px] text-vault-textMuted mt-1">Can create, edit, and complete tasks</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('viewer')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                role === 'viewer'
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-vault-textPrimary'
                  : 'bg-vault-cardHover border-vault-border text-vault-textMuted hover:text-vault-textPrimary'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-cyan-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Viewer</span>
              </div>
              <p className="text-[10px] text-vault-textMuted mt-1">Read-only view of project progress</p>
            </button>
          </div>
        </div>

        {/* Existing Team Members */}
        {project.members && project.members.length > 0 && (
          <div className="pt-2 border-t border-vault-border">
            <h4 className="text-[11px] font-semibold text-vault-textMuted mb-2">Current Project Members ({project.members.length})</h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-vault-cardHover/50 border border-vault-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <img src={m.avatar_url} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-vault-textPrimary font-medium">{m.name}</span>
                    <span className="text-[10px] text-vault-textMuted">({m.email})</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {project.owner_id === m.id ? 'Owner' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
