import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrips, updateTrip, payTrip } from '../../services/trips';
import { initiateRazorpayPayment } from '../../services/razorpay';
import { TripCard } from '../../components/traveler/TripCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Trip } from '../../types/traveler';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  Luggage,
  MapPin,
  AlertCircle,
  RefreshCw,
  Edit3,
  CreditCard,
  CheckCircle2,
  Lock,
  Calendar,
  Users,
  Coins,
  Receipt,
  ArrowRight,
  Info,
  Trash2,
} from 'lucide-react';
import { EditTripModal } from '../../components/traveler/EditTripModal';
import { DeleteTripDialog } from '../../components/traveler/DeleteTripDialog';
import { getDestinationImage } from '../../utils/placeImages';

export const TravelerTripsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Draft'>('Upcoming');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Edit & Delete modal states
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getTrips();
      setAllTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
      setErrorMessage('Unable to load your trips. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleOpenEdit = (trip: Trip) => {
    if (trip.paymentStatus === 'Paid') {
      showToast('error', 'Paid trips cannot be modified as bookings are finalized.', 'Editing Locked');
      return;
    }
    setTripToEdit(trip);
  };

  const handleTripSaved = (updatedTrip: Trip) => {
    setAllTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    if (selectedTrip?.id === updatedTrip.id) {
      setSelectedTrip(updatedTrip);
    }
  };

  const handleTripDeleted = (deletedTripId: string) => {
    setAllTrips((prev) => prev.filter((t) => t.id !== deletedTripId));
    if (selectedTrip?.id === deletedTripId) {
      setSelectedTrip(null);
    }
  };

  const handleDirectPay = async (trip: Trip) => {
    setIsProcessingPayment(true);

    const parseNum = (str: string) => {
      const digits = (str || '').replace(/[^0-9]/g, '');
      return digits ? parseInt(digits, 10) : 45000;
    };
    const totalAmount = trip.costBreakdown?.total || parseNum(trip.budget);

    initiateRazorpayPayment({
      amount: totalAmount,
      tripId: trip.id,
      title: trip.title,
      destination: trip.destination,
      user: user ? { name: user.name, email: user.email } : null,
      onSuccess: async (paymentId: string) => {
        setIsProcessingPayment(false);
        try {
          const updated = await payTrip(trip.id);
          setAllTrips((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...updated, paymentStatus: 'Paid', paymentId } : t))
          );
          setSelectedTrip((prev) =>
            prev && prev.id === trip.id ? { ...prev, paymentStatus: 'Paid', paymentId } : prev
          );
        } catch {
          setAllTrips((prev) =>
            prev.map((t) => (t.id === trip.id ? { ...t, paymentStatus: 'Paid', paymentId } : t))
          );
          setSelectedTrip((prev) =>
            prev && prev.id === trip.id ? { ...prev, paymentStatus: 'Paid', paymentId } : prev
          );
        }
        showToast(
          'success',
          `Payment confirmed for ${trip.title}! Ref: ${paymentId}`,
          'Payment Successful'
        );
      },
      onError: (errMsg: string) => {
        setIsProcessingPayment(false);
        showToast('error', errMsg, 'Payment Failed');
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
        showToast('info', 'Payment checkout was closed. You can settle the bill anytime.', 'Payment Cancelled');
      },
    });
  };

  const filteredTrips = allTrips.filter((t) => t.status === activeTab);

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
            Review your upcoming adventures, past memories, and saved draft plans. Unpaid trips remain fully editable.
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
          const count = allTrips.filter((t) => t.status === tab).length;
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

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading your personal itineraries..." />
      ) : errorMessage ? (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Error loading trips</h3>
          <p className="text-xs text-slate-600 mt-1 mb-5">{errorMessage}</p>
          <Button variant="primary" onClick={fetchTrips} className="rounded-xl inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          icon={<Luggage className="w-7 h-7 text-slate-400" />}
          title={`No ${activeTab.toLowerCase()} trips found`}
          description="Ready to chart your next travel experience? Launch the trip generator to customize an itinerary."
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/user/trips/new')}
              className="rounded-xl"
            >
              Create New Trip
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onViewDetails={(t) => setSelectedTrip(t)}
              onEdit={handleOpenEdit}
              onDelete={(t) => setTripToDelete(t)}
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
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Cover Image & Badges */}
            <div className="rounded-2xl overflow-hidden aspect-[16/8] relative bg-slate-100 shadow-inner">
              <img
                src={getDestinationImage(selectedTrip.destination) || selectedTrip.imageUrl}
                alt={selectedTrip.destination}
                onError={(e) => {
                  if (selectedTrip.imageUrl) {
                    (e.currentTarget as HTMLImageElement).src = selectedTrip.imageUrl;
                  }
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge variant="success" className="shadow-md bg-navy-900 text-white">
                  {selectedTrip.status}
                </Badge>
                {selectedTrip.paymentStatus === 'Paid' ? (
                  <Badge variant="success" className="shadow-md bg-emerald-600 text-white border-0">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                    Paid & Confirmed
                  </Badge>
                ) : (
                  <Badge variant="warning" className="shadow-md bg-amber-500 text-white border-0">
                    Payment Pending
                  </Badge>
                )}
              </div>
            </div>

            {/* Payment Status & Action Card */}
            {selectedTrip.paymentStatus === 'Paid' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-emerald-900">Payment Completed</h4>
                      {selectedTrip.paymentId && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-800 font-bold">
                          {selectedTrip.paymentId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      This itinerary is finalized and confirmed. Changes require concierge support.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/user/billing?tripId=${selectedTrip.id}`)}
                  className="rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs shrink-0 inline-flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <span>Payment Not Completed</span>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Editable
                      </span>
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      You can modify this trip anytime until payment is finalized. Queued in your billing ledger.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(selectedTrip)}
                    className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 text-xs inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Trip</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isProcessingPayment}
                    onClick={() => handleDirectPay(selectedTrip)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isProcessingPayment ? 'Connecting...' : 'Pay with Razorpay'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/user/billing?tripId=${selectedTrip.id}`)}
                    className="rounded-xl text-slate-600 hover:bg-slate-100 text-xs inline-flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Breakdown</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" /> Dates
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedTrip.startDate} — {selectedTrip.endDate}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Party
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.travelersCount} Travelers</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" /> Destination
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.destination}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3" /> Est. Budget
                </span>
                <div className="text-xs font-bold text-navy-950 mt-0.5">{selectedTrip.budget}</div>
              </div>
            </div>

            {/* Cost Breakdown Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-brand-600" />
                  Itemized Cost Breakdown
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedTrip.paymentStatus === 'Paid' ? 'Paid in Full' : 'Pending Payment'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Flights & Airport Transit</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedTrip.costBreakdown?.flights || 12000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Accommodation & Resort Stay</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedTrip.costBreakdown?.hotel || 16000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Activities, Experiences & Sightseeing</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedTrip.costBreakdown?.activities || 5000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                  <span>Taxes, Booking Surcharges & Fees</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedTrip.costBreakdown?.taxes || 2500).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm font-bold text-navy-950">
                  <span>Total Amount</span>
                  <span className="text-base text-brand-600 font-extrabold">
                    {selectedTrip.costBreakdown?.total
                      ? `₹${selectedTrip.costBreakdown.total.toLocaleString('en-IN')}`
                      : selectedTrip.budget}
                  </span>
                </div>
              </div>
            </div>

            {/* Overview & Summary */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Overview & Summary
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedTrip.itinerarySummary || 'No specific notes recorded for this itinerary.'}
              </p>
            </div>

            {/* Stops */}
            {selectedTrip.stops && selectedTrip.stops.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Stops & Activities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTrip.stops.map((stop, i) => (
                    <Badge key={i} variant="neutral" className="bg-slate-100 text-slate-700 py-1 px-2.5">
                      <MapPin className="w-3 h-3 text-brand-500 mr-1" />
                      {stop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTripToDelete(selectedTrip)}
                className="rounded-xl text-xs text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 border-rose-200 bg-rose-50/50 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-white" />
                <span>Delete Trip</span>
              </Button>

              <div className="flex items-center gap-2">
                {selectedTrip.paymentStatus !== 'Paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(selectedTrip)}
                    className="rounded-xl text-xs inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Trip</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTrip(null)}
                  className="rounded-xl text-xs"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reusable Edit & Delete Modals */}
      <EditTripModal
        trip={tripToEdit}
        isOpen={Boolean(tripToEdit)}
        onClose={() => setTripToEdit(null)}
        onSaved={handleTripSaved}
      />

      <DeleteTripDialog
        trip={tripToDelete}
        isOpen={Boolean(tripToDelete)}
        onClose={() => setTripToDelete(null)}
        onDeleted={handleTripDeleted}
      />
    </div>
  );
};

export default TravelerTripsPage;

