import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  ShieldCheck,
  Zap,
  Users,
  Image as ImageIcon,
  CreditCard,
  Rocket,
  Mail,
  Copy,
  Check,
  Headphones,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromoteModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [region, setRegion] = useState<'intl' | 'india'>('intl');
  const [copied, setCopied] = useState(false);

  const ownerEmail = 'shashaaiteam@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(ownerEmail);
    setCopied(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactClick = (hours?: number, price?: string) => {
    const rawSubject = hours
      ? `Promotion Inquiry - ${hours} Hour(s) Status`
      : 'Promote on Sha-Verse Inquiry';
    const rawBody = `Hello Sha-Verse Team,\n\nI want to promote my content on the Sha-Verse logo status.${
      hours ? `\nRequested Duration: ${hours} hour(s) (${price})` : ''
    }\n\nPlease share the payment details and instructions to get started.\n\nThank you!`;

    const subject = encodeURIComponent(rawSubject);
    const body = encodeURIComponent(rawBody);

    // Direct Gmail Web Compose URL (opens Gmail directly in browser tab)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${ownerEmail}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${ownerEmail}?subject=${subject}&body=${body}`;

    const win = window.open(gmailUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = mailtoUrl;
    }
  };

  // Generate 1 to 24 hours pricing list
  const hoursList = Array.from({ length: 24 }, (_, i) => {
    const hrs = i + 1;
    if (region === 'intl') {
      const discounted = (hrs * 2.99).toFixed(2);
      const original = (hrs * 5.99).toFixed(2);
      return { hours: hrs, price: `$${discounted}`, originalPrice: `$${original}` };
    } else {
      const discounted = hrs * 249;
      const original = hrs * 499;
      return {
        hours: hrs,
        price: `₹${discounted.toLocaleString()}`,
        originalPrice: `₹${original.toLocaleString()}`,
      };
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="fixed inset-0 z-[100] w-full h-full max-w-none max-h-none p-0 bg-background text-foreground border-none rounded-none flex flex-col overflow-hidden !translate-x-0 !translate-y-0 !left-0 !top-0 opacity-100 shadow-none"
      >
        {/* Top Sticky Header */}
        <div className="shrink-0 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Promote on Sha-Verse
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 scrollbar-hide">
          {/* Hero Section */}
          <div className="text-center space-y-3.5 max-w-xl mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Megaphone className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Promote on Sha-Verse
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Reach thousands of active users instantly. Your promotion shows up as a featured status on the Sha-Verse logo, seen by the whole community.
              </p>
            </div>

            {/* Badges Row - Responsive Flex */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] sm:text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Secure Payment
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                <Zap className="w-3.5 h-3.5" />
                Instant Approval in 30 mins
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                <Users className="w-3.5 h-3.5" />
                50,000+ Active Users
              </span>
            </div>
          </div>

          {/* How It Works - Responsive 3 Column Grid on Tablet/Desktop */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
              How it works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">1. Send your creative</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-normal">
                    Share your image or video (15 sec – 5 min) and your promo link.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">2. Pick duration & pay</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-normal">
                    Choose how many hours your promo runs, then pay securely.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col justify-between gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">3. Go live instantly</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-normal">
                    Your promotion appears as a status on the Sha-Verse logo for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                Pricing
              </h3>
              {/* Region Selector Toggle */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegion('india')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                    region === 'india'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  IN India
                </button>
                <button
                  type="button"
                  onClick={() => setRegion('intl')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                    region === 'intl'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  International
                </button>
              </div>
            </div>

            {/* Pricing Container */}
            <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    {region === 'intl' ? 'International (USD)' : 'India (INR)'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {region === 'intl' ? 'No tax • 50% launch discount applied' : 'Inclusive of GST • 50% launch discount applied'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  50% OFF LAUNCH
                </span>
              </div>

              {/* Hourly Pricing Table - Complete Expanded View */}
              <div className="divide-y divide-border">
                {hoursList.map((item) => (
                  <div
                    key={item.hours}
                    onClick={() => handleContactClick(item.hours, item.price)}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.hours} {item.hours === 1 ? 'hour' : 'hours'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {item.price}
                      </span>
                      <span className="text-[11px] text-muted-foreground line-through">
                        {item.originalPrice}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                        50% off
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Get Started / Contact Us */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                Get started / Contact us
              </h3>
              <p className="text-xs text-muted-foreground">
                Ready to promote? Reach out and our team will set you up within 30 minutes.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground">Email us instantly</h4>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${ownerEmail}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleContactClick();
                    }}
                    className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors break-all cursor-pointer"
                  >
                    {ownerEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  onClick={handleCopyEmail}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Email'}
                </Button>
                <Button
                  onClick={() => handleContactClick()}
                  size="sm"
                  className="flex-1 sm:flex-initial gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Team
                </Button>
              </div>
            </div>
          </div>

          {/* Why Advertise With Us - Responsive Grid */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
              Why advertise with us
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2.5 text-xs font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>100% Secure Payment</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2.5 text-xs font-medium text-foreground">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Instant Approval in 30 mins</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2.5 text-xs font-medium text-foreground">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>50,000+ Active Users</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2.5 text-xs font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Money-back if not delivered</span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border shadow-2xs flex items-center gap-2.5 text-xs font-medium text-foreground">
                <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>24/7 Dedicated Support</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-muted-foreground pt-1 pb-2">
            Prices shown include a 50% launch discount. Final amount confirmed at checkout.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteModal;
