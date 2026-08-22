import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, Search, RotateCcw, FolderGit2, 
  CheckSquare, Flag
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { dataService } from '../services/dataService';
import { TrashItem } from '../types/database';
import { formatDate } from '../lib/utils';

import { useAuth } from '../context/AuthContext';

export const TrashPage: React.FC = () => {
  const { user } = useAuth();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Project' | 'Task' | 'Milestone'>('All');

  useEffect(() => {
    const update = () => setTrashItems(dataService.getTrashItems(user));
    update();
    return dataService.subscribe(update);
  }, [user]);

  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source_workspace.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || item.entity_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [trashItems, searchQuery, typeFilter]);

  const handleRestore = (id: string) => {
    dataService.restoreTrashItem(id);
  };

  const handlePermanentDelete = (id: string) => {
    if (confirm('Permanently delete this item? This action cannot be undone.')) {
      dataService.permanentDeleteTrashItem(id);
    }
  };

  const handleRestoreAll = () => {
    if (confirm('Restore all items back to their workspaces?')) {
      dataService.restoreAllTrash();
    }
  };

  const getEntityIcon = (type: TrashItem['entity_type']) => {
    switch (type) {
      case 'Project':
        return <FolderGit2 className="w-4 h-4 text-vault-textMuted" />;
      case 'Task':
        return <CheckSquare className="w-4 h-4 text-vault-textMuted" />;
      case 'Milestone':
        return <Flag className="w-4 h-4 text-vault-textMuted" />;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Remaining Counter matching Screen 6 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-vault-textPrimary tracking-tight">Trash</h1>
          <p className="text-xs text-vault-textMuted mt-1 max-w-xl leading-relaxed">
            Review deleted projects, tasks, and milestones before they are permanently removed.
          </p>
        </div>

        {/* Remaining Deletion Counter */}
        <div className="p-5 rounded-2xl bg-vault-card border border-vault-border shadow-card min-w-[200px] text-right">
          <span className="text-[10px] font-bold text-vault-textMuted block uppercase tracking-widest">
            Remaining before deletion
          </span>
          <span className="text-3xl font-black text-vault-textPrimary tracking-tight mt-1 block">
            {trashItems.length} items
          </span>
        </div>
      </div>

      {/* Search & Action Bar matching Screen 6 */}
      <div className="flex flex-wrap items-center gap-3 bg-vault-card p-3 rounded-2xl border border-vault-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-vault-cardHover border border-vault-border">
          {(['All', 'Project', 'Task', 'Milestone'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-vault-card text-vault-textPrimary shadow-sm border border-vault-border'
                  : 'text-vault-textMuted hover:text-vault-textPrimary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Restore All Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRestoreAll}
          disabled={trashItems.length === 0}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Restore all
        </Button>
      </div>

      {/* Deleted Items List matching Screen 6 */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center text-vault-textMuted bg-vault-card border-vault-border">
          <Trash2 className="w-8 h-8 text-vault-textMuted mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-vault-textPrimary">Trash is empty</h3>
          <p className="text-xs text-vault-textMuted mt-1">
            Deleted projects, tasks, or milestones will be preserved here for 90 days before permanent purging.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isUrgent = item.days_remaining <= 10;
            return (
              <Card
                key={item.id}
                hoverEffect
                className="p-4 bg-vault-card border-vault-border flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left side: Icon + Title + Meta */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-vault-cardHover border border-vault-border shrink-0">
                    {getEntityIcon(item.entity_type)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-vault-textPrimary truncate">
                        {item.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-vault-cardHover text-vault-textSecondary border border-vault-border">
                        {item.entity_type}
                      </span>
                    </div>
                    <p className="text-xs text-vault-textMuted mt-1">
                      Deleted {formatDate(item.deleted_at)} • From {item.source_workspace}
                    </p>
                  </div>
                </div>

                {/* Right side: Countdown badge + Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  {/* Days remaining badge */}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      isUrgent
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    }`}
                  >
                    {item.days_remaining} days left
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-500 hover:bg-blue-500/10 border border-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>

                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
