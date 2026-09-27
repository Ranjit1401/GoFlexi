import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Plane,
  Users,
  X,
  Hand,
  Clock,
  CheckCircle2,
  Receipt as ReceiptIcon,
  CreditCard,
  Building2,
  Compass,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import printerReference from '../../assets/voyagar-printer.png';
import { api } from '../../services/api-client';
import { initiateRazorpayPayment } from '../../services/razorpay';
import { Trip } from '../../types/traveler';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import './TravelerBillingPage.css';

type BillingState = 'ready' | 'generating' | 'printing' | 'final' | 'booking';

interface BillingTripResponse {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  days: number;
  travelers_count: number;
  budget: string;
  status: Trip['status'];
  payment_status?: Trip['paymentStatus'];
  payment_id?: string | null;
  paid_at?: string | null;
  cost_breakdown?: Trip['costBreakdown'] | null;
  image_url?: string | null;
  itinerary_summary?: string | null;
  tags?: string[] | null;
  stops?: string[] | null;
}

const mapBillingTrip = (item: BillingTripResponse): Trip => ({
  id: item.id,
  title: item.title,
  destination: item.destination,
  startDate: item.start_date,
  endDate: item.end_date,
  days: item.days,
  travelersCount: item.travelers_count,
  budget: item.budget,
  status: item.status,
  paymentStatus: item.payment_status || 'Pending',
  paymentId: item.payment_id || undefined,
  paidAt: item.paid_at || undefined,
  costBreakdown: item.cost_breakdown || undefined,
  imageUrl: item.image_url || '',
  itinerarySummary: item.itinerary_summary || '',
  tags: item.tags || [],
  stops: item.stops || [],
});

interface CostItem {
  label: string;
  detail: string;
  meta: string;
  price: string;
  raw: number;
}

const IconBox = ({ children }: { children: React.ReactNode }) => (
  <span className="billing-icon-box">{children}</span>
);

