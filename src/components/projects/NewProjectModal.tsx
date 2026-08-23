import React, { useState, useEffect } from 'react';
import { Plus, X, FolderGit2, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { Project, TeamCategory, User } from '../../types/database';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: Project) => void;
  onOpenNetwork?: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  onOpenNetwork,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamCategory, setTeamCategory] = useState<TeamCategory>('Product team');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [dueTime, setDueTime] = useState('17:00');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['BRAND', 'LAUNCH']);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      const networkUsers = dataService.getNetworkUsers(user);
      setAvailableUsers(networkUsers);
      if (user) {
        setSelectedMembers([user]);
      } else if (networkUsers.length > 0) {
        setSelectedMembers([networkUsers[0]]);
      } else {
        setSelectedMembers([]);
      }
    }
  }, [isOpen, user]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toUpperCase())) {
      setTags([...tags, tagInput.trim().toUpperCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleToggleMember = (u: User) => {
    if (selectedMembers.some(m => m.id === u.id)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter(m => m.id !== u.id));
      }
    } else {
      setSelectedMembers([...selectedMembers, u]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const fullDueDate = dueTime ? `${dueDate}T${dueTime}` : dueDate;

    const newProject = dataService.createProject({
      name: name.trim(),
      description: description.trim(),
      owner_id: user?.id || selectedMembers[0]?.id || availableUsers[0]?.id || '',
      status: 'active',
      progress: 0,
      due_date: fullDueDate,
      team_category: teamCategory,
      tags: tags.length > 0 ? tags : ['NEW PROJECT'],
      members: selectedMembers.length > 0 ? selectedMembers : (user ? [user] : []),
    }, user || undefined);

    setName('');
    setDescription('');
    if (onProjectCreated) onProjectCreated(newProject);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Set up project objectives, team allocation, and target milestones."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Project Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <FolderGit2 className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. Atlas Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Description
          </label>
          <textarea
            placeholder="Brief overview of project scope and deliverables..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] resize-none"
          />
        </div>

        {/* Team & Due Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
              Team Category
            </label>
            <select
              value={teamCategory}
              onChange={(e) => setTeamCategory(e.target.value as TeamCategory)}
              className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575] cursor-pointer"
            >
              <option value="Design team">Design team</option>
              <option value="Product team">Product team</option>
              <option value="Engineering team">Engineering team</option>
              <option value="Growth team">Growth team</option>
              <option value="Marketing team">Marketing team</option>
              <option value="Ops team">Ops team</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-vault-textSecondary">
              Target Launch Date & Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3 py-2 text-xs text-vault-textPrimary focus:outline-none focus:border-[#00E575]"
              />
            </div>
            <div className="flex gap-1.5 pt-0.5">
              {[
                { label: '9 AM', val: '09:00' },
                { label: '12 PM', val: '12:00' },
                { label: '5 PM', val: '17:00' },
                { label: '11:59 PM', val: '23:59' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDueTime(val)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    dueTime === val
                      ? 'bg-[#00E575]/20 text-[#045E33] dark:text-[#00E575] border-[#00E575]/40 font-bold'
                      : 'bg-vault-cardHover text-vault-textMuted border-vault-border hover:text-vault-textPrimary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-vault-textSecondary">
              Assign Team Members (From Network)
            </label>
            {onOpenNetwork && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNetwork();
                }}
                className="text-[11px] text-[#00C966] dark:text-[#00E575] hover:underline font-semibold cursor-pointer"
              >
                + Add Colleagues to Network
              </button>
            )}
          </div>
          {availableUsers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableUsers.map((u) => {
                const isSelected = selectedMembers.some(m => m.id === u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleMember(u)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00E575]/15 border-[#00E575]/50 text-[#045E33] dark:text-[#00E575] font-semibold'
                        : 'bg-vault-cardHover border-vault-border text-vault-textMuted hover:text-vault-textPrimary'
                    }`}
                  >
                    <Avatar user={u} size="xs" />
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-vault-cardHover border border-vault-border text-xs text-vault-textMuted flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00C966] dark:text-[#00E575]" />
                <span>No connected colleagues in your network yet.</span>
              </div>
              {onOpenNetwork && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNetwork();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00E575] text-[#042B16] hover:bg-[#00D069] cursor-pointer"
                >
                  Find People
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
            Project Tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. BRAND REFRESH"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-1.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575]"
            />
            <Button variant="secondary" size="sm" type="button" onClick={handleAddTag}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-vault-cardHover border border-vault-border text-vault-textSecondary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-vault-border">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            <Plus className="w-4 h-4 mr-1" />
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
