import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, Shield, Zap, 
  Users, Inbox, Snowflake, Github, Twitter, Linkedin, 
  Mail, Menu, X, Sun, Moon, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface LandingPageProps {
  onStartNow: () => void;
  onSignIn: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: (val?: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartNow,
  onSignIn,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'contact' | 'socials'>('home');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const scrollToSection = (id: string, section: 'home' | 'about' | 'contact' | 'socials') => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim()) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-vault-bg text-vault-textPrimary flex flex-col selection:bg-[#00E575]/30 transition-colors">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-vault-bg/85 backdrop-blur-md border-b border-vault-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => scrollToSection('hero', 'home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <img
              src="/logo.png"
              alt="Slow Spider"
              className="w-7 h-7 object-contain logo-stroke-outline shrink-0"
            />
            <span className="font-bold text-sm tracking-tight text-vault-textPrimary">
              SLOW SPIDER
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-vault-textSecondary">
            <button
              onClick={() => scrollToSection('hero', 'home')}
              className={`hover:text-[#00C966] dark:hover:text-[#00E575] transition-colors cursor-pointer ${
                activeSection === 'home' ? 'text-vault-textPrimary font-bold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about', 'about')}
              className={`hover:text-[#00C966] dark:hover:text-[#00E575] transition-colors cursor-pointer ${
                activeSection === 'about' ? 'text-vault-textPrimary font-bold' : ''
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection('contact', 'contact')}
              className={`hover:text-[#00C966] dark:hover:text-[#00E575] transition-colors cursor-pointer ${
                activeSection === 'contact' ? 'text-vault-textPrimary font-bold' : ''
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => scrollToSection('socials', 'socials')}
              className={`hover:text-[#00C966] dark:hover:text-[#00E575] transition-colors cursor-pointer ${
                activeSection === 'socials' ? 'text-vault-textPrimary font-bold' : ''
              }`}
            >
              Socials
            </button>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onToggleDarkMode()}
              className="p-2 rounded-xl text-vault-textMuted hover:text-vault-textPrimary hover:bg-vault-cardHover transition-colors cursor-pointer border border-vault-border"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={onSignIn}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-vault-textSecondary hover:text-vault-textPrimary hover:bg-vault-cardHover border border-vault-border transition-all cursor-pointer"
            >
              Sign In
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={onStartNow}
              className="font-bold text-xs"
            >
              <span>Start Now</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onToggleDarkMode()}
              className="p-2 rounded-xl text-vault-textMuted border border-vault-border"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-vault-textMuted hover:text-vault-textPrimary border border-vault-border cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-vault-border bg-vault-card p-4 space-y-3 animate-slide-up">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => scrollToSection('hero', 'home')}
                className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-vault-textSecondary hover:bg-vault-cardHover"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about', 'about')}
                className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-vault-textSecondary hover:bg-vault-cardHover"
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('contact', 'contact')}
                className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-vault-textSecondary hover:bg-vault-cardHover"
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection('socials', 'socials')}
                className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-vault-textSecondary hover:bg-vault-cardHover"
              >
                Socials
              </button>
            </nav>
            <div className="pt-3 border-t border-vault-border flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={onSignIn} className="w-full justify-center">
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={onStartNow} className="w-full justify-center font-bold">
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section id="hero" className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vault-card border border-vault-border text-vault-textSecondary text-xs font-semibold shadow-xs mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00E575]" />
            <span>Slow Spider • Project & Milestone Workspace</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-vault-textPrimary tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Organize your work. <br className="hidden sm:inline" />
            <span className="text-vault-textPrimary">Track every milestone.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-vault-textMuted max-w-2xl mx-auto leading-relaxed">
            A clutter-free workspace designed for high-velocity teams and creators. Plan milestones with mathematical accuracy, collaborate in private networks, and capture ideas in seconds.
          </p>

          {/* Center Call To Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onStartNow}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00E575] hover:bg-[#00D069] text-[#042B16] font-bold text-sm shadow-[0_0_20px_rgba(0,229,117,0.35)] hover:shadow-[0_0_25px_rgba(0,229,117,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Now — It's Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-vault-card hover:bg-vault-cardHover text-vault-textSecondary hover:text-vault-textPrimary font-semibold text-sm border border-vault-border transition-all cursor-pointer"
            >
              Sign In to Workspace
            </button>
          </div>

          {/* Clean Interactive Mockup Window */}
          <div className="mt-14 sm:mt-18 rounded-2xl bg-vault-card border border-vault-border p-3 sm:p-5 shadow-2xl text-left max-w-4xl mx-auto">
            {/* Window header */}
            <div className="flex items-center justify-between pb-3 border-b border-vault-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                <span className="text-[11px] font-mono text-vault-textMuted ml-2">app.slowspider.com/workspace</span>
              </div>
              <Badge variant="green" dot>
                Live Workspace
              </Badge>
            </div>

            {/* Mockup content grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Project Card Mockup */}
              <div className="p-4 rounded-xl bg-vault-surface border border-vault-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[#045E33] dark:text-[#00E575] font-bold">PRODUCT LAUNCH</span>
                    <Badge variant="green">Active</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-vault-textPrimary">Slow Spider 2.0 Web Platform</h4>
                  <p className="text-[11px] text-vault-textMuted mt-1">Core milestone delivery & security</p>
                </div>
                <div className="mt-4 pt-3 border-t border-vault-border">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-vault-textMuted">Progress</span>
                    <span className="font-bold text-[#045E33] dark:text-[#00E575]">83%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-vault-border overflow-hidden">
                    <div className="h-full bg-[#00E575] rounded-full" style={{ width: '83%' }} />
                  </div>
                </div>
              </div>

              {/* Task Checklist Mockup */}
              <div className="p-4 rounded-xl bg-vault-surface border border-vault-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vault-textMuted">Tasks & Milestones</span>
                  <span className="text-[10px] font-mono text-vault-textMuted">5/6 Done</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-vault-textPrimary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575]" />
                    <span className="line-through text-vault-textMuted text-[11px]">Multi-tenant RLS Policies</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vault-textPrimary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575]" />
                    <span className="line-through text-vault-textMuted text-[11px]">WebCrypto Salted Hashing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-vault-textPrimary font-semibold">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#00E575]" />
                    <span className="text-[11px]">Deploy Global Edge Nodes</span>
                  </div>
                </div>
              </div>

              {/* Floating Quick-Capture Mockup */}
              <div className="p-4 rounded-xl bg-vault-surface border border-vault-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-vault-textPrimary">
                      <Inbox className="w-3.5 h-3.5 text-[#00E575]" />
                      <span>Floating Inbox</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-vault-card border border-vault-border text-[9px] font-mono text-vault-textMuted">I</kbd>
                  </div>
                  <p className="text-[11px] text-vault-textMuted">Quick capture space for raw thoughts, tasks, and ideas.</p>
                </div>
                <div className="mt-3 p-2 rounded-lg bg-vault-card border border-vault-border text-[10px] text-vault-textSecondary font-mono">
                  "Draft API integration spec for mobile app..."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT US SECTION */}
        <section id="about" className="py-16 sm:py-20 border-t border-vault-border bg-vault-card/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#045E33] dark:text-[#00E575]">About Us</span>
              <h2 className="text-2xl sm:text-3xl font-black text-vault-textPrimary tracking-tight mt-2">
                Built to end clutter and chaotic workflows.
              </h2>
              <p className="text-xs sm:text-sm text-vault-textMuted mt-3 leading-relaxed">
                Most project tools are bloated with confusing settings and endless noise. Slow Spider was engineered from first principles with four core pillars of precision:
              </p>
            </div>

            {/* 4 Clean Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-vault-card border border-vault-border space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575]">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-vault-textPrimary">Deterministic Milestone Math</h3>
                <p className="text-xs text-vault-textMuted leading-relaxed">
                  Project progress is strictly derived from completed milestone outcomes. No arbitrary sliders or subjective percentage guesswork.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-vault-card border border-vault-border space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575]">
                  <Snowflake className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-vault-textPrimary">60-Day Cold Store Auto-Archival</h3>
                <p className="text-xs text-vault-textMuted leading-relaxed">
                  Inactive projects freeze automatically to keep your day-to-day dashboard ultra-lean and focused, while remaining 100% recoverable at any time.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-vault-card border border-vault-border space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-vault-textPrimary">Private Mutual Network</h3>
                <p className="text-xs text-vault-textMuted leading-relaxed">
                  Zero public directory enumeration. You can only collaborate with team members and colleagues who accept your connection request.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-vault-card border border-vault-border space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575]">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-vault-textPrimary">Cryptographic Security & RLS</h3>
                <p className="text-xs text-vault-textMuted leading-relaxed">
                  Hardened with multi-tenant PostgreSQL Row-Level Security, WebCrypto SHA-256 password hashing, and zero third-party tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-16 sm:py-20 border-t border-vault-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#045E33] dark:text-[#00E575]">Contact</span>
              <h2 className="text-2xl sm:text-3xl font-black text-vault-textPrimary tracking-tight mt-2">
                We'd love to hear from you.
              </h2>
              <p className="text-xs sm:text-sm text-vault-textMuted mt-2">
                Have a question, feedback, or need enterprise support? Send us a message directly.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-vault-card border border-vault-border shadow-sm">
              {contactSubmitted ? (
                <div className="p-6 text-center space-y-2 bg-[#00E575]/10 border border-[#00E575]/30 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-[#00E575] mx-auto" />
                  <h4 className="text-sm font-bold text-vault-textPrimary">Message Sent!</h4>
                  <p className="text-xs text-vault-textMuted">Thanks for reaching out. Our team will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-vault-textSecondary mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="How can we help?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full bg-vault-cardHover border border-vault-border rounded-xl px-3.5 py-2.5 text-xs text-vault-textPrimary placeholder-vault-textMuted focus:outline-none focus:border-[#00E575] transition-colors resize-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="sm" className="w-full py-2.5 font-bold">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    <span>Send Message</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* SOCIALS & COMMUNITY SECTION */}
        <section id="socials" className="py-16 sm:py-20 border-t border-vault-border bg-vault-card/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#045E33] dark:text-[#00E575]">Socials & Community</span>
            <h2 className="text-2xl sm:text-3xl font-black text-vault-textPrimary tracking-tight mt-2">
              Join the Slow Spider Community
            </h2>
            <p className="text-xs sm:text-sm text-vault-textMuted mt-2 max-w-md mx-auto">
              Follow our engineering updates, contribute to the open codebase, or connect with our team.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <a
                href="https://github.com/Kushagra110504/Slow-Spider"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-vault-card border border-vault-border hover:border-vault-borderLight flex items-center justify-center gap-2.5 text-xs font-bold text-vault-textPrimary transition-all group"
              >
                <Github className="w-4 h-4 text-vault-textMuted group-hover:text-vault-textPrimary transition-colors" />
                <span>GitHub Repo</span>
                <ExternalLink className="w-3 h-3 text-vault-textMuted ml-auto" />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-vault-card border border-vault-border hover:border-vault-borderLight flex items-center justify-center gap-2.5 text-xs font-bold text-vault-textPrimary transition-all group"
              >
                <Twitter className="w-4 h-4 text-vault-textMuted group-hover:text-[#06B6D4] transition-colors" />
                <span>Twitter / X</span>
                <ExternalLink className="w-3 h-3 text-vault-textMuted ml-auto" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-vault-card border border-vault-border hover:border-vault-borderLight flex items-center justify-center gap-2.5 text-xs font-bold text-vault-textPrimary transition-all group"
              >
                <Linkedin className="w-4 h-4 text-vault-textMuted group-hover:text-[#00E575] transition-colors" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-vault-textMuted ml-auto" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-vault-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vault-textMuted">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Slow Spider"
              className="w-5 h-5 object-contain logo-stroke-outline"
            />
            <span className="font-bold text-vault-textPrimary">SLOW SPIDER</span>
            <span>• © 2026 Slow Spider Inc.</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => scrollToSection('hero', 'home')} className="hover:text-vault-textPrimary">Home</button>
            <button onClick={() => scrollToSection('about', 'about')} className="hover:text-vault-textPrimary">About Us</button>
            <button onClick={() => scrollToSection('contact', 'contact')} className="hover:text-vault-textPrimary">Contact</button>
            <button onClick={() => scrollToSection('socials', 'socials')} className="hover:text-vault-textPrimary">Socials</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
