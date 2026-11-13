import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ArrowRight, Activity, Terminal } from 'lucide-react';
import Button from '../common/Button';

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Demo Guide', path: '/demo' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-bg-primary/85 backdrop-blur-md border-b border-industrial-border shadow-card-dark py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/30 flex items-center justify-center transition-all duration-300 group-hover:border-accent-primary group-hover:shadow-glow-sm">
              <Activity className="w-5 h-5 text-accent-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-primary rounded-full animate-ping-subtle" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-text-primary group-hover:text-accent-primary transition-colors">
                  SMART ASSETCARE
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              </div>
              <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">
                Predictive Maintenance Command
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full bg-bg-card/70 border border-industrial-border backdrop-blur-md">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 relative ${
                    active
                      ? 'text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                  }`}
                >
                  {link.name}
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 bg-accent-primary/10 rounded-full border border-accent-primary/30 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-text-secondary hover:text-text-primary"
            >
              Sign In
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => navigate('/login')}
            >
              Launch Demo
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-bg-card border border-industrial-border text-text-secondary hover:text-text-primary focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-industrial-border bg-bg-card/95 backdrop-blur-xl px-4 pt-3 pb-6"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-industrial-border flex flex-col gap-2.5 mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full justify-center"
                >
                  Sign In
                </Button>
                
                <Button
                  variant="primary"
                  iconRight={ArrowRight}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full justify-center"
                >
                  Launch Demo
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
