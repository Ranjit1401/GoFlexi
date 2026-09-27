import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Plane, Users, X, Hand } from 'lucide-react';
import printerReference from '../../assets/voyagar-printer.png';
import './TravelerBillingPage.css';
import { api } from '../../services/api-client';

type BillingState = 'ready' | 'generating' | 'printing' | 'final' | 'booking';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
};

const costs = [
  { label: 'Flights', detail: 'Mumbai → Dubai', meta: '2 Travellers', price: '₹24,580' },
  { label: 'Accommodation', detail: '5 nights · Dubai', meta: 'Deluxe room', price: '₹32,400' },
  { label: 'Activities', detail: 'Dubai City Tour', meta: '2 Guests', price: '₹6,200' },
  { label: 'Transport', detail: 'Local transport', meta: 'Airport transfers included', price: '₹3,500' },
];

const IconBox = ({ children }: { children: React.ReactNode }) => <span className="billing-icon-box">{children}</span>;

function TripHeader() {
  return (
    <div className="billing-heading">
      <div>
        <p className="billing-eyebrow">TRIP BILLING</p>
        <h1>Your trip, priced.</h1>
        <p>Review your estimated travel costs before you book.</p>
      </div>
      <div className="billing-trip-chip">
        <IconBox><Plane size={18} /></IconBox>
        <span><strong>Mumbai → Dubai</strong><small>15 Oct – 20 Oct · 2 Travellers</small></span>
      </div>
    </div>
  );
}

function CostBreakdown() {
  return (
    <section className="billing-cost-card">
      <div className="billing-card-head">
        <div><h2>Trip Cost Breakdown</h2><p>Estimated costs based on your selected itinerary</p></div>
        <span className="billing-estimate">ESTIMATE</span>
      </div>
      <div className="billing-cost-list">
        {costs.map((item, i) => (
          <div className="billing-cost-row" key={item.label}>
            <IconBox>{i === 0 ? <Plane size={18} /> : i === 1 ? <span>▥</span> : i === 2 ? <span>▣</span> : <span>▱</span>}</IconBox>
            <span className="billing-cost-main"><strong>{item.label}</strong><small>{item.detail}</small></span>
            <small className="billing-cost-meta">{item.meta}</small>
            <strong className="billing-cost-price">{item.price}</strong>
          </div>
        ))}
      </div>
      <div className="billing-totals">
        <div><span>Subtotal</span><strong>₹66,680</strong></div>
        <div><span>Taxes &amp; Fees</span><strong>₹5,342</strong></div>
        <div className="billing-grand-total"><span><b>ESTIMATED TOTAL</b><small>Inclusive of all estimated taxes and fees</small></span><strong>₹72,022</strong></div>
      </div>
    </section>
  );
}

function Receipt() {
  return (
    <div className="billing-receipt">
      <div className="billing-receipt-content">
        <strong>VOYAGAR</strong><b>TRIP BILL</b><span>Mumbai → Dubai</span><small>15 Oct – 20 Oct<br />2 Travellers</small>
        <i />
        {costs.map((item) => <span className="billing-receipt-line" key={item.label}><span>{item.label}</span><b>{item.price}</b></span>)}
        <i />
        <span className="billing-receipt-line"><span>Subtotal</span><b>₹66,680</b></span>
        <span className="billing-receipt-line"><span>Taxes &amp; Fees</span><b>₹5,342</b></span>
        <i />
        <span className="billing-receipt-line billing-receipt-total"><b>TOTAL</b><b>₹72,022</b></span>
        <small>Prices checked just now</small>
      </div>
    </div>
  );
}

function Printer({ state, onTap }: { state: BillingState; onTap: () => void }) {
  const isPrinting = state === 'printing';
  const isGenerating = state === 'generating';
  return (
    <section className={`billing-printer-stage billing-${state}`}>
      <div className="billing-printer-copy">
        <span className={`billing-status-dot ${state !== 'ready' ? 'on' : ''}`} />
        <p>{isGenerating ? 'Generating your trip bill...' : isPrinting ? 'Printing your trip bill...' : 'Create your trip bill'}</p>
        <small>{isPrinting ? 'Your receipt is being prepared' : isGenerating ? 'Checking the latest prices' : 'Tap the printer to generate your bill'}</small>
      </div>
      <div className="billing-printer-wrap">
        {isPrinting && <Receipt />}
        <div className="billing-printer-image"><img src={printerReference} alt="Voyagar receipt printer" /></div>
        <button className={`billing-printer-button ${isGenerating ? 'pressed' : ''}`} onClick={onTap} disabled={state !== 'ready'}>
          {isGenerating ? <span className="billing-loader" /> : <><Hand size={31} /><strong>TAP TO CREATE</strong></>}
        </button>
      </div>
    </section>
  );
}

