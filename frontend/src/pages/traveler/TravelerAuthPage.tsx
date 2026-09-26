import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

export const TravelerAuthPage: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { loginTraveler, registerTraveler } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const regRes = await registerTraveler(fullName.trim(), email.trim(), password);
      if (!regRes.success) {
        showToast('error', regRes.error || 'Registration failed. Please try again.');
        return;
      }
      showToast('success', 'Traveler account created successfully!', 'Welcome to GoFlexi');
      const loginRes = await loginTraveler(email.trim(), password);
      if (loginRes.success) {
        // A freshly registered traveler has no saved profile yet, so the
        // backend-validated session reports onboarding as incomplete.
        navigate('/user/onboarding');
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
      const res = await loginTraveler(email.trim(), password);
      if (!res.success) {
        showToast('error', res.error || 'Login failed. Please try again.');
        return;
      }
      showToast('success', 'Logged in as Traveler', 'Welcome back');
      // Use the onboarding status returned by the backend-validated session,
      // not the stale closure value captured before the login state update.
      if (res.onboardingCompleted) {
        navigate('/user/dashboard');
      } else {
        navigate('/user/onboarding');
      }
    } catch {
      showToast('error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={tab === 'login' ? 'Welcome Back, Traveler' : 'Join GoFlexi as a Traveler'}
      subtitle={
        tab === 'login'
          ? 'Log in to view your tailored itineraries, upcoming bookings, and saved routes.'
          : 'Set up your traveler profile to start curating personalized, adaptive journeys.'
      }
      image="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80"
      imageQuote="GoFlexi understood my relaxed pacing preference and generated the dreamiest Goa getaway. When rain struck, it adapted our afternoon effortlessly!"
      imageAuthor="Rahul Sharma"
      roleBadge="Traveler Portal"
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
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
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
            Login as Traveler
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setTab('register')}
              className="font-bold text-brand-600 hover:underline"
            >
              Create one now
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Rahul Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            icon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="rahul.sharma@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
          />

          <Input
            label="Confirm Password"
            type="password"
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
            Create Traveler Account
          </Button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setTab('login')}
              className="font-bold text-brand-600 hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};
