import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ColdStorePage } from './pages/ColdStorePage';
import { TrashPage } from './pages/TrashPage';

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [publicView, setPublicView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pv_theme');
    return saved !== null ? saved === 'dark' : true;
  });

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

  const handleToggleDarkMode = (val?: boolean) => {
    setIsDarkMode(prev => typeof val === 'boolean' ? val : !prev);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vault-bg flex items-center justify-center text-vault-textMuted text-xs">
        <div className="w-6 h-6 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (publicView === 'auth') {
      return (
        <AuthPage
          initialMode={authMode}
          onBackToHome={() => setPublicView('landing')}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      );
    }
    return (
      <LandingPage
        onStartNow={() => {
          setAuthMode('signup');
          setPublicView('auth');
        }}
        onSignIn={() => {
          setAuthMode('signin');
          setPublicView('auth');
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    );
  }

  const handleNavigate = (tab: NavTab, projectId?: string) => {
    if (projectId) {
      setSelectedProjectId(projectId);
      setCurrentTab('project-details');
    } else {
      setCurrentTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tab) => handleNavigate(tab)}
      selectedProjectId={selectedProjectId}
      onNavigateToProject={handleNavigateToProject}
      isDarkMode={isDarkMode}
      onToggleDarkMode={handleToggleDarkMode}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage onNavigate={handleNavigate} />
      )}

      {currentTab === 'projects' && (
        <ProjectsPage
          onNavigate={handleNavigate}
          onOpenNewProject={() => {
            const btn = document.querySelector('button[title*="New Project"]') as HTMLButtonElement | null;
            if (btn) btn.click();
          }}
        />
      )}

      {currentTab === 'project-details' && (
        <ProjectDetailsPage
          projectId={selectedProjectId}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'calendar' && <CalendarPage />}

      {currentTab === 'cold-store' && (
        <ColdStorePage onNavigate={handleNavigate} />
      )}

      {currentTab === 'trash' && <TrashPage />}
    </AppLayout>
  );
}

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Hidden Master Admin Portal Route: /vault-admin
  if (currentPath === '/vault-admin' || currentPath === '/vault-admin/') {
    return <AdminPortalPage />;
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
