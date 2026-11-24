import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import TextInput from '../../components/forms/TextInput';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, switchRole } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@smartassetcare.demo');
  const [password, setPassword] = useState('Demo123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'ADMIN',
      name: 'Dr. Ramesh Sharma',
      email: 'admin@smartassetcare.demo',
      desc: 'Institutional Admin • Full System Oversight'
    },
    {
      role: 'MANAGER',
      name: 'Vikram Malhotra',
      email: 'manager@smartassetcare.demo',
      desc: 'Facility Manager • Schedules & Dispatches'
    },
    {
      role: 'TECHNICIAN',
      name: 'Rajesh Kumar',
      email: 'technician@smartassetcare.demo',
      desc: 'Field Technician • Kanban Execution'
    },
    {
      role: 'STAFF',
      name: 'Prof. Anita Deshmukh',
      email: 'staff@smartassetcare.demo',
      desc: 'Faculty / Staff • Issue Reporting'
    },
  ];

  const handleQuickLogin = (roleName) => {
    setIsLoading(true);
    setError('');
    const switched = switchRole(roleName);
    if (switched) {
      showToast({
        type: 'success',
        title: 'Logged In as ' + roleName,
        message: `Welcome, ${switched.name}. Entering role-specific workspace.`
      });
      navigate('/app/dashboard');
    } else {
      const msg = `This ${roleName} account has been deactivated by the system administrator. Access is disabled.`;
      setError(msg);
      showToast({
        type: 'error',
        title: 'Account Deactivated',
        message: msg
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = login(email, password);

    if (!res.success) {
      setError(res.error);
      setIsLoading(false);
      return;
    }

    showToast({
      type: 'success',
      title: 'Authenticated Successfully',
      message: `Welcome, ${res.user.name}. Opening ${res.user.role} Dashboard.`
    });

    navigate('/app/dashboard');
    setIsLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-xs font-mono text-accent-primary mb-3 shadow-glow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AUTHENTICATION TERMINAL</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            Smart AssetCare Access
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            SELECT A ROLE TO PREVIEW TAILORED WORKFLOWS
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-bg-card border border-industrial-borderHover rounded-3xl p-6 sm:p-8 shadow-card-dark relative overflow-hidden">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-status-critical/15 border border-status-critical/30 text-status-critical text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Demo Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              icon={Mail}
              placeholder="e.g. admin@smartassetcare.demo"
              required
            />

            <TextInput
              label="Demo Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              icon={Lock}
              placeholder="Demo123!"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-industrial-border bg-bg-elevated text-accent-primary focus:ring-accent-primary/30"
                />
                <span>Remember session</span>
              </label>

              <span className="font-mono text-text-muted text-[11px]">
                PW: Demo123!
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              isLoading={isLoading}
              className="w-full justify-center mt-3"
            >
              Sign In to Command Center
            </Button>
          </form>

          {/* Quick One-Click Demo Role Selector (PART 7) */}
          <div className="mt-6 pt-6 border-t border-industrial-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[10px] font-mono text-accent-primary">
                1-CLICK ROLES
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.role)}
                  className="p-3 rounded-xl border border-industrial-border bg-bg-elevated/70 text-left hover:border-accent-primary/50 hover:bg-bg-elevated hover:shadow-glow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-accent-primary">
                      {acc.role}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {acc.name}
                  </p>
                  <span className="text-[10px] text-text-muted block truncate mt-0.5 font-sans">
                    {acc.desc.split('•')[1] || acc.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer */}
        <p className="text-[11px] font-mono text-text-muted text-center mt-6 leading-relaxed">
          🔒 Demonstration Prototype: Local browser simulation. No server-side authentication required.
        </p>
      </div>
    </div>
  );
}
