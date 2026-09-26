import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  image: string;
  imageQuote: string;
  imageAuthor: string;
  backTo?: string;
  backLabel?: string;
  roleBadge: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  image,
  imageQuote,
  imageAuthor,
  backTo = '/enter',
  backLabel = 'Back to role selection',
  roleBadge
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
      <div className="w-full flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto lg:max-w-none">
          {/* Top navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center shadow-md">
                <Compass className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-xl font-bold text-navy-950">Voyara</span>
            </Link>

            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </Link>
          </div>

          {/* Center Form Container */}
          <div className="max-w-md w-full mx-auto my-auto py-6">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-navy-50 text-navy-800 border border-navy-100 mb-3">
                <Sparkles className="w-3 h-3 text-brand-500" />
                {roleBadge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {/* Bottom Security Note */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protected prototype environment
            </span>
            <span>Voyara v2.4</span>
          </div>
        </div>

        {/* Right Side: Imagery & Testimonial */}
        <div className="hidden lg:block lg:w-1/2 relative bg-navy-950 overflow-hidden">
          <img
            src={image}
            alt="Travel inspiration"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

          {/* Floating Testimonial Card */}
          <div className="absolute bottom-12 left-12 right-12 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl">
            <div className="flex gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">★</span>
              ))}
            </div>
            <p className="text-lg font-medium leading-relaxed italic text-white/95 mb-4">
              "{imageQuote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow">
                {imageAuthor.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{imageAuthor}</div>
                <div className="text-xs text-slate-300">Verified Voyara Explorer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
