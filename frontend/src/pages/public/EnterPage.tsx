import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Luggage, Briefcase, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const EnterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-2xl font-black text-navy-950 tracking-tight">GoFlexi</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Main Selection Area */}
      <div className="max-w-4xl mx-auto w-full my-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Select Your Role
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight">
            Welcome to GoFlexi
          </h1>
          <p className="text-base sm:text-lg text-slate-500 mt-2 max-w-xl mx-auto">
            Choose how you want to use the platform.
          </p>
        </div>

        {/* Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CARD 1: TRAVELER */}
          <div className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-brand-500 transition-all duration-300 p-8 flex flex-col justify-between hover:-translate-y-1">
            <div>
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-xs">
                <Luggage className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Personalized Journeys</span>
              <h2 className="text-2xl font-extrabold text-navy-950 mt-1 mb-3">
                TRAVELER
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Discover destinations, build personalized trips and manage your journey.
              </p>

              {/* Highlights */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Personalized travel preference setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Dynamic trip generator mockup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Upcoming & past trip itineraries</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/user/auth')}
                className="w-full justify-center rounded-2xl group-hover:bg-brand-600 shadow-md group-hover:shadow-brand-500/20"
              >
                <span>Continue as Traveler</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* CARD 2: TOUR AGENT */}
          <div className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-navy-900 transition-all duration-300 p-8 flex flex-col justify-between hover:-translate-y-1">
            <div>
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-105 group-hover:bg-navy-950 group-hover:text-amber-400 transition-all shadow-xs">
                <Building2 className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Operations Command</span>
              <h2 className="text-2xl font-extrabold text-navy-950 mt-1 mb-3">
                TOUR AGENT
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Manage travelers, tours, schedules and travel operations.
              </p>

              {/* Highlights */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Operations command dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Schedules, bookings, and vendors hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Live alerts & traveler management</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/agent/auth')}
                className="w-full justify-center rounded-2xl bg-navy-900 hover:bg-navy-800 shadow-md"
              >
                <span>Continue as Agent</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 py-4">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Mock data prototype environment. No credentials required to test.
        </span>
      </div>
    </div>
  );
};