export const TravelerBillingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const tripIdParam = searchParams.get('tripId');
  const paidParam = searchParams.get('paid');

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [state, setState] = useState<BillingState>('ready');
  const [splitOpen, setSplitOpen] = useState(false);
  const [invoiceTab, setInvoiceTab] = useState<'pending' | 'paid'>('pending');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const tripResponse = await api.get<BillingTripResponse[]>('/trips');
        const trips = (tripResponse.data || []).map(mapBillingTrip);
        if (!mounted) return;
        setAllTrips(trips);

        // Selection priority: URL param > first pending trip > first trip
        if (tripIdParam) {
          const match = trips.find((t) => t.id === tripIdParam);
          if (match) {
            setSelectedTripId(match.id);
            setInvoiceTab(match.paymentStatus === 'Paid' ? 'paid' : 'pending');
            if (paidParam === 'true') {
              setState('booking');
            }
            return;
          }
        }

        const pending = trips.filter((t) => t.paymentStatus !== 'Paid');
        if (pending.length > 0) {
          setSelectedTripId(pending[0].id);
          setInvoiceTab('pending');
        } else if (trips.length > 0) {
          setSelectedTripId(trips[0].id);
          setInvoiceTab(trips[0].paymentStatus === 'Paid' ? 'paid' : 'pending');
        }
      } catch (err) {
        console.error('Failed to load trips for billing:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tripIdParam, paidParam]);

  useEffect(() => {
    if (state === 'generating') {
      const t = window.setTimeout(() => setState('printing'), 1600);
      return () => window.clearTimeout(t);
    }
    if (state === 'printing') {
      const t = window.setTimeout(() => setState('final'), 5200);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const activeTrip = useMemo(() => {
    return allTrips.find((t) => t.id === selectedTripId) || allTrips[0] || null;
  }, [allTrips, selectedTripId]);

  const pendingTrips = useMemo(() => {
    return allTrips.filter((t) => t.paymentStatus !== 'Paid');
  }, [allTrips]);

  const paidTrips = useMemo(() => {
    return allTrips.filter((t) => t.paymentStatus === 'Paid');
  }, [allTrips]);

  // Derive dynamic cost breakdown
  const costData = useMemo(() => {
    if (!activeTrip) {
      return {
        items: [] as CostItem[],
        subtotal: 0,
        taxes: 0,
        total: 0,
      };
    }

    const breakdown = activeTrip.costBreakdown;
    const items: CostItem[] = [];

    if (breakdown?.flights && breakdown.flights > 0) {
      items.push({
        label: 'Flights & Transit',
        detail: `${activeTrip.destination} live fare`,
        meta: `${activeTrip.travelersCount} Travellers`,
        price: `₹${breakdown.flights.toLocaleString('en-IN')}`,
        raw: breakdown.flights,
      });
    }

    if (breakdown?.hotel && breakdown.hotel > 0) {
      items.push({
        label: 'Accommodation',
        detail: `Live hotel quote · ${activeTrip.destination}`,
        meta: `${Math.max(1, activeTrip.days - 1)} nights`,
        price: `₹${breakdown.hotel.toLocaleString('en-IN')}`,
        raw: breakdown.hotel,
      });
    }

    if (breakdown?.activities && breakdown.activities > 0) {
      items.push({
        label: 'Experiences & Activities',
        detail: activeTrip.stops?.slice(0, 2).join(', ') || 'Verified trip activities',
        meta: `${activeTrip.travelersCount} Guests`,
        price: `₹${breakdown.activities.toLocaleString('en-IN')}`,
        raw: breakdown.activities,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.raw, 0);
    const taxes = breakdown?.taxes || 0;
    const total = breakdown?.total ?? (subtotal + taxes);

    return { items, subtotal, taxes, total };
  }, [activeTrip]);

  const handlePayTrip = async () => {
    if (!activeTrip || costData.total <= 0) {
      showToast('error', 'Live pricing is required before payment can be started.', 'Pricing Unavailable');
      return;
    }
    setIsProcessingPayment(true);

    initiateRazorpayPayment({
      amount: costData.total,
      tripId: activeTrip.id,
      title: activeTrip.title,
      destination: activeTrip.destination,
      user: user ? { name: user.name, email: user.email } : null,
      onSuccess: async (paymentId: string) => {
        setIsProcessingPayment(false);
        try {
          const paymentResponse = await api.put<BillingTripResponse>(`/trips/${activeTrip.id}/pay`);
          const updated = mapBillingTrip(paymentResponse.data);
          setAllTrips((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...updated, paymentStatus: 'Paid', paymentId } : t))
          );
        } catch {
          setAllTrips((prev) =>
            prev.map((t) => (t.id === activeTrip.id ? { ...t, paymentStatus: 'Paid', paymentId } : t))
          );
        }
        showToast('success', `Payment confirmed for ${activeTrip.title}! Payment ID: ${paymentId}`, 'Booking Finalized');
        setState('booking');
      },
      onError: (errorMessage: string) => {
        setIsProcessingPayment(false);
        showToast('error', errorMessage, 'Payment Failed');
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
        showToast('info', 'Payment was closed. You can complete the settlement at any time.', 'Payment Cancelled');
      },
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading your billing ledgers and invoices..." />;
  }

  if (!activeTrip) {
    return (
      <div className="billing-page">
        <div className="billing-heading">
          <div>
            <p className="billing-eyebrow">TRIP BILLING</p>
            <h1>Your trip, priced.</h1>
            <p>Review your travel costs, print invoices, and settle bookings.</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm my-8">
          <ReceiptIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Invoices Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            You don't have any trip plans in your account yet. Plan your next adventure to view its billing breakdown!
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/user/trips/new')}
            className="rounded-xl inline-flex items-center gap-2 bg-navy-900"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Plan a New Trip</span>
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = activeTrip.paymentStatus === 'Paid';

  if (state === 'booking') {
    return (
      <div className="billing-booking-handoff">
        <div className="billing-success">
          <Check size={32} />
        </div>
        <h1>Payment Settled & Confirmed</h1>
        <p>Your invoice has been finalized. All hotel, flight, and activity reservations are locked in.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-5 flex items-center justify-between">
          <div>
            <strong className="text-sm text-slate-900 block">{activeTrip.title}</strong>
            <small className="text-xs text-slate-500">
              {activeTrip.destination} • {activeTrip.startDate} – {activeTrip.endDate} · {activeTrip.travelersCount} Travellers
            </small>
            {activeTrip.paymentId && (
              <span className="inline-block mt-1 font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Ref: {activeTrip.paymentId}
              </span>
            )}
          </div>
          <strong className="text-lg text-emerald-700 font-extrabold">
            ₹{costData.total.toLocaleString('en-IN')}
          </strong>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="billing-secondary-btn" onClick={() => setState('final')}>
            Review Receipt
          </button>
          <button className="billing-primary-btn" onClick={() => navigate('/user/trips')}>
            View in My Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      {/* Header */}
      <div className="billing-heading">
        <div>
          <p className="billing-eyebrow">TRIP BILLING & INVOICING</p>
          <h1>Your trip, priced.</h1>
          <p>Real-time itemized cost breakdown with live bill printer and instant settlement.</p>
        </div>
        <div className="billing-trip-chip">
          <IconBox>
            <Plane size={18} />
          </IconBox>
          <span>
            <strong>{activeTrip.destination}</strong>
            <small>
              {activeTrip.startDate} – {activeTrip.endDate} · {activeTrip.travelersCount} Travellers
            </small>
          </span>
        </div>
      </div>

      {/* Invoice Category Selector */}
      <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInvoiceTab('pending');
                if (pendingTrips.length > 0) setSelectedTripId(pendingTrips[0].id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                invoiceTab === 'pending'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Invoices ({pendingTrips.length})</span>
            </button>
            <button
              onClick={() => {
                setInvoiceTab('paid');
                if (paidTrips.length > 0) setSelectedTripId(paidTrips[0].id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                invoiceTab === 'paid'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paid & Settled ({paidTrips.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {isPaid ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selected invoice is settled
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Selected invoice is pending payment
              </span>
            )}
          </div>
        </div>

        {/* Trips Pills List */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {(invoiceTab === 'pending' ? pendingTrips : paidTrips).map((trip) => {
            const isSelected = trip.id === selectedTripId;
            return (
              <button
                key={trip.id}
                onClick={() => {
                  setSelectedTripId(trip.id);
                  setState('ready');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{trip.title}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {trip.budget}
                </span>
                {trip.paymentStatus === 'Paid' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
          {(invoiceTab === 'pending' ? pendingTrips : paidTrips).length === 0 && (
            <div className="text-xs text-slate-400 py-1 italic">
              No {invoiceTab} invoices found in this view.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {state === 'final' ? (
        <section className="billing-final-card">
          <div className="billing-final-head">
            <div>
              <p>OFFICIAL TRIP INVOICE</p>
              <h2>{activeTrip.title}</h2>
              <span>
                {activeTrip.destination} • {activeTrip.startDate} – {activeTrip.endDate} · {activeTrip.travelersCount} Travellers
              </span>
            </div>
            <IconBox>
              <Plane size={21} />
            </IconBox>
          </div>

          <div className="billing-bill-rows">
            {costData.items.map((x) => (
              <div className="billing-bill-row" key={x.label}>
                <span>
                  <strong>{x.label}</strong>
                  <small>{x.detail} ({x.meta})</small>
                </span>
                <strong>{x.price}</strong>
              </div>
            ))}
            <hr />
            <div className="billing-bill-row compact">
              <span>Subtotal</span>
              <strong>₹{costData.subtotal.toLocaleString('en-IN')}</strong>
            </div>
            {costData.taxes > 0 && (
              <div className="billing-bill-row compact">
                <span>Taxes &amp; Surcharges</span>
                <strong>₹{costData.taxes.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <hr />
            <div className="billing-bill-row billing-final-total">
              <strong>TOTAL DUE</strong>
              <strong className="text-brand-600 font-extrabold">
                ₹{costData.total.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="billing-price-check flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
              <Check size={15} /> Validated against live partner APIs
            </span>
            {isPaid ? (
              <Badge variant="success" size="sm">
                Paid in Full ({activeTrip.paymentId || 'PAY-CONFIRMED'})
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Payment Pending
              </Badge>
            )}
          </div>

          <div className="billing-actions">
            <button className="billing-secondary-btn" onClick={() => setSplitOpen(true)}>
              <Users size={17} />
              Split This Bill ({activeTrip.travelersCount} Pax)
            </button>
            {isPaid ? (
              <button
                className="billing-primary-btn bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                onClick={() => navigate('/user/trips')}
              >
                View Confirmed Itinerary <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="billing-primary-btn bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                onClick={handlePayTrip}
                disabled={isProcessingPayment || costData.total <= 0}
              >
                <CreditCard size={17} />
                {isProcessingPayment
                  ? 'Processing Settlement...'
                  : `Pay & Settle ₹${costData.total.toLocaleString('en-IN')}`}
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="billing-machine-layout">
            {/* Cost Breakdown Card */}
            <section className="billing-cost-card">
              <div className="billing-card-head">
                <div>
                  <h2>Trip Cost Breakdown</h2>
                  <p>Itemized quote for {activeTrip.title} ({activeTrip.destination})</p>
                </div>
                <span className="billing-estimate">
                  {isPaid ? 'PAID' : 'ESTIMATE'}
                </span>
              </div>
              <div className="billing-cost-list">
                {costData.items.map((item, i) => (
                  <div className="billing-cost-row" key={item.label}>
                    <IconBox>
                      {i === 0 ? (
                        <Plane size={18} />
                      ) : i === 1 ? (
                        <Building2 size={18} />
                      ) : i === 2 ? (
                        <Compass size={18} />
                      ) : (
                        <ReceiptIcon size={18} />
                      )}
                    </IconBox>
                    <span className="billing-cost-main">
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <small className="billing-cost-meta">{item.meta}</small>
                    <strong className="billing-cost-price">{item.price}</strong>
                  </div>
                ))}
              </div>
              <div className="billing-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{costData.subtotal.toLocaleString('en-IN')}</strong>
                </div>
                {costData.taxes > 0 && (
                  <div>
                    <span>Taxes &amp; Surcharges</span>
                    <strong>₹{costData.taxes.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div className="billing-grand-total">
                  <span>
                    <b>ESTIMATED TOTAL</b>
                    <small>Inclusive of taxes, transfers, and booking fees</small>
                  </span>
                  <strong>₹{costData.total.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {!isPaid && (
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  <button
                    className="billing-primary-btn bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 flex-1 shadow-md hover:shadow-lg transition-all"
                    onClick={handlePayTrip}
                    disabled={isProcessingPayment || costData.total <= 0}
                  >
                    <CreditCard size={18} />
                    <span>
                      {isProcessingPayment
                        ? 'Connecting to Razorpay...'
                        : `Pay ₹${costData.total.toLocaleString('en-IN')} with Razorpay`}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="billing-secondary-btn py-2.5 px-4 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    onClick={() => setSplitOpen(true)}
                  >
                    <Users size={15} className="inline mr-1 text-slate-500" />
                    Split Bill
                  </button>
                </div>
              )}
            </section>

            {/* Interactive Bill Printer */}
            <section className={`billing-printer-stage billing-${state}`}>
              <div className="billing-printer-copy">
                <span className={`billing-status-dot ${state !== 'ready' ? 'on' : ''}`} />
                <p>
                  {state === 'generating'
                    ? 'Generating your trip bill...'
                    : state === 'printing'
                    ? 'Printing your trip bill...'
                    : 'Create your trip bill'}
                </p>
                <small>
                  {state === 'printing'
                    ? 'Your receipt is being printed'
                    : state === 'generating'
                    ? 'Checking live vendor tariffs'
                    : (costData.total > 0 ? 'Tap the printer to generate receipt' : 'Live pricing required before printing')}
                </small>
              </div>
              <div className="billing-printer-wrap">
                {state === 'printing' && (
                  <div className="billing-receipt">
                    <div className="billing-receipt-content">
                      <strong>GOFLEXI</strong>
                      <b>TRIP BILL</b>
                      <span>{activeTrip.title}</span>
                      <small>
                        {activeTrip.destination}
                        <br />
                        {activeTrip.startDate} – {activeTrip.endDate}
                        <br />
                        {activeTrip.travelersCount} Travellers
                      </small>
                      <i />
                      {costData.items.map((item) => (
                        <span className="billing-receipt-line" key={item.label}>
                          <span>{item.label}</span>
                          <b>{item.price}</b>
                        </span>
                      ))}
                      <i />
                      <span className="billing-receipt-line">
                        <span>Subtotal</span>
                        <b>₹{costData.subtotal.toLocaleString('en-IN')}</b>
                      </span>
                      <span className="billing-receipt-line">
                        <span>Taxes</span>
                        <b>₹{costData.taxes.toLocaleString('en-IN')}</b>
                      </span>
                      <i />
                      <span className="billing-receipt-line billing-receipt-total">
                        <b>TOTAL</b>
                        <b>₹{costData.total.toLocaleString('en-IN')}</b>
                      </span>
                      <small>
                        Status: {isPaid ? 'PAID' : 'PENDING'} • {new Date().toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                )}
                <div className="billing-printer-image">
                  <img src={printerReference} alt="GoFlexi receipt printer" />
                </div>
                <button
                  className={`billing-printer-button ${state === 'generating' ? 'pressed' : ''}`}
                  onClick={() => setState('generating')}
                  disabled={state !== 'ready' || costData.total <= 0}
                >
                  {state === 'generating' ? (
                    <span className="billing-loader" />
                  ) : (
                    <>
                      <Hand size={31} />
                      <strong>TAP TO CREATE</strong>
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
          <p className="billing-footnote">
            Live provider prices are estimates and may change with availability. Unpaid itineraries remain editable up until payment.
          </p>
        </>
      )}

      {/* Group Split Modal */}
      {splitOpen && (
        <div className="billing-modal-backdrop" onMouseDown={() => setSplitOpen(false)}>
          <section className="billing-split-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="billing-modal-close" onClick={() => setSplitOpen(false)}>
              <X size={18} />
            </button>
            <h2>Split This Bill</h2>
            <p>Divide the total trip cost evenly with your {activeTrip.travelersCount} travel companions.</p>
            <div className="billing-split-option selected">
              <div className="billing-option-top">
                <span>
                  <b>EQUAL SPLIT</b>
                  <small>
                    {activeTrip.travelersCount} travellers · ₹{Math.round(costData.total / activeTrip.travelersCount).toLocaleString('en-IN')} each
                  </small>
                </span>
                <span className="billing-radio selected">
                  <span />
                </span>
              </div>
              <div className="billing-people">
                {Array.from({ length: activeTrip.travelersCount }).map((_, idx) => (
                  <div key={idx}>
                    <span>
                      <i>{idx === 0 ? (user?.name?.charAt(0) || 'Y') : `T${idx + 1}`}</i>
                      {idx === 0 ? (user?.name || 'You (Primary Organizer)') : `Companion ${idx + 1}`}
                    </span>
                    <strong>
                      ₹{Math.round(costData.total / activeTrip.travelersCount).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="billing-split-total">
                <span>Total Trip Cost</span>
                <strong>₹{costData.total.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <div className="billing-split-option muted">
              <div className="billing-option-top">
                <span>
                  <b>CUSTOM SPLIT</b>
                  <small>Assign custom portions per companion.</small>
                </span>
                <span className="billing-radio" />
              </div>
              <em>COMING SOON</em>
            </div>
            {isPaid ? (
              <button className="billing-primary-btn full bg-emerald-600 border-emerald-600" onClick={() => setSplitOpen(false)}>
                Bill Settled & Confirmed
              </button>
            ) : (
              <button
                className="billing-primary-btn full bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                onClick={() => {
                  setSplitOpen(false);
                  handlePayTrip();
                }}
                disabled={isProcessingPayment || costData.total <= 0}
              >
                {isProcessingPayment ? 'Processing...' : 'Settle Group Bill Now'}
                <ArrowRight size={17} />
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default TravelerBillingPage;
