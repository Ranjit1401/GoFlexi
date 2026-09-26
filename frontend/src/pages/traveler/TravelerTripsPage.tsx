import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTrips } from '../../data/trips';
import { TripCard } from '../../components/traveler/TripCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Trip } from '../../types/traveler';
import { PlusCircle, Luggage, MapPin, Calendar, Users, CheckCircle2 } from 'lucide-react';

export const TravelerTripsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Draft'>('Upcoming');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const navigate = useNavigate();

  const filteredTrips = mockTrips.filter((t) => t.status === activeTab);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
            Personal Itinerary Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            My Trips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your upcoming adventures, past memories, and saved draft plans.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/user/trips/new')}
          className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          <span>Create New Trip</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['Upcoming', 'Past', 'Draft'] as const).map((tab) => {
          const count = mockTrips.filter((t) => t.status === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab} Trips</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <Luggage className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No {activeTab.toLowerCase()} trips found.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Ready to chart your next travel experience? Launch the trip generator to customize an itinerary.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/user/trips/new')}
            className="rounded-xl"
          >
            Create New Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onViewDetails={(t) => setSelectedTrip(t)}
            />
          ))}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTrip && (
        <Modal
          isOpen={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          title={selectedTrip.title}
          subtitle={`${selectedTrip.destination} • ${selectedTrip.days} Days`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] relative">
              <img
                src={selectedTrip.imageUrl}
                alt={selectedTrip.destination}
                className="w-full h-full object-cover"
              />
              <Badge variant="success" className="absolute top-3 left-3 shadow">
                {selectedTrip.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Travel Dates</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.startDate}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Travelers</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.travelersCount} Pax</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Est. Budget</span>
                <div className="text-xs font-bold text-navy-950 mt-0.5">{selectedTrip.budget}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Overview & Summary
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedTrip.itinerarySummary}
              </p>
            </div>

            {selectedTrip.stops && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Stops & Activities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTrip.stops.map((stop, i) => (
                    <Badge key={i} variant="neutral" className="bg-slate-100 text-slate-700">
                      <MapPin className="w-3 h-3 text-brand-500 mr-1" />
                      {stop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Itinerary ID: <span className="font-mono text-slate-600">{selectedTrip.id}</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedTrip(null)}
                className="rounded-xl"
              >
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