function FinalBill({ onSplit, onBook }: { onSplit: () => void; onBook: () => void }) {
  return <>
    <TripHeader />
    <section className="billing-final-card">
      <div className="billing-final-head"><div><p>TRIP BILL</p><h2>Mumbai → Dubai</h2><span>15 Oct – 20 Oct · 2 Travellers</span></div><IconBox><Plane size={21} /></IconBox></div>
      <div className="billing-bill-rows">
        {costs.map(x => <div className="billing-bill-row" key={x.label}><span><strong>{x.label}</strong><small>{x.detail}</small></span><strong>{x.price}</strong></div>)}
        <hr /><div className="billing-bill-row compact"><span>Subtotal</span><strong>₹66,680</strong></div><div className="billing-bill-row compact"><span>Taxes &amp; Fees</span><strong>₹5,342</strong></div><hr /><div className="billing-bill-row billing-final-total"><strong>TOTAL</strong><strong>₹72,022</strong></div>
      </div>
      <div className="billing-price-check"><Check size={15} /> Prices checked just now</div>
      <div className="billing-actions"><button className="billing-secondary-btn" onClick={onSplit}><Users size={17} />Split This Bill</button><button className="billing-primary-btn" onClick={onBook}>Continue to Booking <ArrowRight size={17} /></button></div>
    </section>
    <p className="billing-footnote">Prices are estimates and may change based on availability at the time of booking.</p>
  </>;
}

function SplitModal({ onClose, onBook }: { onClose: () => void; onBook: () => void }) {
  return <div className="billing-modal-backdrop" onMouseDown={onClose}>
    <section className="billing-split-modal" onMouseDown={e => e.stopPropagation()}>
      <button className="billing-modal-close" onClick={onClose}><X size={18} /></button>
      <h2>Split This Bill</h2><p>Split the total amount with your travel group.</p>
      <div className="billing-split-option selected"><div className="billing-option-top"><span><b>EQUAL SPLIT</b><small>2 travellers · ₹36,011 each</small></span><span className="billing-radio selected"><span /></span></div><div className="billing-people"><div><span><i>N</i>Nikita</span><strong>₹36,011</strong></div><div><span><i>T2</i>Traveller 2</span><strong>₹36,011</strong></div></div><div className="billing-split-total"><span>Total Trip Cost</span><strong>₹72,022</strong></div></div>
      <div className="billing-split-option muted"><div className="billing-option-top"><span><b>CUSTOM SPLIT</b><small>Choose who pays for what.</small></span><span className="billing-radio" /></div><em>COMING SOON</em></div>
      <button className="billing-primary-btn full" onClick={onBook}>Continue to Booking <ArrowRight size={17} /></button>
    </section>
  </div>;
}

export const TravelerBillingPage: React.FC = () => {
  const [state, setState] = useState<BillingState>('ready');
  const [splitOpen, setSplitOpen] = useState(false);
  useEffect(() => {
    if (state === 'generating') { const t = window.setTimeout(() => setState('printing'), 1600); return () => window.clearTimeout(t); }
    if (state === 'printing') { const t = window.setTimeout(() => setState('final'), 5200); return () => window.clearTimeout(t); }
  }, [state]);
  const booking = async () => {
    setSplitOpen(false);

    try {
      const scriptId = 'razorpay-checkout-js';
      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
          document.body.appendChild(script);
        });
      }

      const { data: order } = await api.post('/payments/create-order', {
        amount: 72022,
        currency: 'INR',
        receipt: `goflexi_${Date.now()}`,
      });

      if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable');

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'GoFlexi',
        description: 'Mumbai → Dubai trip booking',
        order_id: order.order_id,
        theme: { color: '#1683F7' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', response);
            setState('booking');
          } catch (error) {
            console.error(error);
            window.alert('Payment verification failed. Please contact support before retrying.');
          }
        },
        modal: {
          ondismiss: () => {
            // Keep the user on the bill until payment is completed.
          },
        },
      });

      checkout.open();
    } catch (error) {
      console.error(error);
      window.alert('Unable to start payment. Please check that the backend and Razorpay test keys are configured.');
    }
  };
  if (state === 'booking') return <div className="billing-booking-handoff"><div className="billing-success"><Check size={32} /></div><h1>Ready to book your trip.</h1><p>Your bill is confirmed. Continue in the booking flow to secure your itinerary.</p><div><span>Mumbai → Dubai<small>15 Oct – 20 Oct · 2 Travellers</small></span><strong>₹72,022</strong></div><button className="billing-secondary-btn" onClick={() => setState('final')}>Back to Bill</button></div>;
  return <div className="billing-page">
    {state === 'final' ? <FinalBill onSplit={() => setSplitOpen(true)} onBook={booking} /> : <><TripHeader /><div className="billing-machine-layout"><CostBreakdown /><Printer state={state} onTap={() => setState('generating')} /></div><p className="billing-footnote">Prices are estimates and may change based on availability at the time of booking.</p></>}
    {splitOpen && <SplitModal onClose={() => setSplitOpen(false)} onBook={booking} />}
  </div>;
};
