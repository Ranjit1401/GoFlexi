import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TravelPreferences } from '../../types/traveler';
import {
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  Mountain,
  Palmtree,
  Trees,
  Building,
  Landmark,
  Sparkles,
  Plane,
  Train,
  Bus,
  Car,
  Shuffle,
  User,
  Users,
  Heart,
  Smile,
  Zap,
  Coffee,
  ShoppingBag,
  Camera,
  Flame,
  Award
} from 'lucide-react';

export const TravelerOnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 7;
  const navigate = useNavigate();
  const { saveOnboardingPreferences, preferences } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<TravelPreferences>({
    attractions: preferences?.attractions || ['Beaches', 'Mountains'],
    experiences: preferences?.experiences || ['Relaxation', 'Food'],
    travelStyle: preferences?.travelStyle || 'Balanced',
    companions: preferences?.companions || 'Couple',
    transportation: preferences?.transportation || ['Flight', 'Car'],
    pacing: preferences?.pacing || 'Balanced',
    budgetRange: preferences?.budgetRange || '₹25,000 – ₹50,000'
  });

  const toggleMultiSelect = (field: 'attractions' | 'experiences' | 'transportation', item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(item)) {
        if (current.length === 1) return prev; // keep at least 1
        return { ...prev, [field]: current.filter((x) => x !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  const setSingleSelect = <K extends 'travelStyle' | 'companions' | 'pacing' | 'budgetRange'>(
    field: K,
    val: TravelPreferences[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsSaving(true);
      try {
        const result = await saveOnboardingPreferences(formData);
        if (!result.success) {
          showToast('error', result.error || 'Failed to save travel preferences to server. Please try again.');
          return;
        }
        showToast('success', 'Your personalized travel profile has been created!', 'Welcome to Voyara');
        navigate('/user/dashboard');
      } catch (err: any) {
        showToast('error', err?.message || 'Failed to save travel preferences to server. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-xl font-bold text-navy-950">Voyara</span>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Personalized Preference Setup
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            Let's personalize your travel experience.
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Voyara tunes every route and accommodation to your real style.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
        </div>

        {/* Step Contents */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 mb-8 min-h-[380px] flex flex-col justify-between">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 1 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  What kind of places attract you?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Select one or more landscapes you love exploring.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  { name: 'Mountains', icon: Mountain, desc: 'High peaks & pine forests' },
                  { name: 'Beaches', icon: Palmtree, desc: 'Golden sands & blue tides' },
                  { name: 'Nature', icon: Trees, desc: 'Rainforests & wildlife reserves' },
                  { name: 'Cities', icon: Building, desc: 'Metropolitan culture & lights' },
                  { name: 'Historical', icon: Landmark, desc: 'Forts, castles & monuments' },
                  { name: 'Cultural', icon: Sparkles, desc: 'Traditions, temples & arts' },
                  { name: 'Islands', icon: Palmtree, desc: 'Turquoise lagoons & reefs' }
                ].map((item) => {
                  const isSelected = formData.attractions.includes(item.name);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleMultiSelect('attractions', item.name)}
                      className={`relative p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between min-h-[100px] ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? 'text-brand-950' : 'text-slate-800'}`}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 2 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  What experiences do you enjoy?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Select all the activities that make a trip unforgettable.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  { name: 'Adventure', icon: Zap },
                  { name: 'Food', icon: Coffee },
                  { name: 'Nightlife', icon: Flame },
                  { name: 'Shopping', icon: ShoppingBag },
                  { name: 'Relaxation', icon: Heart },
                  { name: 'Wildlife', icon: Trees },
                  { name: 'Photography', icon: Camera },
                  { name: 'Culture', icon: Landmark },
                  { name: 'Sports', icon: Award }
                ].map((item) => {
                  const isSelected = formData.experiences.includes(item.name);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleMultiSelect('experiences', item.name)}
                      className={`relative p-3.5 rounded-2xl text-left border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                        <span className={`text-sm font-semibold ${isSelected ? 'text-brand-950' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 3 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  What's your travel style?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Single selection: Choose your primary comfort preference.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Budget', desc: 'Hostels, local transit, value stays, smart essentials.' },
                  { name: 'Balanced', desc: '3-4 star comfort, boutique homestays, curated experiences.' },
                  { name: 'Premium', desc: '4-5 star luxury hotels, private transfers, exclusive tours.' },
                  { name: 'Luxury', desc: 'Ultra-luxury resorts, bespoke concierge, VIP private charters.' }
                ].map((item) => {
                  const isSelected = formData.travelStyle === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSingleSelect('travelStyle', item.name as TravelPreferences['travelStyle'])}
                      className={`relative p-5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-base font-bold ${isSelected ? 'text-brand-950' : 'text-slate-900'}`}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 4 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  Who do you usually travel with?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Single selection: Helps customize room formats & group pacing.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Solo', icon: User, desc: 'Independent journeys & personal headspace' },
                  { name: 'Couple', icon: Heart, desc: 'Romantic retreats & shared discoveries' },
                  { name: 'Family', icon: Users, desc: 'Kid-friendly resorts & relaxed pacing' },
                  { name: 'Friends', icon: Smile, desc: 'Group fun, nightlife & adventures' }
                ].map((item) => {
                  const isSelected = formData.companions === item.name;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSingleSelect('companions', item.name as TravelPreferences['companions'])}
                      className={`relative p-5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between min-h-[110px] ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`text-base font-bold ${isSelected ? 'text-brand-950' : 'text-slate-900'}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 5 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  How do you prefer to travel?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Multiple selection: Choose your favored transit options.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {[
                  { name: 'Flight', icon: Plane, desc: 'Fast long-distance journeys' },
                  { name: 'Train', icon: Train, desc: 'Scenic routes & railway charm' },
                  { name: 'Bus', icon: Bus, desc: 'Budget intercity networks' },
                  { name: 'Car', icon: Car, desc: 'Self-drive & private chauffeured cab' },
                  { name: 'Flexible', icon: Shuffle, desc: 'Best route recommended automatically' }
                ].map((item) => {
                  const isSelected = formData.transportation.includes(item.name);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggleMultiSelect('transportation', item.name)}
                      className={`relative p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between min-h-[95px] ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className={`text-sm font-bold ${isSelected ? 'text-brand-950' : 'text-slate-800'}`}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 6 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  How do you like your itinerary?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Single selection: Dictates daily density and downtime.</p>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    name: 'Relaxed',
                    tag: '1-2 activities/day',
                    desc: 'Plenty of free time to sleep in, sip coffee, and explore without watching the clock.'
                  },
                  {
                    name: 'Balanced',
                    tag: '2-3 activities/day',
                    desc: 'The golden mean. Key highlights covered in the morning with easy afternoons.'
                  },
                  {
                    name: 'Packed',
                    tag: '4+ activities/day',
                    desc: 'Action-packed, dawn to dusk sightseeing to maximize every single minute.'
                  }
                ].map((item) => {
                  const isSelected = formData.pacing === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSingleSelect('pacing', item.name as TravelPreferences['pacing'])}
                      className={`w-full p-4 rounded-2xl text-left border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${isSelected ? 'text-brand-950' : 'text-slate-900'}`}>
                            {item.name}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7 */}
          {step === 7 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">Step 7 of 7</span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  What's your typical trip budget?
                </h2>
                <p className="text-xs text-slate-500 mt-1">Single selection: Approximate budget per person for standard trip.</p>
              </div>

              <div className="space-y-3">
                {[
                  'Under ₹10,000',
                  '₹10,000 – ₹25,000',
                  '₹25,000 – ₹50,000',
                  '₹50,000 – ₹1,00,000',
                  '₹1,00,000+'
                ].map((tier) => {
                  const isSelected = formData.budgetRange === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSingleSelect('budgetRange', tier as TravelPreferences['budgetRange'])}
                      className={`w-full p-4 rounded-2xl text-left border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <span className={`text-base font-bold ${isSelected ? 'text-brand-950' : 'text-slate-900'}`}>
                        {tier}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
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
              isLoading={isSaving}
              disabled={isSaving}
              className="rounded-xl px-6 bg-navy-900 hover:bg-navy-800"
            >
              <span>{step === totalSteps ? 'Create My Travel Profile' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto w-full text-center text-xs text-slate-400">
        You can always update these preferences later from your Traveler Profile.
      </div>
    </div>
  );
};
