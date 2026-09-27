import React, { useState, useEffect, useCallback } from 'react';
import { getTours, createTour as apiCreateTour } from '../../services/tours';
import { TourPackage } from '../../types/agent';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, MapPin, Calendar, Users, ArrowRight, Clock, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export const AgentToursPage: React.FC = () => {
  const { showToast } = useToast();
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New tour fields
  const [tourTitle, setTourTitle] = useState('');
  const [destination, setDestination] = useState('Goa');
  const [duration, setDuration] = useState('5 Days / 4 Nights');
  const [price, setPrice] = useState('₹38,000');
  const [slots, setSlots] = useState(15);

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getTours();
      setTours(data);
    } catch (err) {
      console.error('Failed to load tours:', err);
      setErrorMessage('Unable to load tour package inventory. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const filteredTours = tours.filter((t) => t.category === activeTab);

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourTitle.trim()) {
      showToast('error', 'Tour title is required.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const numericPrice = Number(price.replace(/[^0-9]/g, '')) || 35000;
      const created = await apiCreateTour({
        name: tourTitle.trim(),
        destination,
        duration,
        budget_per_person: numericPrice,
        max_participants: slots,
        status: 'Upcoming',
        image_url: getDestinationImage(destination || tourTitle),
        description: `${duration} curated tour package to ${destination}.`,
      });

      setTours((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setTourTitle('');
      showToast('success', `Tour package "${created.title}" created successfully!`, 'Tour Created');
      setActiveTab('Upcoming');
    } catch (err) {
      console.error('Failed to create tour package:', err);
      showToast('error', 'Could not create tour package. Please try again.', 'Creation Failed');
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
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading tour inventory catalog..." />
      ) : errorMessage ? (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Error loading tours</h3>
          <p className="text-xs text-slate-600 mt-1 mb-5">{errorMessage}</p>
          <Button variant="primary" onClick={fetchTours} className="rounded-xl inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredTours.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} tour packages`}
          description="Ready to list a new travel package for client bookings?"
          action={
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-xl"
            >
              Create New Package
            </Button>
          }
        />
      ) : (
        /* Tours Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={tour.imageUrl || getDestinationImage(tour.destination)}
                    alt={tour.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getDestinationImage(tour.destination);
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800 shadow">
                    {tour.pricePerPerson} <span className="text-[10px] text-slate-400 font-normal">/ pax</span>
                  </div>
                  <Badge
                    variant={tour.category === 'Active' ? 'success' : 'neutral'}
                    className="absolute top-3 left-3 shadow"
                  >
                    {tour.category}
                  </Badge>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span>{tour.destination}</span>
                    <span className="text-slate-300">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tour.duration}</span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 group-hover:text-brand-600 transition-colors line-clamp-1 mb-3">
                    {tour.title}
                  </h3>

                  {/* Slot progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Users className="w-3.5 h-3.5" /> Capacity
                      </span>
                      <span className="font-bold text-slate-800">
                        {tour.bookedSlots} / {tour.totalSlots} Slots
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, (tour.bookedSlots / tour.totalSlots) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {tour.startDate}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast('info', `Opening management view for ${tour.title}`, 'Tour Management')}
                  className="rounded-xl group-hover:bg-navy-900 group-hover:text-white transition-colors"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tour Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Tour Package"
        subtitle="Publish a new multi-day package itinerary to your booking inventory."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTour} className="space-y-4">
          <Input
            label="Tour Package Title"
            placeholder="e.g. Goa Luxury Beach & Heritage"
            value={tourTitle}
            onChange={(e) => setTourTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Destination"
              placeholder="e.g. Goa"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <Input
              label="Duration"
              placeholder="e.g. 5 Days / 4 Nights"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price Per Person"
              placeholder="e.g. ₹38,000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Total Slots"
              type="number"
              value={String(slots)}
              onChange={(e) => setSlots(Number(e.target.value))}
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
            <Button type="submit" variant="primary" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? 'Creating...' : 'Publish Tour'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
