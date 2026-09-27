import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Destination } from '../../types/traveler';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  getDestinationBlog,
  getRelatedDestinations,
  DestinationBlogStory,
  RelatedDestinationPin,
} from '../../utils/destinationStories';
import { getDestinationImage } from '../../utils/placeImages';
import {
  X,
  MapPin,
  Calendar,
  Star,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Clock,
  Globe,
  Share2,
  Bookmark,
  Heart,
  Utensils,
  Lightbulb,
  ThumbsUp,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface DestinationDetailModalProps {
  destination: Destination | null;
  onClose: () => void;
  onSelectDestination?: (dest: Destination) => void;
}

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  onClose,
  onSelectDestination,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentDest, setCurrentDest] = useState<Destination | null>(destination);
  const [activeTab, setActiveTab] = useState<'story' | 'related' | 'guide'>('story');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(248);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (destination) {
      setCurrentDest(destination);
      setActiveTab('story');
    }
  }, [destination]);

  if (!currentDest) return null;

  const blogStory: DestinationBlogStory = getDestinationBlog(
    currentDest.name,
    currentDest.description,
    currentDest.tagline
  );

  const relatedPins: RelatedDestinationPin[] = getRelatedDestinations(currentDest.name);

  const heroImg = currentDest.imageUrl || getDestinationImage(currentDest.name);

  const handlePlanTrip = (destNameToPlan?: string) => {
    const targetName = destNameToPlan || currentDest.name;
    onClose();
    navigate(`/user/trips/new?dest=${encodeURIComponent(targetName)}`);
  };

  const handleSwitchToRelated = (pin: RelatedDestinationPin) => {
    // Construct a destination object from the pin and switch view smoothly
    const newDest: Destination = {
      id: pin.id,
      name: pin.name,
      tagline: `${pin.region}, ${pin.country}`,
      description: pin.reason,
      imageUrl: pin.imageUrl,
      tags: pin.tags,
      estimatedBudget: pin.estimatedBudget,
      travelStyle: ['Balanced', 'Scenic'],
      durationDays: 5,
      highlightExperiences: pin.tags,
      rating: 4.8,
      reviewsCount: 312,
      bestSeason: pin.bestMonths,
    };

    setCurrentDest(newDest);
    setActiveTab('story');
    onSelectDestination?.(newDest);

    // Scroll to top of modal content
    const modalScrollEl = document.getElementById('destination-modal-scroll');
    if (modalScrollEl) {
      modalScrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showToast('info', `Switched to ${pin.name} (${pin.country})`, 'Exploring Place');
  };

  const handleToggleLike = () => {
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
      showToast('success', `Saved ${currentDest.name} to your favorites!`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Explore ${currentDest.name} on GoFlexi`,
        text: currentDest.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('info', 'Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-md p-2 sm:p-4 lg:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        
        {/* Top Sticky Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-navy-950 tracking-tight truncate">
                  {currentDest.name}
                </h2>
                <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
                  {currentDest.tagline}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {currentDest.rating} ({currentDest.reviewsCount} reviews)
                </span>
                <span>•</span>
                <span className="text-slate-600 font-medium">{currentDest.bestSeason}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleToggleLike}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                hasLiked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{likesCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Share Destination"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePlanTrip()}
              className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Plan Trip Here</span>
              <span className="sm:hidden">Plan</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div id="destination-modal-scroll" className="flex-1 overflow-y-auto overflow-x-hidden space-y-8 pb-16">
          
          {/* Hero Panoramic Banner */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] max-h-[380px] bg-slate-900 overflow-hidden">
            <img
              src={heroImg}
              alt={currentDest.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = getDestinationImage(currentDest.name);
              }}
              className="w-full h-full object-cover object-center brightness-90 hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
                  <MapPin className="w-3.5 h-3.5 text-brand-300" />
                  {currentDest.tagline}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">
                  {currentDest.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl line-clamp-2">
                  {currentDest.description}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 sm:text-right flex sm:flex-col justify-between items-center sm:items-end flex-shrink-0">
                <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Estimated Budget</span>
                <span className="text-lg sm:text-xl font-black text-amber-300 drop-shadow">
                  {currentDest.estimatedBudget}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Per traveler / ~{currentDest.durationDays || 4} days</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 border-b border-slate-200/80 flex items-center gap-6">
            <button
              onClick={() => setActiveTab('story')}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'story'
                  ? 'text-navy-950 border-b-2 border-brand-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              📖 Real Traveler Blog & Ground Story
            </button>

            <button
              onClick={() => setActiveTab('related')}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'related'
                  ? 'text-navy-950 border-b-2 border-brand-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>More Like This (Pinterest Visual Board)</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                {relatedPins.length}
              </span>
            </button>
          </div>

          {/* TAB 1: TRAVELER BLOG & GROUND EXPERIENCE */}
          {activeTab === 'story' && (
            <div className="px-6 sm:px-10 max-w-4xl mx-auto space-y-8">
              
              {/* Blog Article Header */}
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight leading-snug">
                  {blogStory.title}
                </h2>
                <p className="text-base text-slate-600 leading-relaxed font-serif italic">
                  {blogStory.subtitle}
                </p>

                {/* Author Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={blogStory.author.avatarUrl}
                      alt={blogStory.author.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <div className="text-sm font-bold text-navy-950">{blogStory.author.name}</div>
                      <div className="text-xs text-slate-500">{blogStory.author.handle} • {blogStory.author.date}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{blogStory.author.readTime}</span>
                  </div>
                </div>
              </div>

              {/* Editorial Quote Callout */}
              <blockquote className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 text-slate-800 text-base sm:text-lg font-medium italic leading-relaxed shadow-xs">
                {blogStory.heroQuote}
              </blockquote>

              {/* Lead Paragraph */}
              <p className="text-base text-slate-700 leading-relaxed font-serif">
                {blogStory.leadParagraph}
              </p>

              {/* Main Content Sections */}
              <div className="space-y-6">
                {blogStory.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-bold text-navy-950 tracking-tight">
                      {sec.heading}
                    </h3>
                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {sec.highlightBox && (
                      <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200/80 text-brand-900 text-xs sm:text-sm font-medium flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                        <div>{sec.highlightBox}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Local Food & Signature Cuisine */}
              {blogStory.localDishes && blogStory.localDishes.length > 0 && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Utensils className="w-5 h-5 text-amber-600" />
                    <span>Signature Local Bites & Food Truths</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {blogStory.localDishes.map((dish, dIdx) => (
                      <div key={dIdx} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                        <div className="text-sm font-bold text-navy-950">{dish.name}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{dish.description}</p>
                        {dish.mustTryAt && (
                          <div className="text-[11px] font-semibold text-brand-600 pt-1">
                            📍 Recommended spot: {dish.mustTryAt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tips from Seasoned Explorers */}
              <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>On-The-Ground Explorer Pro-Tips</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-emerald-900">
                  {blogStory.proTips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ratings Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer Verdict</div>
                  <div className="text-2xl font-black text-navy-950 flex items-center gap-1.5 mt-0.5">
                    <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                    <span>{blogStory.ratings.overall} / 5.0</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Scenery</span>
                    <span className="font-bold text-slate-800">{blogStory.ratings.scenery}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Culture</span>
                    <span className="font-bold text-slate-800">{blogStory.ratings.culture}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Cuisine</span>
                    <span className="font-bold text-slate-800">{blogStory.ratings.food}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Adventure</span>
                    <span className="font-bold text-slate-800">{blogStory.ratings.adventure}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => handlePlanTrip()}
                  className="rounded-xl shadow-md"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Plan Trip to {currentDest.name}
                </Button>
              </div>

              {/* Transition Prompt to Pinterest-Style Recommendations */}
              <div className="p-6 rounded-3xl bg-purple-50 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-950">Looking for related worldwide places?</h4>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Explore similar vibes, twin destinations across India and across the globe.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('related')}
                  className="rounded-xl bg-white text-purple-900 border-purple-200 hover:bg-purple-100"
                >
                  <span>View Pinterest Board ({relatedPins.length})</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: PINTEREST-STYLE VISUAL DISCOVERY BOARD ("MORE LIKE THIS") */}
          {activeTab === 'related' && (
            <div className="px-6 sm:px-10 space-y-6">
              <div className="text-center max-w-2xl mx-auto mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-100">
                  <Globe className="w-3.5 h-3.5" />
                  Visual Discovery Board
                </div>
                <h3 className="text-2xl font-extrabold text-navy-950 tracking-tight">
                  Places Similar to {currentDest.name} Worldwide
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Click any card to explore its full photography, travel story, and recommendations.
                </p>
              </div>

              {/* Pinterest Columns / Masonry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPins.map((pin) => {
                  const badgeColor =
                    pin.twinType === 'worldwide_twin'
                      ? 'bg-blue-500 text-white'
                      : pin.twinType === 'regional_sister'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white';

                  const badgeLabel =
                    pin.twinType === 'worldwide_twin'
                      ? '🌍 Worldwide Twin'
                      : pin.twinType === 'regional_sister'
                      ? '🇮🇳 Regional Sister'
                      : '✨ Hidden Counterpart';

                  const aspectClass =
                    pin.aspectRatio === 'tall'
                      ? 'aspect-[4/5]'
                      : pin.aspectRatio === 'wide'
                      ? 'aspect-[16/10]'
                      : 'aspect-square';

                  return (
                    <div
                      key={pin.id}
                      className="group bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-2xl hover:border-brand-500 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1.5 cursor-pointer"
                      onClick={() => handleSwitchToRelated(pin)}
                    >
                      {/* Pin Image */}
                      <div className={`relative ${aspectClass} overflow-hidden bg-slate-900`}>
                        <img
                          src={pin.imageUrl}
                          alt={pin.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 brightness-95 group-hover:brightness-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-black/20" />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-navy-950 shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            {pin.matchScore}% Match
                          </span>
                        </div>

                        {/* Bottom Overlay Title */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <span className="text-[11px] font-medium text-slate-300 block">
                            {pin.region}, {pin.country}
                          </span>
                          <h4 className="text-xl font-black tracking-tight drop-shadow-md">
                            {pin.name}
                          </h4>
                        </div>
                      </div>

                      {/* Pin Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold mb-2">
                            {pin.vibeBadge}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {pin.reason}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Est. Budget:</span>
                            <span className="font-bold text-navy-950">{pin.estimatedBudget}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitchToRelated(pin);
                              }}
                              className="w-full text-xs font-bold rounded-xl hover:bg-slate-100"
                            >
                              <span>Explore Stories</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlanTrip(pin.name);
                              }}
                              className="w-full text-xs font-bold rounded-xl shadow-xs"
                            >
                              <span>Plan Trip</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Floating Footer CTA */}
        <div className="flex-shrink-0 px-6 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Ready to turn this inspiration into reality? Generate custom routes, flight bookings, and local stays.
          </div>
          <Button
            variant="primary"
            onClick={() => handlePlanTrip()}
            className="w-full sm:w-auto rounded-xl shadow-lg px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Plan a Trip to {currentDest.name}
          </Button>
        </div>

      </div>
    </div>
  );
};
