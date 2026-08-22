import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Check, X, 
  Clock, CheckCircle2, AlertCircle, Trash2, ArrowRight
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { User, UserConnection } from '../../types/database';
import { formatDate } from '../../lib/utils';

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'network' | 'requests' | 'find';
}

export const NetworkModal: React.FC<NetworkModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'network',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'network' | 'requests' | 'find'>(initialTab);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;
    const update = () => {
      setConnections(dataService.getConnections(user));
    };
    update();
    return dataService.subscribe(update);
  }, [isOpen, user]);

  const acceptedConnections = useMemo(() => {
    return connections.filter(c => c.status === 'accepted');
  }, [connections]);

  const incomingRequests = useMemo(() => {
    if (!user) return [];
    return connections.filter(c => 
      c.status === 'pending' && 
      (c.recipient_id === user.id || (c.recipient_email && c.recipient_email.toLowerCase() === user.email.toLowerCase()))
    );
  }, [connections, user]);

  const outgoingRequests = useMemo(() => {
    if (!user) return [];
    return connections.filter(c => 
      c.status === 'pending' && 
      c.requester_id === user.id
    );
  }, [connections, user]);

  const searchResults = useMemo(() => {
    if (!user || !searchQuery.trim()) return [];
    return dataService.searchUsersToConnect(searchQuery, user);
  }, [searchQuery, user, connections]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSendRequest = (targetUser: User) => {
    if (!user) return;
    const res = dataService.sendConnectionRequest(targetUser.id, user);
    if (res.success) {
      showStatus(`Connection request sent to ${targetUser.name}!`);
    } else {
      showStatus(res.error || 'Failed to send request.', 'error');
    }
  };

  const handleAccept = (connectionId: string, name: string) => {
    if (!user) return;
    dataService.acceptConnectionRequest(connectionId, user);
    showStatus(`Connected with ${name}! You can now collaborate on projects.`);
  };

  const handleDecline = (connectionId: string) => {
    if (!user) return;
    dataService.declineConnectionRequest(connectionId, user);
    showStatus('Connection request declined.');
  };

  const handleRemove = (connectionId: string, name: string) => {
    if (!user) return;
    if (confirm(`Remove ${name} from your network? You will need to reconnect before adding them to new projects.`)) {
      dataService.removeConnection(connectionId, user);
      showStatus(`Removed ${name} from your network.`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Professional Network & Colleagues" maxWidth="lg">
      <div className="space-y-5">
        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-[#00E575]/15 border border-[#00E575]/40 text-[#045E33] dark:text-[#00E575]'
                : 'bg-red-500/10 border border-red-500/30 text-red-500'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00E575]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-vault-border pb-3">
          <button
            onClick={() => setActiveTab('network')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'network'
                ? 'bg-[#00E575]/15 border border-[#00E575]/40 text-[#045E33] dark:text-[#00E575]'
                : 'text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Network</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-vault-cardHover text-vault-textSecondary font-mono">
              {acceptedConnections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'requests'
                ? 'bg-[#00E575]/15 border border-[#00E575]/40 text-[#045E33] dark:text-[#00E575]'
                : 'text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-bold animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'find'
                ? 'bg-[#00E575]/15 border border-[#00E575]/40 text-[#045E33] dark:text-[#00E575]'
                : 'text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Find Colleagues</span>
          </button>
        </div>

        {/* Tab 1: My Network */}
        {activeTab === 'network' && (
          <div className="space-y-3 min-h-[220px]">
            {acceptedConnections.length === 0 ? (
              <div className="p-8 text-center bg-vault-cardHover/50 rounded-2xl border border-vault-border space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center mx-auto text-[#00E575]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-vault-textPrimary">Your network is empty</h4>
                  <p className="text-[11px] text-vault-textMuted mt-1 max-w-sm mx-auto leading-relaxed">
                    To maintain privacy, you can only collaborate and invite users who have mutually connected with you.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('find')}
                  className="mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  <span>Find & Add Colleagues</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {acceptedConnections.map((c) => {
                  const isRequester = c.requester_id === user?.id;
                  const colleagueName = isRequester ? c.recipient_name : c.requester_name;
                  const colleagueAvatar = isRequester ? c.recipient_avatar : c.requester_avatar;
                  const colleagueEmail = isRequester ? c.recipient_email : c.requester_email;

                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between gap-3 group hover:border-vault-borderLight transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={colleagueAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(colleagueName)}`}
                          alt={colleagueName}
                          className="w-8 h-8 rounded-full bg-vault-card border border-vault-border shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-vault-textPrimary truncate">{colleagueName}</h4>
                          <p className="text-[10px] text-vault-textMuted truncate font-mono">
                            {colleagueEmail || 'Connected Member'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(c.id, colleagueName)}
                        className="p-1.5 rounded-lg text-vault-textMuted hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                        title="Remove from Network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4 min-h-[220px]">
            {/* Incoming Requests */}
            <div>
              <h4 className="text-[11px] font-bold text-vault-textMuted uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Incoming Requests ({incomingRequests.length})</span>
              </h4>

              {incomingRequests.length === 0 ? (
                <p className="text-xs text-vault-textMuted italic py-2">No incoming connection requests.</p>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={req.requester_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.requester_name)}`}
                          alt={req.requester_name}
                          className="w-8 h-8 rounded-full bg-vault-card border border-vault-border shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-vault-textPrimary truncate">
                            {req.requester_name}
                          </h4>
                          <p className="text-[10px] text-vault-textMuted truncate">
                            Wants to connect with you • {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(req.id, req.requester_name)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-[#00E575] hover:bg-[#00D069] text-[#042B16] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-vault-textMuted hover:text-red-400 hover:bg-red-500/10 border border-vault-border transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="pt-3 border-t border-vault-border">
              <h4 className="text-[11px] font-bold text-vault-textMuted uppercase tracking-wider mb-2">
                Sent Requests Pending Approval ({outgoingRequests.length})
              </h4>

              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-vault-textMuted italic py-2">No pending sent requests.</p>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={req.recipient_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.recipient_name)}`}
                          alt={req.recipient_name}
                          className="w-7 h-7 rounded-full bg-vault-card border border-vault-border shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-vault-textPrimary truncate">{req.recipient_name}</h4>
                          <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting response</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDecline(req.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-card border border-vault-border transition-all cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Find Colleagues */}
        {activeTab === 'find' && (
          <div className="space-y-3.5 min-h-[220px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-vault-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search colleagues by full name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-vault-cardHover border border-vault-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim() === '' ? (
              <div className="p-6 text-center text-vault-textMuted text-xs space-y-1">
                <p>Type a colleague's name above to find and add them to your Slow Spider network.</p>
                <p className="text-[11px] text-vault-textMuted/70">
                  Once connected, you will be able to add them to your project teams and assign tasks.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-vault-textMuted text-xs">
                No users found matching "{searchQuery}". Make sure their account is registered.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {searchResults.map(({ user: targetUser, connectionStatus }) => (
                  <div
                    key={targetUser.id}
                    className="p-3 rounded-xl bg-vault-cardHover border border-vault-border flex items-center justify-between gap-3 hover:border-vault-borderLight transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={targetUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetUser.name)}`}
                        alt={targetUser.name}
                        className="w-8 h-8 rounded-full bg-vault-card border border-vault-border shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-vault-textPrimary truncate">{targetUser.name}</h4>
                        <p className="text-[10px] text-vault-textMuted truncate font-mono">{targetUser.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {connectionStatus === 'connected' ? (
                        <Badge variant="green" dot>
                          Connected
                        </Badge>
                      ) : connectionStatus === 'pending_sent' ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Request Sent</span>
                        </span>
                      ) : connectionStatus === 'pending_received' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActiveTab('requests')}
                          className="text-[11px] py-1"
                        >
                          <span>Review Request</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : connectionStatus === 'self' ? (
                        <span className="text-[10px] text-vault-textMuted font-semibold px-2 py-0.5 rounded-full bg-vault-card border border-vault-border">
                          You
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(targetUser)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00E575] hover:bg-[#00D069] text-[#042B16] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add to Network</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
