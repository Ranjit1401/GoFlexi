import React, { useState } from 'react';
import { mockTourPackages } from '../../data/tours';
import { TourPackage } from '../../types/agent';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, MapPin, Calendar, Users, ArrowRight, Clock, Star } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export const AgentToursPage: React.FC = () => {
  const { showToast } = useToast();
  const [tours, setTours] = useState<TourPackage[]>(mockTourPackages);
  const [activeTab, setActiveTab] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New tour fields
  const [tourTitle, setTourTitle] = useState('');
  const [destination, setDestination] = useState('Goa');
  const [duration, setDuration] = useState('5 Days / 4 Nights');
  const [price, setPrice] = useState('₹38,000');
  const [slots, setSlots] = useState(15);

  const filteredTours = tours.filter((t) => t.category === activeTab);

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourTitle.trim()) {
      showToast('error', 'Tour title is required.');
      return;
    }

    const newTour: TourPackage = {
      id: 'pkg-' + Date.now(),
      title: tourTitle.trim(),
      destination,
      duration,
      pricePerPerson: price,
      category: 'Upcoming',
      totalSlots: slots,
      bookedSlots: 0,
      startDate: '01 Aug 2026',
      endDate: '06 Aug 2026',
      imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'
    };

    setTours([newTour, ...tours]);
    setCreateModalOpen(false);
    setTourTitle('');
    showToast('success', `Tour package "${newTour.title}" created successfully!`);
    setActiveTab('Upcoming');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Package Inventory
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Tour Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Oversee active departures, upcoming holiday packages, and completed journeys.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          <span>Create Tour</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['Active', 'Upcoming', 'Completed'] as const).map((tab) => {
          const count = tours.filter((t) => t.category === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-navy-950 text-navy-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab} Tours</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((pkg) => {
          const occupancyRate = Math.round((pkg.bookedSlots / pkg.totalSlots) * 100);

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                  <img
                    src={getDestinationImage(pkg.destination) || pkg.imageUrl}
                    alt={pkg.title}
                    onError={(e) => {
                      if (pkg.imageUrl) {
                        (e.currentTarget as HTMLImageElement).src = pkg.imageUrl;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={pkg.category === 'Active' ? 'success' : pkg.category === 'Upcoming' ? 'warning' : 'neutral'}>
                      {pkg.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-navy-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white">
                    {pkg.pricePerPerson} / person
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-slate-700">{pkg.destination}</span>
                    <span className="text-slate-300">•</span>
                    <span>{pkg.duration}</span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 group-hover:text-brand-600 transition-colors">
                    {pkg.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{pkg.startDate} — {pkg.endDate}</span>
                  </div>

                  {/* Slot progress */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Slots Booked: {pkg.bookedSlots}/{pkg.totalSlots}</span>
                      <span className="text-navy-950">{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          occupancyRate >= 90 ? 'bg-rose-500' : occupancyRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('info', `Opening roster for ${pkg.title}`)}
                  className="w-full justify-center rounded-xl"
                >
                  <span>Manage Tour Roster</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Tour Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Tour Package"
        subtitle="Configure package details, dates, and total seat quota."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTour} className="space-y-4">
          <Input
            label="Tour Package Title"
            placeholder="e.g. Kashmir Autumn Shikara & Apple Harvest"
            value={tourTitle}
            onChange={(e) => setTourTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Destination
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white text-slate-800"
              >
                {['Goa', 'Manali', 'Kerala', 'Meghalaya', 'Rajasthan', 'Andaman', 'Kashmir', 'Sikkim'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Input
              label="Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price Per Person"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Total Slots"
              type="number"
              value={slots}
              onChange={(e) => setSlots(parseInt(e.target.value) || 10)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl">
              Publish Package
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
