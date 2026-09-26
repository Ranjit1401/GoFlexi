import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, User as UserIcon, Building2 } from 'lucide-react';

export const AgentAuthPage: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { loginAgent, registerAgent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!agencyName.trim()) newErrors.agencyName = 'Agency Name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid agency email is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const regRes = await registerAgent(fullName.trim(), agencyName.trim(), email.trim(), password);
      if (!regRes.success) {
        showToast('error', regRes.error || 'Registration failed. Please try again.');
        return;
      }
      showToast('success', 'Tour Agent profile created successfully!', 'Welcome to Operations');
      const loginRes = await loginAgent(email.trim(), password);
      if (loginRes.success) {
        navigate('/agent/dashboard');
      } else {
        setTab('login');
      }
    } catch {
      showToast('error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await loginAgent(email.trim(), password);
      if (!res.success) {
        showToast('error', res.error || 'Login failed. Please try again.');
        return;
      }
      showToast('success', 'Logged in as Tour Agent', 'Welcome back, Operator');
      navigate('/agent/dashboard');
    } catch {
      showToast('error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={tab === 'login' ? 'Agent Operations Console' : 'Partner with GoFlexi'}
      subtitle={
        tab === 'login'
          ? 'Access your tour roster, active departures, bookings ledger, and vendor relations.'
          : 'Register your travel agency to access real-time dispatch and traveler management tools.'
      }
      image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
      imageQuote="Managing 24 concurrent tour departures used to mean endless spreadsheets. GoFlexi brought all schedules, conflicts, and traveler requests into one clean cockpit."
      imageAuthor="Alex Vance (Voyage Luxe)"
      roleBadge="Tour Operator Command"
    >
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setErrors({});
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'login' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('register');
            setErrors({});
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'register' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Register
        </button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Agency / Agent Email"
            type="email"
            placeholder="agent@agency.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password" autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center rounded-xl bg-navy-900 hover:bg-navy-800"
          >
            Login as Agent
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            New agency partner?{' '}
            <button
              type="button"
              onClick={() => setTab('register')}
              className="font-bold text-amber-600 hover:underline"
            >
              Register your agency
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Vance"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            icon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            label="Agency Name"
            type="text"
            placeholder="Voyage Luxe Expeditions"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            error={errors.agencyName}
            icon={<Building2 className="w-4 h-4" />}
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="alex.vance@voyageluxe.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password" autoComplete="current-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
          />

          <Input
            label="Confirm Password"
            type="password" autoComplete="current-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            icon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center rounded-xl bg-navy-900 hover:bg-navy-800"
          >
            Create Agent Account
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an agent account?{' '}
            <button
              type="button"
              onClick={() => setTab('login')}
              className="font-bold text-amber-600 hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};
