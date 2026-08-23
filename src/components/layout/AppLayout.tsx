import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Navbar } from './Navbar';
import { CommandSearchModal } from '../common/CommandSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { FloatingInbox } from '../inbox/FloatingInbox';
import { NewProjectModal } from '../projects/NewProjectModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { NetworkModal } from '../network/NetworkModal';
import { dataService } from '../../services/dataService';
import { deadlineService } from '../../services/deadlineService';
import { Project } from '../../types/database';
import { Sparkles } from 'lucide-react';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedProjectId?: string;
  onNavigateToProject: (projectId: string) => void;
  children: React.ReactNode;
  isDarkMode?: boolean;
  onToggleDarkMode?: (val?: boolean) => void;
  isNewProjectOpen?: boolean;
  onOpenNewProject?: () => void;
  onCloseNewProject?: () => void;
}

import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  selectedProjectId,
  onNavigateToProject,
  children,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode: propOnToggleDarkMode,
  isNewProjectOpen: propIsNewProjectOpen,
  onOpenNewProject: propOnOpenNewProject,
  onCloseNewProject: propOnCloseNewProject,
}) => {
  const { user } = useAuth();
  const [internalDarkMode, setInternalDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pv_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : internalDarkMode;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [internalNewProjectOpen, setInternalNewProjectOpen] = useState(false);
  const isNewProjectOpen = propIsNewProjectOpen !== undefined ? propIsNewProjectOpen : internalNewProjectOpen;

  const handleOpenNewProject = () => {
    if (propOnOpenNewProject) propOnOpenNewProject();
    else setInternalNewProjectOpen(true);
  };

  const handleCloseNewProject = () => {
    if (propOnCloseNewProject) propOnCloseNewProject();
    else setInternalNewProjectOpen(false);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Sync theme with document.documentElement and body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('pv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('pv_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const update = () => {
      setUnreadCount(dataService.getNotifications(user).filter(n => !n.read).length);
      setInboxCount(dataService.getInboxItems(user).length);
      setTrashCount(dataService.getTrashItems(user).length);
      if (user) {
        const conns = dataService.getConnections(user);
        setPendingRequestsCount(conns.filter(c => c.status === 'pending' && (c.recipient_id === user.id || (c.recipient_email && c.recipient_email.toLowerCase() === user.email.toLowerCase()))).length);
      } else {
        setPendingRequestsCount(0);
      }
    };
    update();
    return dataService.subscribe(update);
  }, [user]);

  // Periodic deadline evaluator for 24h, 12h, and 1h alerts
  useEffect(() => {
    if (!user) return;
    deadlineService.checkAndDispatchDeadlines(user);
    const interval = setInterval(() => {
      deadlineService.checkAndDispatchDeadlines(user);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Global Keyboard shortcuts: Ctrl+K for search, I for inbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (
        e.key.toLowerCase() === 'i' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        setIsInboxOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleDarkMode = (val?: boolean) => {
    if (propOnToggleDarkMode) {
      propOnToggleDarkMode(val);
    } else {
      setInternalDarkMode(prev => typeof val === 'boolean' ? val : !prev);
    }
  };

  const handleCreatedProject = (project: Project) => {
    onNavigateToProject(project.id);
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-textPrimary flex transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        selectedProjectId={selectedProjectId}
        trashCount={trashCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:pl-64 transition-all">
        {/* Top Navbar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenNewProject={handleOpenNewProject}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNetwork={() => setIsNetworkOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          unreadCount={unreadCount}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Floating Quick Capture Button in bottom right corner */}
      <button
        onClick={() => setIsInboxOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#00E575] hover:bg-[#00D069] text-[#042B16] font-bold shadow-[0_0_20px_rgba(0,229,117,0.45)] hover:shadow-[0_0_25px_rgba(0,229,117,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#00C966]/40"
        title="Quick Capture (Shortcut: I)"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">Quick Capture</span>
        {inboxCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#042B16] text-[#00E575] text-[10px] flex items-center justify-center font-black">
            {inboxCount}
          </span>
        )}
      </button>

      {/* Command Search Modal (Ctrl+K) */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab, projectId) => {
          if (projectId) onNavigateToProject(projectId);
          else onSelectTab(tab);
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenNetwork={() => setIsNetworkOpen(true)}
      />

      {/* Floating Inbox Overlay Modal */}
      <FloatingInbox
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onNavigateToProject={(id) => onNavigateToProject(id)}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={handleCloseNewProject}
        onProjectCreated={handleCreatedProject}
        onOpenNetwork={() => setIsNetworkOpen(true)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenNetwork={() => setIsNetworkOpen(true)}
      />

      {/* Network & Colleagues Modal */}
      <NetworkModal
        isOpen={isNetworkOpen}
        onClose={() => setIsNetworkOpen(false)}
      />
    </div>
  );
};
