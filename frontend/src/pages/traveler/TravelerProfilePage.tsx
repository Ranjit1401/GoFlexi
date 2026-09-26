import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Sliders,
  Edit3,
  CheckCircle2,
  Compass,
  Heart,
  Plane,
  Clock,
  Sparkles
} from 'lucide-react';

export const TravelerProfilePage: React.FC = () => {
  const { user, preferences, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [name, setName] = useState(user?.name || 'Rahul Sharma');
  const [location, setLocation] = useState(user?.location || 'Mumbai, India');
  const [bio, setBio] = useState(user?.bio || 'Passionate about exploring coastal escapes and alpine trails.');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, location, bio });
    setEditProfileModalOpen(false);
    showToast('success', 'Profile details updated successfully');
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
          Traveler Account
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Traveler Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and custom dynamic travel preferences.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <Avatar
              name={user?.name || 'Traveler'}
              src={user?.avatarUrl}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">{user?.name || 'Rahul Sharma'}</h2>
                <Badge variant="accent" size="sm">Verified Traveler</Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email || 'rahul.sharma@example.com'}</span>
                <span className="text-slate-300">•</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>{user?.location || 'Mumbai, India'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditProfileModalOpen(true)}
              icon={<Edit3 className="w-3.5 h-3.5" />}
              className="rounded-xl"
            >
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/user/onboarding')}
              icon={<Sliders className="w-3.5 h-3.5" />}
              className="rounded-xl bg-navy-900"
            >
              <span>Edit Travel Preferences</span>
            </Button>
          </div>
        </div>

        <div className="py-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
            "{user?.bio || 'Passionate explorer always ready for spontaneous journeys, boutique stays, and coastal sunsets.'}"
          </p>
        </div>
      </Card>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Style & Budget */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Style & Budget Range</span>
            </div>
            <button
              onClick={() => navigate('/user/onboarding')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Travel Style
              </span>
              <span className="text-sm font-bold text-navy-950">
                {preferences?.travelStyle || 'Balanced'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Budget Tier
              </span>
              <span className="text-sm font-bold text-navy-950">
                {preferences?.budgetRange || '₹25,000 – ₹50,000'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Companions
              </span>
              <span className="text-sm font-bold text-navy-950">
                {preferences?.companions || 'Couple'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Itinerary Pacing
              </span>
              <span className="text-sm font-bold text-navy-950">
                {preferences?.pacing || 'Balanced'}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Preferred Transportation */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
              <Plane className="w-4 h-4 text-emerald-500" />
              <span>Preferred Transportation</span>
            </div>
            <button
              onClick={() => navigate('/user/onboarding')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {preferences?.transportation?.map((t) => (
              <Badge key={t} variant="success" className="px-3 py-1.5 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {t}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Voyara prioritizes flight connections and private chauffeured cabs based on these selections.
          </p>
        </Card>

        {/* Card 3: Attraction Landscapes */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
              <Compass className="w-4 h-4 text-brand-500" />
              <span>Favorite Landscapes</span>
            </div>
            <button
              onClick={() => navigate('/user/onboarding')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {preferences?.attractions?.map((attr) => (
              <Badge key={attr} variant="primary" className="px-3 py-1 text-xs">
                {attr}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Card 4: Curated Experiences */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Interests & Experiences</span>
            </div>
            <button
              onClick={() => navigate('/user/onboarding')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {preferences?.experiences?.map((exp) => (
              <Badge key={exp} variant="neutral" className="px-3 py-1 text-xs bg-slate-100 text-slate-800">
                {exp}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title="Edit Profile Information"
        subtitle="Update your name, city, and explorer bio."
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Explorer Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditProfileModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
