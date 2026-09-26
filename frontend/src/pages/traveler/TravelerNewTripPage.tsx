import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Heart,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Clock
} from 'lucide-react';

export const TravelerNewTripPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDest = searchParams.get('dest') || '';

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [showEngineModal, setShowEngineModal] = useState(false);

  // Form state
  const [destination, setDestination] = useState(initialDest || 'Goa');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-19');
  const [travelersCount, setTravelersCount] = useState(2);
  const [budgetTier, setBudgetTier] = useState('₹25,000 – ₹50,000');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Beaches', 'Food', 'Sunset Cruise']);
  const [travelStyle, setTravelStyle] = useState('Balanced');

  const popularDestinations = ['Goa', 'Manali', 'Kerala', 'Meghalaya', 'Rajasthan', 'Andaman', 'Kashmir', 'Sikkim'];
  const allInterests = [
    'Beaches', 'Food', 'Sunset Cruise', 'Mountain Treks', 'Water Sports',
    'Heritage Forts', 'Houseboat Stay', 'Nightlife', 'Wellness & Spa', 'Photography'
  ];

  const toggleInterest = (item: string) => {
    if (selectedInterests.includes(item)) {
      if (selectedInterests.length === 1) return;
      setSelectedInterests(selectedInterests.filter((x) => x !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      // Final step: trigger modal stating engine will be connected soon
      setShowEngineModal(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Trip Builder
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Plan Your Next Journey
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure destinations, dates, and pacing to shape your personalized itinerary prototype.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
      </div>

      {/* Wizard Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 min-h-[420px] flex flex-col justify-between">
        {/* STEP 1: DESTINATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 1 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">Where are you heading?</h2>
              <p className="text-xs text-slate-500 mt-1">Select from popular regions or type any custom destination.</p>
            </div>

            <Input
              label="Destination Name"
              placeholder="e.g. Goa, Manali, Jaipur..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
            />

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Or select a featured destination:</span>
              <div className="flex flex-wrap gap-2">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      destination.toLowerCase() === dest.toLowerCase()
                        ? 'bg-navy-950 text-white border-navy-950'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATES */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 2 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">When do you plan to travel?</h2>
              <p className="text-xs text-slate-500 mt-1">Choose departure and return dates for pacing calculations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Departure Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
              />
              <Input
                label="Return Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-3 text-xs text-brand-900">
              <Clock className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span>
                Estimated Duration: <strong className="font-bold">4 Days / 3 Nights</strong>. Ideal for a balanced getaway.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: TRAVELERS */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 3 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">How many travelers are in your party?</h2>
              <p className="text-xs text-slate-500 mt-1">Sets appropriate room allocations and private transport fleet.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { count: 1, label: 'Solo Traveler', desc: '1 Person' },
                { count: 2, label: 'Couple / Pair', desc: '2 People' },
                { count: 4, label: 'Small Group', desc: '3-4 People' },
                { count: 6, label: 'Family / Party', desc: '5+ People' }
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setTravelersCount(item.count)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    travelersCount === item.count
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Users className={`w-5 h-5 mb-2 ${travelersCount === item.count ? 'text-brand-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <Input
              label="Exact number of travelers"
              type="number"
              min={1}
              max={25}
              value={travelersCount}
              onChange={(e) => setTravelersCount(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {/* STEP 4: BUDGET */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 4 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">What is your estimated total budget?</h2>
              <p className="text-xs text-slate-500 mt-1">Per person budget bracket for stays, tours, and activities.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                'Under ₹10,000',
                '₹10,000 – ₹25,000',
                '₹25,000 – ₹50,000',
                '₹50,000 – ₹1,00,000',
                '₹1,00,000+'
              ].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBudgetTier(tier)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    budgetTier === tier
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold text-slate-900">{tier}</span>
                  {budgetTier === tier && (
                    <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: INTERESTS */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 5 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">Select your key interests</h2>
              <p className="text-xs text-slate-500 mt-1">Choose activities you would like integrated into the days.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {allInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check className="w-3 h-3 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: TRAVEL STYLE */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 6 of 6</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">Confirm your travel style</h2>
              <p className="text-xs text-slate-500 mt-1">Dictates overall pacing, transport class, and accommodation tier.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Budget', desc: 'Hostels, local transit, pocket-friendly meals.' },
                { name: 'Balanced', desc: '3-4 star boutique stays, private cab transfers.' },
                { name: 'Premium', desc: '4-5 star resorts, premium excursions, private guides.' },
                { name: 'Luxury', desc: 'Bespoke 5-star suites, private catamaran, VIP hospitality.' }
              ].map((style) => (
                <button
                  key={style.name}
                  type="button"
                  onClick={() => setTravelStyle(style.name)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    travelStyle === style.name
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900">{style.name}</span>
                    {travelStyle === style.name && (
                      <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            className="rounded-xl px-6 bg-navy-900 hover:bg-navy-800"
          >
            <span>{step === totalSteps ? 'Generate My Trip' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Engine Disclaimer Modal */}
      <Modal
        isOpen={showEngineModal}
        onClose={() => setShowEngineModal(false)}
        title="Trip Planning Engine"
        subtitle="Frontend Prototype Notice"
        maxWidth="md"
      >
        <div className="space-y-4 text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Info className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-navy-950">
            Trip planning engine will be connected soon.
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your trip request for <strong>{destination}</strong> ({travelersCount} travelers, {budgetTier}, {travelStyle} style) has been recorded in your prototype session. In the full production release, our dynamic optimization engine will generate day-by-day routes and live vendor bookings.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="primary"
              onClick={() => {
                setShowEngineModal(false);
                navigate('/user/trips');
              }}
              className="rounded-xl"
            >
              View My Trips
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEngineModal(false)}
              className="rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
