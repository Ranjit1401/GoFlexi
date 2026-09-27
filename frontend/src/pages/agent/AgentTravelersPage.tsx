import React, { useState, useEffect, useCallback } from 'react';
import { getAgentTravelers, createAgentTraveler } from '../../services/agent-travelers';
import { TravelerRecord } from '../../types/agent';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AgentTravelersPage: React.FC = () => {
  const { showToast } = useToast();
  const [travelers, setTravelers] = useState<TravelerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Traveler form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPreferredDest, setNewPreferredDest] = useState('Goa');

  const fetchTravelers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAgentTravelers(
        statusFilter !== 'All' ? statusFilter : undefined,
        searchQuery.trim() || undefined
      );
      setTravelers(data);
    } catch (err) {
      console.error('Failed to load agency travelers:', err);
      setErrorMessage('Unable to load client roster. Please verify connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTravelers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTravelers]);

  const handleAddTraveler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('error', 'Please provide a traveler name and email.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createAgentTraveler({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || '+91 98000 00000',
        preferred_destination: newPreferredDest,
      });

      setTravelers((prev) => [created, ...prev]);
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      showToast('success', `${created.name} added to your travelers directory!`, 'Traveler Added');
    } catch (err) {
      console.error('Failed to add traveler:', err);
      showToast('error', 'Failed to add traveler. Please try again.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Traveler CRM & Roster
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Travelers Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your client accounts, active tour members, and new travel leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTravelers}
            className="rounded-xl"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            <span>Add Traveler</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchTravelers}>
            Retry
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {(['All', 'Active', 'Lead', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Content */}
      {isLoading && travelers.length === 0 ? (
        <LoadingState message="Loading client directory..." />
      ) : travelers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7 text-brand-500" />}
          title={searchQuery ? 'No travelers found' : 'No travelers in roster'}
          description={
            searchQuery
              ? `No client matched "${searchQuery}". Try a different search term or clear filters.`
              : 'Add new client leads or manage travelers who book holiday packages with your agency.'
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setAddModalOpen(true);
              }}
            >
              Add New Traveler
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Trips</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {travelers.map((t) => {
                  let statusBadge = <Badge variant="success">Active</Badge>;
                  if (t.status === 'Lead') statusBadge = <Badge variant="warning">Lead</Badge>;
                  if (t.status === 'Completed') statusBadge = <Badge variant="neutral">Completed</Badge>;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={t.name} src={t.avatarUrl} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-[11px] text-slate-400">{t.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">
                        {t.email}
                      </td>
                      <td className="px-6 py-4 font-bold text-navy-950">
                        {t.tripsCount}
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {t.lastActivity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => showToast('info', `Traveler dossier: ${t.name} (${t.email})`)}
                          className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Traveler Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Traveler"
        subtitle="Create a new client lead in your operations database."
        maxWidth="md"
      >
        <form onSubmit={handleAddTraveler} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Vikram Singhania"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="vikram@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98200 12345"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Destination
            </label>
            <select
              value={newPreferredDest}
              onChange={(e) => setNewPreferredDest(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-800"
            >
              {['Goa', 'Manali', 'Kerala', 'Meghalaya', 'Rajasthan', 'Andaman', 'Kashmir'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl"
              isLoading={isSubmitting}
            >
              Add Traveler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
