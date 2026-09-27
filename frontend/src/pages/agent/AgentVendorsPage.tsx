import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getVendors, createVendor as apiCreateVendor } from '../../services/vendors';
import { Vendor } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Building,
  Car,
  Compass,
  Utensils,
  Star,
  MapPin,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const AgentVendorsPage: React.FC = () => {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New vendor form
  const [vName, setVName] = useState('');
  const [vCategory, setVCategory] = useState<Vendor['category']>('Hotels');
  const [vLocation, setVLocation] = useState('Goa');
  const [vContact, setVContact] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getVendors(categoryFilter, searchQuery);
      setVendors(data);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setErrorMessage('Unable to load vendor partners. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [vendors, categoryFilter, searchQuery]);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) {
      showToast('error', 'Vendor name is required.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiCreateVendor({
        name: vName.trim(),
        category: vCategory,
        location: vLocation || 'Goa',
        contactPerson: vContact || 'Operational Desk',
        phone: vPhone || '+91 98000 00000',
        email: vEmail || 'vendor@example.com',
        rating: 4.8,
        status: 'Verified Partner',
      });

      setVendors((prev) => [created, ...prev]);
      setAddModalOpen(false);
      setVName('');
      setVContact('');
      setVPhone('');
      setVEmail('');
      showToast('success', `${created.name} added to vendor network!`, 'Partner Registered');
    } catch (err) {
      console.error('Failed to create vendor:', err);
      showToast('error', 'Could not register vendor. Please try again.', 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: Vendor['category']) => {
    switch (cat) {
      case 'Hotels':
        return <Building className="w-4 h-4 text-brand-600" />;
      case 'Transport':
        return <Car className="w-4 h-4 text-purple-600" />;
      case 'Activities':
        return <Compass className="w-4 h-4 text-emerald-600" />;
      case 'Restaurants':
      default:
        return <Utensils className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Supplier & Hospitality Partners
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain contracts, direct reservations, and service SLAs with hotels, fleets, and guides.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          <span>Add Vendor</span>
        </Button>
      </div>

      {/* Categories & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Hotels', 'Transport', 'Activities', 'Restaurants'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search vendor name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState message="Loading verified suppliers and hospitality directory..." />
      ) : errorMessage ? (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Error loading vendors</h3>
          <p className="text-xs text-slate-600 mt-1 mb-5">{errorMessage}</p>
          <Button variant="primary" onClick={fetchVendors} className="rounded-xl inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          title={searchQuery || categoryFilter !== 'All' ? 'No matching vendors' : 'No partner vendors registered'}
          description={
            searchQuery || categoryFilter !== 'All'
              ? 'Try changing the category or clear your search keyword.'
              : 'Add your first hotel, transport, or activity partner to this roster.'
          }
          action={
            <Button variant="primary" onClick={() => setAddModalOpen(true)} className="rounded-xl">
              Add First Vendor
            </Button>
          }
        />
      ) : (
        /* Vendors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getCategoryIcon(vendor.category)}
                    </div>
                    <Badge variant="neutral" size="sm">{vendor.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy-950 group-hover:text-brand-600 transition-colors">
                  {vendor.name}
                </h3>

                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{vendor.location}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 font-semibold">Contact:</span>
                    <span className="font-semibold text-slate-800">{vendor.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 font-semibold">Phone:</span>
                    <span className="font-mono text-slate-700">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 truncate">
                    <span className="text-slate-400 font-semibold">Email:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[170px]">{vendor.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {vendor.status}
                </Badge>

                <button
                  onClick={() => showToast('info', `Connecting to ${vendor.name} booking desk...`, 'Direct Dispatch')}
                  className="text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  Direct Dispatch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Partner Vendor"
        subtitle="Add a new verified provider to your operational roster."
        maxWidth="md"
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <Input
            label="Vendor / Property Name"
            placeholder="e.g. Radisson Blu Resort"
            value={vName}
            onChange={(e) => setVName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={vCategory}
                onChange={(e) => setVCategory(e.target.value as Vendor['category'])}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-800"
              >
                {(['Hotels', 'Transport', 'Activities', 'Restaurants'] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="Location"
              placeholder="e.g. North Goa"
              value={vLocation}
              onChange={(e) => setVLocation(e.target.value)}
            />
          </div>

          <Input
            label="Primary Contact Person"
            placeholder="e.g. Rajesh Kumar"
            value={vContact}
            onChange={(e) => setVContact(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={vPhone}
              onChange={(e) => setVPhone(e.target.value)}
            />
            <Input
              label="Email"
              value={vEmail}
              onChange={(e) => setVEmail(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? 'Saving...' : 'Save Partner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
