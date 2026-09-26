import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Repeat,
  CheckCircle2,
  Users,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { PublicNavbar } from '../../layouts/PublicNavbar';
import { PublicFooter } from '../../layouts/PublicFooter';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSimulationStep, setActiveSimulationStep] = useState(0);

  const simulationSteps = [
    {
      title: 'TRIP CREATED',
      badge: 'Step 01',
      desc: 'Traveler books 4-day Goa coastal getaway with Candolim sunset catamaran scheduled on Day 2.',
      status: 'Initial Plan Locked',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    {
      title: 'REAL-WORLD CHANGE',
      badge: 'Step 02',
      desc: 'Coastal meteorological alert issued: High tidal swell and choppy water forecast for Tuesday afternoon.',
      status: 'Weather Disruption Alert',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200'
    },
    {
      title: 'IMPACT DETECTED',
      badge: 'Step 03',
      desc: 'Voyara system identifies catamaran cruise cancellation risk and notifies the assigned tour agent.',
      status: 'Schedule Conflict Identified',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200'
    },
    {
      title: 'ALTERNATIVE GENERATED',
      badge: 'Step 04',
      desc: 'Automated rerouting generates Latin Quarter heritage food trail with reserved indoor wine tasting.',
      status: 'Optimal Backup Prepared',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200'
    },
    {
      title: 'TRIP UPDATED',
      badge: 'Step 05',
      desc: 'Traveler confirms alternative in 1-tap. Tour agent dashboard syncs driver and venue instantly.',
      status: 'Seamless Adaptation Completed',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    }
  ];

  const stepsHowItWorks = [
    {
      number: '01',
      title: 'Discover',
      desc: 'Explore curated global & regional destinations tailored to your preferred vibe, budget, and travel style.',
      icon: MapPin
    },
    {
      number: '02',
      title: 'Personalize',
      desc: 'Fine-tune attractions, pacing, accommodation tiers, companions, and cultural gastronomy.',
      icon: Sliders
    },
    {
      number: '03',
      title: 'Plan',
      desc: 'Build dynamic schedules that balance sightseeing, transit, and downtime seamlessly.',
      icon: Calendar
    },
    {
      number: '04',
      title: 'Travel',
      desc: 'Embark on your journey backed by real-time updates and coordinated local operators.',
      icon: Compass
    },
    {
      number: '05',
      title: 'Adapt',
      desc: 'When weather, flights, or closures strike, receive intelligent alternative suggestions on the fly.',
      icon: Repeat
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-navy-50 border border-navy-100/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-bold text-navy-800 tracking-wide uppercase">
                  Personalized • Intelligent • Adaptive
                </span>
              </div>

              {/* Large Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.12]">
                Travel Plans That <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-navy-800 to-brand-500">
                  Adapt To You.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
                Discover personalized journeys, build smarter itineraries, and stay ready when travel plans change. Built for travelers who value flexibility and tour operators who demand operational perfection.
              </p>

              {/* Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/enter')}
                  className="rounded-full shadow-lg shadow-navy-950/15 group"
                >
                  <span>Enter Platform</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full"
                >
                  <span>Explore How It Works</span>
                </Button>
              </div>

              {/* Stat highlight */}
              <div className="pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-2xl font-bold text-navy-950">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Dynamic Flexibility</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-navy-950">2 Roles</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Travelers & Operators</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-navy-950">Instant</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Scenario Adaptations</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative background blur */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-brand-500/20 to-amber-500/20 rounded-3xl blur-2xl -z-10" />

                {/* Main Hero Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1000&q=80"
                    alt="Traveler enjoying pristine tropical coast"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />

                  {/* Floating Interactive Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-white/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-900">Goa Coastal Expedition</span>
                      </div>
                      <Badge variant="success" size="sm">Optimal Route</Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      Adaptive schedule synchronized with tide forecasts & local transfers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-2">
              Step-by-Step Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-500 text-base mt-3">
              From the first inspiration spark to real-time travel changes, Voyara guides your journey effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {stepsHowItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative bg-slate-50 rounded-3xl p-6 border border-slate-200/70 shadow-sm hover:shadow-card-hover hover:border-slate-300 hover:bg-white transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-navy-950 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-brand-400" />
                      </div>
                      <span className="text-2xl font-black text-slate-300 group-hover:text-brand-500 transition-colors">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-950 mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center text-xs font-semibold text-brand-600">
                    <span>Explore step</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: FOR TRAVELERS */}
      <section id="for-travelers" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
                Tailored Individual Journeys
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight leading-tight">
                For Travelers: <br />
                <span className="text-brand-600">"Your trip, built around you."</span>
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Gone are rigid packages and generic tourist checklists. Voyara builds dynamic journeys tuned to your personal travel style, companion preferences, and pace.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    title: 'Personalized destinations',
                    desc: 'Discover destinations matched to your budget, desired attractions, and seasonality.'
                  },
                  {
                    title: 'Preference-based experiences',
                    desc: 'Prioritize food tours, high-adrenaline adventures, or secluded wellness retreats.'
                  },
                  {
                    title: 'Smart itinerary planning',
                    desc: 'Structured day-by-day itineraries that balance travel time, activities, and relaxation.'
                  },
                  {
                    title: 'Trip organization',
                    desc: 'All booking codes, stops, day schedules, and hotel allotments in one crystal-clear hub.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/enter')}
                  className="rounded-full"
                >
                  <span>Start as Traveler</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Right Visual Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                  alt="Personalized beach escape"
                  className="w-full h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <Badge variant="accent" className="mb-2">Traveler Experience</Badge>
                  <h3 className="text-2xl font-bold">Serene Pacing & Tailored Stops</h3>
                  <p className="text-sm text-slate-200 mt-1">From spontaneous café detours to private sunset sails.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FOR TOUR AGENTS */}
      <section id="for-agents" className="py-24 bg-navy-950 text-white relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Visual Preview Card */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-navy-900/90 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4 text-navy-950" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Operations Command Feed</h4>
                      <p className="text-[11px] text-slate-400">Live operational oversight</p>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">24 Active Tours</Badge>
                </div>

                {/* Micro operational metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Travelers</span>
                    <div className="text-2xl font-bold text-white mt-1">128 Pax</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Schedule Integrity</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">99.4%</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Rahul Sharma (Goa Summer Escape)</span>
                    <span className="text-emerald-400 font-semibold">Confirmed</span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Priya Mehta (Himalayan Adventure)</span>
                    <span className="text-amber-400 font-semibold">Planning</span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Amit Shah (Kerala Discovery)</span>
                    <span className="text-emerald-400 font-semibold">Confirmed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Tour Operations Platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                For Tour Agents: <br />
                <span className="text-amber-400">"One command center for every journey."</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Empower your travel agency with high-precision operational tooling. Oversee traveler rosters, tour packages, vendor partnerships, and timeline changes from a centralized cockpit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    title: 'Traveler management',
                    desc: 'Detailed CRM records, preferences, and booking history.'
                  },
                  {
                    title: 'Tour management',
                    desc: 'Easily launch, monitor, and optimize group or private departures.'
                  },
                  {
                    title: 'Schedule management',
                    desc: 'Real-time timeline view of transfers, activities, and hotel check-ins.'
                  },
                  {
                    title: 'Operational visibility',
                    desc: 'Proactive alerts for conflicts, flight updates, and pending approvals.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-navy-900/60 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/enter')}
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none"
                >
                  <span>Launch Agent Command</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: DYNAMIC TRAVEL (VISUAL DEMONSTRATION) */}
      <section className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-2">
              Visual Demonstration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Dynamic Travel: Plans That Adapt In Real Time
            </h2>
            <p className="text-slate-500 text-base mt-3">
              Watch how Voyara dynamically intercepts disruptions and recalculates optimal itineraries. Click each stage to simulate the workflow.
            </p>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-10">
            {simulationSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSimulationStep(idx)}
                className={`p-4 rounded-2xl text-left border transition-all duration-300 relative ${
                  activeSimulationStep === idx
                    ? 'bg-navy-950 text-white border-navy-950 shadow-lg -translate-y-1'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1 opacity-80">
                  <span>{step.badge}</span>
                  {activeSimulationStep === idx && (
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  )}
                </div>
                <div className="text-xs font-extrabold tracking-tight truncate">{step.title}</div>
              </button>
            ))}
          </div>

          {/* Stepper Card Detail */}
          <div className="max-w-4xl mx-auto bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {activeSimulationStep + 1}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Phase</div>
                  <h3 className="text-2xl font-black text-navy-950 tracking-tight">
                    {simulationSteps[activeSimulationStep].title}
                  </h3>
                </div>
              </div>

              <Badge
                variant="neutral"
                className={`text-xs px-3 py-1 font-bold ${simulationSteps[activeSimulationStep].color}`}
              >
                {simulationSteps[activeSimulationStep].status}
              </Badge>
            </div>

            <div className="py-6">
              <p className="text-base text-slate-700 leading-relaxed font-medium">
                {simulationSteps[activeSimulationStep].desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                disabled={activeSimulationStep === 0}
                onClick={() => setActiveSimulationStep((prev) => Math.max(0, prev - 1))}
                className="text-xs font-bold text-slate-600 disabled:opacity-30 hover:text-navy-900"
              >
                ← Previous Stage
              </button>

              <div className="flex gap-1.5">
                {simulationSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeSimulationStep === i ? 'w-6 bg-brand-600' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={activeSimulationStep === simulationSteps.length - 1}
                onClick={() => setActiveSimulationStep((prev) => Math.min(simulationSteps.length - 1, prev + 1))}
                className="text-xs font-bold text-brand-600 disabled:opacity-30 hover:text-brand-800"
              >
                Next Stage →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURE SHOWCASE CARDS */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-2">
              End-to-End Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Engineered For Modern Travel
            </h2>
            <p className="text-slate-500 text-base mt-3">
              Combining individual personalization with rigorous operational control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Personalized Planning',
                desc: 'Tailored recommendations reflecting distinct traveler styles, companion arrangements, and custom budget limits.',
                icon: Sliders,
                color: 'text-brand-500'
              },
              {
                title: 'Smart Itineraries',
                desc: 'Balanced daily schedules with intelligent pacing to avoid traveler fatigue and maximize local discovery.',
                icon: Calendar,
                color: 'text-emerald-500'
              },
              {
                title: 'Travel Operations',
                desc: 'Robust management command for tour operators: vendors, schedules, bookings, and customer inquiries.',
                icon: Briefcase,
                color: 'text-amber-500'
              },
              {
                title: 'Adaptive Journeys',
                desc: 'Proactive detection of schedule disruptions and fast alternatives, keeping travelers relaxed and on track.',
                icon: Repeat,
                color: 'text-purple-500'
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="p-6 bg-white hover:border-slate-300 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <Badge variant="accent" className="bg-brand-500/20 text-brand-300 border-brand-500/40">
            Prototype Preview
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to plan differently?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto font-normal">
            Enter the Voyara experience as a Traveler discovering tailor-made routes, or as a Tour Agent managing active expeditions.
          </p>
          <div className="pt-4 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/enter')}
              className="rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 shadow-xl shadow-brand-500/30 group"
            >
              <span>Enter Voyara</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <PublicFooter />
    </div>
  );
};
