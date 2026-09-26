import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  User,
  Bell,
  Palette,
  Shield,
  CheckCircle2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export const AgentSettingsPage: React.FC = () => {
  const { agent, updateAgentProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'agency' | 'profile' | 'notifications' | 'appearance'>('agency');

  // Form states
  const [agencyName, setAgencyName] = useState(agent?.agencyName || 'Voyage Luxe Expeditions');
  const [license, setLicense] = useState(agent?.licenseNumber || 'TA-IN-2024-8842');
  const [location, setLocation] = useState(agent?.location || 'New Delhi & Mumbai, India');

  const [name, setName] = useState(agent?.name || 'Alex Vance');
  const [email, setEmail] = useState(agent?.email || '');
  const [phone, setPhone] = useState(agent?.phone || '+91 98101 22900');

  // Notification toggles
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifDisruptions, setNotifDisruptions] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Appearance
  const [compactDensity, setCompactDensity] = useState(false);

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgentProfile({ agencyName, licenseNumber: license, location });
    showToast('success', 'Agency details updated successfully');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgentProfile({ name, email, phone });
    showToast('success', 'Agent profile updated successfully');
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
          Agency Administration
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Operator Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure agency information, personal operator credentials, alerts, and workspace themes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {[
          { id: 'agency', label: 'Agency Information', icon: Building2 },
          { id: 'profile', label: 'Agent Profile', icon: User },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell },
          { id: 'appearance', label: 'Appearance', icon: Palette }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-navy-950 text-navy-950 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AGENCY INFORMATION */}
      {activeTab === 'agency' && (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSaveAgency} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-navy-950">Agency Information</h3>
                <p className="text-xs text-slate-500">Official business profile displayed on traveler itineraries</p>
              </div>
              <Badge variant="warning">Operator License Active</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Agency Name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
              <Input
                label="Govt. License / Registration #"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              />
            </div>

            <Input
              label="Headquarters / Operations Office"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
            />

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                Verified Tour Operator Status
              </span>
              <p>Your agency profile is accredited for domestic and international tour coordination.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" className="rounded-xl bg-navy-900">
                Save Agency Info
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: AGENT PROFILE */}
      {activeTab === 'profile' && (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <Avatar name={name} src={agent?.avatarUrl} size="lg" />
              <div>
                <h3 className="text-base font-bold text-navy-950">{name}</h3>
                <p className="text-xs text-slate-500">Master Operations Coordinator</p>
              </div>
            </div>

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Direct Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Emergency Contact Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" className="rounded-xl bg-navy-900">
                Update Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: NOTIFICATION PREFERENCES */}
      {activeTab === 'notifications' && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy-950">Notification Preferences</h3>
            <p className="text-xs text-slate-500">Configure how you receive critical operational pings.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Instant Booking Confirmations</h4>
                <p className="text-[11px] text-slate-500">Receive alerts whenever a traveler books or updates an itinerary.</p>
              </div>
              <input
                type="checkbox"
                checked={notifBookings}
                onChange={(e) => {
                  setNotifBookings(e.target.checked);
                  showToast('info', 'Preference updated');
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-World Disruption & Weather Alerts</h4>
                <p className="text-[11px] text-slate-500">Urgent notifications when flight delays or tidal swells trigger alternative routing.</p>
              </div>
              <input
                type="checkbox"
                checked={notifDisruptions}
                onChange={(e) => {
                  setNotifDisruptions(e.target.checked);
                  showToast('info', 'Preference updated');
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Product Updates & Agency News</h4>
                <p className="text-[11px] text-slate-500">Quarterly features and partner network expansions.</p>
              </div>
              <input
                type="checkbox"
                checked={notifMarketing}
                onChange={(e) => {
                  setNotifMarketing(e.target.checked);
                  showToast('info', 'Preference updated');
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: APPEARANCE */}
      {activeTab === 'appearance' && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy-950">Workspace Appearance</h3>
            <p className="text-xs text-slate-500">Customize the command center interface layout density.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                setCompactDensity(false);
                showToast('info', 'Standard spacious layout selected');
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                !compactDensity
                  ? 'border-navy-950 bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-950">Spacious & Elegant (Default)</span>
                {!compactDensity && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">Generous padding, clean cards, and high readability.</p>
            </div>

            <div
              onClick={() => {
                setCompactDensity(true);
                showToast('info', 'High density layout selected');
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                compactDensity
                  ? 'border-navy-950 bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-950">Compact Operations Grid</span>
                {compactDensity && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500">Higher data density for busy operations desks.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
