import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { enUS } from '@clerk/localizations';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getGetAdminStatisticsQueryKey, getGetAdminUsersQueryKey, getGetDashboardQueryKey,
  getGetFavoritesQueryKey, getGetListingsQueryKey, getGetMarketDemandQueryKey,
  getGetListingQueryKey, getGetMyProfileQueryKey, getGetNearbyBuyersQueryKey, getGetNotificationsQueryKey,
  getGetOrderQueryKey, getGetOffersQueryKey, getGetOrdersQueryKey, getGetProfileQueryKey,
  getGetProfileReviewsQueryKey, getGetRecommendationsQueryKey, getHealthCheckQueryKey,
  useClassifyWaste, useCreateListing, useCreateOffer, useCreateOrder, useCreateReview, useDeleteListing,
  useEstimatePrice, useGetAdminStatistics, useGetAdminUsers, useGetDashboard,
  useGetFavorites, useGetListings, useGetMarketDemand, useGetMyProfile, useGetNearbyBuyers,
  useGetNotifications, useGetOffers, useGetOrder, useGetOrders, useGetProfile, useGetProfileReviews,
  useGetRecommendations, useGetListing, useHealthCheck, useMarkNotificationRead, useRemoveFavorite,
  useRequestUploadUrl, useRespondToOffer, useSaveFavorite, useSaveMyProfile,
  useSetUserVerification, useUpdateListing, useUpdateOrder,
} from '@workspace/api-client-react';
import type { Listing, ListingInput, Offer, Order, Profile, ProfileInput } from '@workspace/api-client-react';
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3,
  Bell, Check, CheckCircle2, Clock3,
  Factory, FileText, Filter, Heart, IndianRupee, Leaf, LogOut, MapPin, Menu, Package,
  Plus, Search, ShieldCheck, Sprout, Truck, Upload, Users, Wheat, X,
} from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { Toaster, toast } from 'sonner';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 25_000, retry: 1 } } });
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: {
    colorPrimary: '#27513c', colorForeground: '#21392c', colorMutedForeground: '#657267',
    colorDanger: '#a83b32', colorBackground: '#fbfaf5', colorInput: '#f7f5ed',
    colorInputForeground: '#21392c', colorNeutral: '#dcd8c8', fontFamily: 'DM Sans',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbfaf5] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#21392c] font-semibold', headerSubtitle: 'text-[#657267]',
    socialButtonsBlockButtonText: 'text-[#21392c]', formFieldLabel: 'text-[#21392c]',
    footerActionLink: 'text-[#27513c]', footerActionText: 'text-[#657267]', dividerText: 'text-[#657267]',
    identityPreviewEditButton: 'text-[#27513c]', formFieldSuccessText: 'text-[#27513c]',
    alertText: 'text-[#7f302b]', logoBox: 'rounded-xl', logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#dcd8c8] bg-[#fbfaf5]', formButtonPrimary: 'bg-[#27513c] hover:bg-[#1c422f]',
    formFieldInput: 'bg-[#f7f5ed] border-[#dcd8c8] text-[#21392c]', footerAction: 'bg-transparent',
    dividerLine: 'bg-[#dcd8c8]', alert: 'bg-[#f8ebe7]', otpCodeFieldInput: 'bg-[#f7f5ed]',
    formFieldRow: 'text-[#21392c]', main: 'gap-5',
  },
};

const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#27513c] px-5 py-3 text-sm font-semibold text-[#fbfaf5] transition hover:bg-[#1e432f] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcd8c8] bg-[#fbfaf5] px-4 py-2.5 text-sm font-semibold text-[#294a37] transition hover:border-[#9eaa97] hover:bg-[#f4f1e7] disabled:opacity-50';
const inputClass = 'w-full rounded-xl border border-[#dedaca] bg-[#fffef9] px-4 py-3 text-sm text-[#233a2c] placeholder:text-[#9a9d8f] focus:border-[#53745e] focus:outline-none focus:ring-2 focus:ring-[#53745e]/15';
const wasteTypes = ['Rice straw', 'Wheat straw', 'Sugarcane bagasse', 'Corn stalks', 'Cotton stalks', 'Groundnut shells', 'Coconut husk', 'Mustard residue'];

function tx(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
function invalidate(...keys: readonly unknown[][]) { keys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey })); }
function money(value: number) { return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`; }
function dateText(value?: string | null) { return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'To be agreed'; }
function statusTone(status: string) {
  if (['available', 'completed', 'accepted', 'verified'].includes(status)) return 'bg-[#e6f0e5] text-[#315d3b]';
  if (['pending', 'reserved', 'pickup_scheduled', 'countered'].includes(status)) return 'bg-[#f7edcf] text-[#80652b]';
  if (['rejected', 'cancelled', 'sold'].includes(status)) return 'bg-[#f4e2dc] text-[#8a4335]';
  return 'bg-[#e9e9dc] text-[#6a715f]';
}
function Badge({ children, tone = 'bg-[#e7eee4] text-[#416248]' }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ${tone}`}>{children}</span>;
}
function SpinnerLine({ label = 'Loading your marketplace' }: { label?: string }) {
  return <div className="space-y-4" aria-label={label}>{[0, 1, 2].map((n) => <div key={n} className="h-20 animate-pulse rounded-2xl bg-[#eae7dc]" />)}</div>;
}
function Problem({ error, retry }: { error: unknown; retry: () => void }) {
  return <div className="rounded-2xl border border-[#e8c6bb] bg-[#fbefea] p-6 text-[#704135]" data-testid="state-load-error">
    <p className="font-semibold">We couldn’t load this just now.</p><p className="mt-1 text-sm">{tx(error)}</p>
    <button className="mt-4 text-sm font-bold underline" onClick={retry} data-testid="button-retry">Try again</button>
  </div>;
}
function Empty({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="rounded-[24px] border border-dashed border-[#cfcbbd] bg-[#faf8f0] px-6 py-14 text-center" data-testid="state-empty">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e5eadb] text-[#365b41]"><Sprout size={23} /></span>
    <h3 className="mt-4 font-display text-2xl text-[#294533]">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71776b]">{detail}</p>{action && <div className="mt-5">{action}</div>}
  </div>;
}
function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${light ? 'text-[#f8f4e8]' : 'text-[#254632]'}`} data-testid="link-brand">
    <span className="leaf-mark"><Leaf size={19} strokeWidth={2.3} /></span><span className="text-[19px]">agri<span className="font-display italic">cycle</span></span>
  </Link>;
}
function PublicNav() {
  const [open, setOpen] = useState(false);
  return <header className="relative z-20 mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 lg:px-10">
    <Brand />
    <nav className="hidden items-center gap-8 text-sm font-medium text-[#5e685c] md:flex">
      <Link href="/marketplace" className="hover:text-[#234a35]" data-testid="link-marketplace">Marketplace</Link>
      <Link href="/how-it-works" className="hover:text-[#234a35]" data-testid="link-how-it-works">How it works</Link>
      <Link href="/about" className="hover:text-[#234a35]" data-testid="link-about">Our purpose</Link>
    </nav>
    <div className="hidden items-center gap-2 md:flex">
      <Link href="/sign-in" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#31533d] hover:bg-[#eaeade]" data-testid="link-sign-in">Sign in</Link>
      <Link href="/sign-up" className={primaryBtn} data-testid="link-get-started">Join AgriCycle <ArrowRight size={15} /></Link>
    </div>
    <button className="grid h-10 w-10 place-items-center rounded-xl border border-[#ddd9ca] text-[#31533d] md:hidden" onClick={() => setOpen(!open)} aria-label="Open navigation" data-testid="button-mobile-menu">{open ? <X size={19} /> : <Menu size={19} />}</button>
    {open && <div className="absolute left-4 right-4 top-[72px] grid gap-1 rounded-2xl border border-[#e2ddce] bg-[#fbfaf5] p-3 shadow-xl md:hidden">
      {[['Marketplace', '/marketplace'], ['How it works', '/how-it-works'], ['About', '/about'], ['Sign in', '/sign-in'], ['Join AgriCycle', '/sign-up']].map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-[#31533d] hover:bg-[#f0eee3]" data-testid={`mobile-link-${href.slice(1)}`}>{label}</Link>)}
    </div>}
  </header>;
}
function Footer() {
  return <footer className="border-t border-[#dcd8c8] bg-[#f2efe5] px-5 py-8">
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div><Brand /><p className="mt-2 text-xs text-[#767a6e]">Good material deserves another life.</p></div>
      <div className="flex gap-5 text-xs text-[#5c675a]"><Link href="/marketplace" data-testid="footer-marketplace">Marketplace</Link><Link href="/how-it-works" data-testid="footer-how">How it works</Link><Link href="/about" data-testid="footer-about">About</Link></div>
      <span className="font-mono text-[10px] text-[#8a8d80]">BUILT FOR INDIA’S CIRCULAR HARVEST</span>
    </div>
  </footer>;
}

function Landing() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  return <div className="grain min-h-[100dvh] bg-[#f4f1e7] text-[#21392c]">
    <PublicNav />
    <main>
      <section className="mx-auto grid max-w-[1320px] items-center gap-8 px-5 pb-20 pt-8 md:grid-cols-[1.04fr_.96fr] md:px-10 md:pb-28 md:pt-14">
        <div className="rise max-w-[650px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5d6c5] bg-[#f8f6ed] px-3.5 py-2 text-xs font-semibold text-[#4b6a51]"><span className="h-2 w-2 rounded-full bg-[#6c8c5f]" /> A fairer afterlife for every harvest</div>
          <h1 className="font-display text-[clamp(3.4rem,7vw,6.55rem)] leading-[.98] tracking-[-.055em] text-[#213b2b]">Waste less.<br /><span className="text-[#788447] italic">Grow more.</span></h1>
          <p className="mt-7 max-w-[510px] text-base leading-7 text-[#657064] md:text-lg md:leading-8">We connect Indian farms with the businesses ready to use what’s left after harvest. Better income for farmers. Better materials for industry.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace" className={primaryBtn} data-testid="link-explore-marketplace">Explore the marketplace <ArrowRight size={16} /></Link>
            <Link href="/sign-up" className={secondaryBtn} data-testid="link-list-residue">List your residue <Wheat size={16} /></Link>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#ddd9ca] pt-6">
            <div><strong className="font-display text-2xl text-[#244a34]">One harvest</strong><p className="mt-1 text-xs text-[#7a7d70]">Two sides of a better cycle</p></div>
            <div className="h-9 w-px bg-[#dcd8c8]" />
            <div className="flex items-center gap-2 text-xs text-[#687568]"><ShieldCheck size={17} className="text-[#5c7854]" /> Direct, transparent trade</div>
            <div aria-live="polite" className="sr-only" data-testid="status-marketplace-api">{health.isError ? 'Marketplace connection unavailable' : health.isSuccess ? 'Marketplace connected' : 'Connecting to marketplace'}</div>
          </div>
        </div>
        <div className="rise-delay relative mx-auto w-full max-w-[590px]">
          <div className="relative aspect-[1.08/1] overflow-hidden rounded-[34px] bg-[#9d8d63]">
            <div className="absolute inset-0 bg-[linear-gradient(150deg,#d3c18b_0%,#a18a50_38%,#55744a_100%)]" />
            <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(155deg,transparent 0 22px,rgba(255,243,190,.65) 23px 25px,transparent 26px 42px)' }} />
            <div className="absolute -left-10 bottom-[-20%] h-[78%] w-[120%] rotate-[-8deg] rounded-[50%] bg-[#627d4e]" />
            <div className="absolute -left-16 bottom-[-30%] h-[67%] w-[130%] rotate-[7deg] rounded-[50%] bg-[#355b3e]" />
            <div className="absolute bottom-0 left-0 right-0 h-[55%] opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(95deg, transparent 0 21px, #ddcb83 22px 25px, transparent 26px 43px)' }} />
            <div className="absolute left-[12%] top-[11%] h-[68px] w-[68px] rounded-full bg-[#f3d788]/85 blur-[1px]" />
            <div className="absolute bottom-[11%] left-[8%] max-w-[270px] rounded-2xl border border-white/30 bg-[#f7f3e7]/90 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#476247]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e4eadc]"><Wheat size={15} /></span> FROM FIELD TO FIBRE</div>
              <p className="mt-2 font-display text-xl leading-tight text-[#294a34]">A new market begins<br />after the harvest.</p>
            </div>
            <div className="absolute right-[7%] top-[9%] rounded-2xl border border-white/30 bg-[#244735]/85 px-4 py-3 text-[#f7f3e7] backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#d2d8ba]">Circular by nature</p><p className="mt-1 text-sm font-semibold">Farm → Factory → Future</p>
            </div>
          </div>
          <div className="absolute -bottom-5 right-5 flex items-center gap-2 rounded-2xl bg-[#f9f6eb] px-4 py-3 shadow-lg shadow-[#31432a]/10"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e3ebdc] text-[#496b4c]"><Leaf size={18} /></span><span><strong className="block text-xs text-[#2c4c35]">Residue has value</strong><small className="text-[10px] text-[#7d8172]">Let’s make it count.</small></span></div>
        </div>
      </section>
      <section className="border-y border-[#dcd8c8] bg-[#eae9dc]">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-11 md:grid-cols-[.8fr_1.2fr] md:items-center md:px-10">
          <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#777d68]">THE PROBLEM IS ALSO THE POSSIBILITY</p><h2 className="mt-3 max-w-sm font-display text-3xl leading-tight text-[#2a4834]">Every field has something left to give.</h2></div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[['01', 'Harvest', 'Crop residue is gathered, graded and listed close to home.'], ['02', 'Match', 'Nearby buyers find material that fits their real production needs.'], ['03', 'Return', 'A clear deal turns leftover biomass into income and useful goods.']].map(([no, title, text]) => <article key={no} className="border-l border-[#bdc5b0] pl-4"><span className="font-mono text-xs text-[#8a8e79]">{no}</span><h3 className="mt-2 font-display text-xl text-[#314d39]">{title}</h3><p className="mt-1.5 text-xs leading-5 text-[#71776a]">{text}</p></article>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1320px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#7b806e]">A MARKET THAT MEETS IN THE MIDDLE</p><h2 className="mt-2 font-display text-4xl text-[#284833]">One cycle, two good outcomes.</h2></div><Link href="/how-it-works" className="text-sm font-semibold text-[#45654a] underline decoration-[#aab39e] underline-offset-4" data-testid="link-see-how">See how it works <ArrowRight className="ml-1 inline" size={14} /></Link></div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.12fr]">
          <div className="rounded-[26px] bg-[#244a35] p-7 text-[#f7f3e8]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#527254]"><Wheat size={21} /></span><p className="mt-8 font-mono text-[10px] uppercase tracking-[.16em] text-[#d0d8bd]">FOR FARMERS</p><h3 className="mt-2 font-display text-3xl">A better return<br />for your hard work.</h3><p className="mt-3 max-w-xs text-sm leading-6 text-[#d3dbcc]">Reach buyers directly. Know what your material is worth. Decide when it leaves your farm.</p><Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#e5d38d]" data-testid="link-farmer-join">Start selling <ArrowRight size={15} /></Link></div>
          <div className="rounded-[26px] border border-[#ddd9cb] bg-[#f9f7ee] p-7"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3e8dc] text-[#385e43]"><Factory size={21} /></span><p className="mt-8 font-mono text-[10px] uppercase tracking-[.16em] text-[#7a806f]">FOR INDUSTRY</p><h3 className="mt-2 font-display text-3xl text-[#284833]">Materials, closer<br />to their source.</h3><p className="mt-3 max-w-xs text-sm leading-6 text-[#73796d]">Search local biomass. Talk to verified growers. Build supply chains that begin in the field.</p><Link href="/marketplace" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#45654a]" data-testid="link-buyer-search">Find material <ArrowRight size={15} /></Link></div>
          <div className="flex flex-col justify-between rounded-[26px] bg-[#dcdcbf] p-7"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#6d765e]">MATERIALS IN MOTION</p><h3 className="mt-2 max-w-[250px] font-display text-3xl leading-tight text-[#314c36]">From stubble to something useful.</h3></div><div className="mt-8 space-y-3">{[['Paper & packaging', 'rice straw'], ['Clean energy', 'mustard stalk'], ['Natural fibre', 'coconut husk']].map(([use, raw], i) => <div key={use} className="flex items-center justify-between border-b border-[#c3c8ac] pb-3"><span className="flex items-center gap-3"><span className="font-mono text-[10px] text-[#8a8c75]">0{i + 1}</span><span className="text-sm font-semibold text-[#38523b]">{use}</span></span><span className="text-[10px] text-[#78806b]">{raw}</span></div>)}</div></div>
        </div>
      </section>
      <section className="bg-[#e8e3d2] px-5 py-12 md:px-10">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#7f806e]">READY WHEN YOU ARE</p><h2 className="mt-2 font-display text-3xl text-[#294a35]">Let the next cycle begin.</h2></div><Link href="/sign-up" className={primaryBtn} data-testid="link-join-final">Join the marketplace <ArrowUpRight size={16} /></Link></div>
      </section>
    </main><Footer />
  </div>;
}

function InfoPage({ kind }: { kind: 'about' | 'how' }) {
  const about = kind === 'about';
  return <div className="min-h-[100dvh] bg-[#f4f1e7]"><PublicNav /><main className="mx-auto max-w-[1120px] px-5 pb-20 pt-10 md:px-10 md:pt-16">
    <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#77806e]">{about ? 'OUR PURPOSE' : 'A CLEARER WAY TO TRADE'}</p>
    <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] tracking-[-.04em] text-[#294a35] md:text-7xl">{about ? 'The harvest doesn’t end at the edge of the field.' : 'From a field photo to a fair pickup.'}</h1>
    <p className="mt-6 max-w-[660px] text-lg leading-8 text-[#687266]">{about ? 'AgriCycle helps turn agricultural leftovers into dependable raw material. We bring farmers and nearby industries together around a simpler idea: useful things should keep moving.' : 'AgriCycle keeps each step visible, from identifying crop residue to agreeing a price, date and pickup.'}</p>
    <div className="mt-12 grid gap-4 md:grid-cols-3">{(about ? [['01', 'Respect the source', 'Farmers should set terms for their own material and see its value clearly.'], ['02', 'Keep it nearby', 'Local matches help lower transport effort and build dependable relationships.'], ['03', 'Make reuse practical', 'Industries need consistent, traceable inputs—not a complicated detour.']] : [['01', 'List with confidence', 'Upload a photo, add quantity and location, and get a useful starting estimate.'], ['02', 'Agree directly', 'Buyers make an offer or request a purchase. Farmers can respond and set terms.'], ['03', 'Schedule the return', 'Confirm pickup details together. Mark it complete when the material is collected.']]).map(([n, t, d]) => <article key={n} className="paper-card rounded-[24px] p-6"><span className="font-mono text-xs text-[#8a8d7b]">{n}</span><h2 className="mt-5 font-display text-2xl text-[#2c4a36]">{t}</h2><p className="mt-3 text-sm leading-6 text-[#74796d]">{d}</p></article>)}</div>
    <div className="mt-12 rounded-[28px] bg-[#264a35] p-8 text-[#fbf7e9] md:flex md:items-center md:justify-between md:p-10"><div><h2 className="font-display text-3xl">{about ? 'A more useful kind of growth.' : 'Your first step is a small one.'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#d8dfd0]">{about ? 'A practical marketplace for a resource that’s always been there.' : 'Create a profile, browse nearby materials or put your first residue listing up.'}</p></div><Link href="/sign-up" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e0cb7a] px-5 py-3 text-sm font-bold text-[#294533] md:mt-0" data-testid="link-info-signup">Get started <ArrowRight size={15} /></Link></div>
  </main><Footer /></div>;
}

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useUser();
  const { data: profile } = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), enabled: !!isSignedIn, retry: false } });
  if (isLoaded && isSignedIn && profile) return <Redirect to={`/${profile.role}/dashboard`} />;
  if (isLoaded && isSignedIn && profile === null) return <Redirect to="/setup" />;
  return <Landing />;
}
function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return <div className="grain flex min-h-[100dvh] flex-col bg-[#e9e7db]"><div className="mx-auto w-full max-w-[1280px] px-5 py-6"><Brand /></div><main className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-8 px-5 pb-12 md:grid-cols-[1fr_440px]">
    <div className="hidden max-w-lg md:block"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#707b67]">A BETTER HARVEST CYCLE</p><h1 className="mt-4 font-display text-6xl leading-[1.04] tracking-[-.04em] text-[#294a35]">Good things grow when we trade fairly.</h1><p className="mt-5 text-base leading-7 text-[#687266]">Join growers and businesses making agricultural residue part of the next useful thing.</p><div className="mt-8 flex gap-3 text-xs text-[#60705c]"><BadgeCheck size={16} /> Clear terms <span className="text-[#a8aa9c]">/</span> Local matches <span className="text-[#a8aa9c]">/</span> Real reuse</div></div>
    <div className="rounded-[26px] border border-[#e1ddcf] bg-[#fbfaf5] p-2 shadow-xl shadow-[#475138]/10"><div className="mb-1 px-5 pt-4"><p className="font-display text-2xl text-[#2a4935]">{mode === 'sign-in' ? 'Welcome back.' : 'Make a little room for what’s next.'}</p><p className="mt-1 text-sm text-[#7a7d70]">{mode === 'sign-in' ? 'Sign in to continue to your marketplace.' : 'Create your account, then choose your side of the cycle.'}</p></div>
      <div className="px-1 pb-2 pt-3">{mode === 'sign-in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div>
    </div>
  </main><div className="pb-6 text-center text-[10px] text-[#808477]">AGRICYCLE · BUILT AROUND THE WAY MATERIALS MOVE</div></div>;
}

const farmerNav = [
  ['Dashboard', '/farmer/dashboard', Activity], ['My listings', '/farmer/listings', Package], ['Offers', '/farmer/offers', FileText],
  ['Orders', '/farmer/orders', Truck], ['Earnings', '/farmer/earnings', IndianRupee], ['Nearby buyers', '/farmer/buyers', Users],
  ['Notifications', '/farmer/notifications', Bell], ['My impact', '/farmer/impact', Leaf],
] as const;
const industryNav = [
  ['Dashboard', '/industry/dashboard', Activity], ['Find material', '/industry/marketplace', Search], ['Offers', '/industry/offers', FileText],
  ['Orders', '/industry/orders', Truck], ['Suppliers', '/industry/suppliers', Users], ['Analytics', '/industry/analytics', BarChart3],
] as const;
const adminNav = [
  ['Dashboard', '/admin/dashboard', Activity], ['Users', '/admin/users', Users], ['Listings', '/admin/listings', Package],
  ['Orders', '/admin/orders', Truck], ['Reports', '/admin/reports', FileText], ['Settings', '/admin/settings', ShieldCheck],
] as const;
function AppShell({ children, role }: { children: ReactNode; role: 'farmer' | 'industry' | 'admin' }) {
  const nav = role === 'farmer' ? farmerNav : role === 'industry' ? industryNav : adminNav;
  const [path] = useLocation();
  const { signOut } = useClerk();
  const { data: profile } = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), retry: false } });
  const [drawer, setDrawer] = useState(false);
  return <div className="min-h-[100dvh] bg-[#f4f1e7] text-[#263a2c] md:flex">
    <aside className="hidden w-[247px] shrink-0 flex-col bg-[#213f30] p-5 text-[#f6f2e5] md:flex">
      <Brand light /><div className="mt-11 px-3"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#a9b79e]">{role === 'farmer' ? 'GROWER SPACE' : role === 'industry' ? 'INDUSTRY SPACE' : 'PLATFORM'}</p><p className="mt-2 text-sm font-semibold">{role === 'farmer' ? 'Your farm, in the cycle.' : role === 'industry' ? 'Supply starts nearby.' : 'Marketplace operations'}</p></div>
      <nav className="mt-7 space-y-1">{nav.map(([label, href, Icon]) => <Link href={href} key={href} onClick={() => setDrawer(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${path === href ? 'bg-[#d8c875] text-[#294331]' : 'text-[#d0d9cd] hover:bg-white/10'}`} data-testid={`nav-${href.slice(1).replaceAll('/', '-')}`}><Icon size={17} strokeWidth={1.8} />{label}{label === 'Notifications' && <span className="ml-auto rounded-full bg-[#f2e2a9] px-1.5 py-0.5 text-[10px] text-[#294331]">•</span>}</Link>)}</nav>
      <div className="mt-auto border-t border-white/15 pt-5"><Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/10" data-testid="nav-profile"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9c976] font-display text-lg text-[#294331]">{(profile?.name?.[0] || 'A').toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-xs">{profile?.name || 'Your profile'}</strong><small className="text-[10px] text-[#b2c0af]">{profile?.city || 'Complete your profile'}</small></span></Link>
        <button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#c6d0c4] hover:bg-white/10" data-testid="button-sign-out"><LogOut size={15} /> Sign out</button>
      </div>
    </aside>
    {drawer && <div className="fixed inset-0 z-40 bg-[#182a20]/40 md:hidden" onClick={() => setDrawer(false)}><aside className="h-full w-[min(84vw,310px)] bg-[#213f30] p-5 text-white" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><Brand light /><button onClick={() => setDrawer(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={20} /></button></div><nav className="mt-8 space-y-1">{nav.map(([label, href, Icon]) => <Link href={href} key={href} onClick={() => setDrawer(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#e0e6d9] hover:bg-white/10" data-testid={`mobile-nav-${href.slice(1).replaceAll('/', '-')}`}><Icon size={17} />{label}</Link>)}</nav><Link href="/profile" className="mt-6 block rounded-xl bg-white/10 p-3 text-sm" data-testid="mobile-profile">{profile?.name || 'Your profile'}</Link><button onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="mt-4 flex gap-2 p-3 text-sm" data-testid="mobile-sign-out"><LogOut size={16} /> Sign out</button></aside></div>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#dedaca] bg-[#f8f6ee]/95 px-4 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-lg text-[#31533d] md:hidden" onClick={() => setDrawer(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={20} /></button><div className="md:hidden"><Brand /></div><span className="hidden text-xs text-[#8a8c7f] md:inline">A circular marketplace for agricultural materials</span></div>
        <div className="flex items-center gap-2"><Link href="/marketplace" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#46634c] hover:bg-[#eeede2] sm:flex" data-testid="header-marketplace"><Search size={15} /> Browse market</Link><Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-[#e4e8da] font-display font-semibold text-[#35553d]" data-testid="header-profile">{(profile?.name?.[0] || 'A').toUpperCase()}</Link></div>
      </header>
      <main className="mx-auto max-w-[1450px] px-4 py-7 md:px-8 md:py-9">{children}</main>
    </div>
  </div>;
}
function Title({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="font-mono text-[9px] uppercase tracking-[.21em] text-[#858877]">{eyebrow}</p>}<h1 className="mt-1 font-display text-3xl tracking-[-.03em] text-[#284632] md:text-[40px]" data-testid="page-title">{title}</h1>{detail && <p className="mt-2 text-sm text-[#72796c]">{detail}</p>}</div>{action}</div>;
}
function Dashboard({ role }: { role: 'farmer' | 'industry' | 'admin' }) {
  const { data: summary, isLoading, isError, error, refetch } = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const { data: profile } = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), retry: false } });
  const labels = role === 'farmer' ? ['Available listings', 'Pending offers', 'Completed orders', 'Total earned'] : ['Open supply matches', 'Pending offers', 'Completed orders', 'Material sourced'];
  const metrics = role === 'farmer'
    ? [summary?.activeListings, summary?.pendingOffers, summary?.completedOrders, summary?.totalEarnings]
    : [summary?.activeListings, summary?.pendingOffers, summary?.completedOrders, summary?.totalQuantity];
  return <AppShell role={role}><Title eyebrow={`${role} overview`} title={role === 'farmer' ? `Namaste${profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}.` : role === 'industry' ? 'A closer look at supply.' : 'Marketplace at a glance.'} detail={role === 'farmer' ? 'Your residue has a place in the next cycle.' : 'See what’s moving across your circular supply chain.'} action={role === 'farmer' ? <Link href="/farmer/listings/new" className={primaryBtn} data-testid="button-new-listing"><Plus size={17} /> New listing</Link> : role === 'industry' ? <Link href="/industry/marketplace" className={primaryBtn} data-testid="button-find-material"><Search size={16} /> Find material</Link> : <Link href="/admin/users" className={secondaryBtn} data-testid="button-manage-users"><Users size={16} /> Manage users</Link>} />
      {isLoading ? <SpinnerLine /> : isError ? <Problem error={error} retry={() => void refetch()} /> : <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{labels.map((label, i) => <article key={label} className="paper-card rounded-2xl p-5" data-testid={`metric-card-${i}`}><p className="text-xs font-medium text-[#777c6e]">{label}</p><strong className="mt-3 block font-display text-3xl text-[#294b36]">{i === 3 && role === 'farmer' ? money(Number(metrics[i] || 0)) : new Intl.NumberFormat('en-IN').format(Number(metrics[i] || 0))}{i === 3 && role === 'industry' ? <small className="ml-1 text-sm font-sans">kg</small> : null}</strong><p className="mt-2 flex items-center gap-1 text-[10px] text-[#788171]"><span className="h-1.5 w-1.5 rounded-full bg-[#829a68]" /> Updated from your activity</p></article>)}</div>
        <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><section className="paper-card rounded-[24px] p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-xs text-[#858878]">Recent activity</p><h2 className="mt-1 font-display text-2xl text-[#2d4b37]">The cycle keeps moving</h2></div><Activity size={20} className="text-[#748667]" /></div>
          {summary?.activity?.length ? <div className="mt-5 divide-y divide-[#e9e5d8]">{summary.activity.slice(0, 6).map((item) => <div key={item.id} className="flex items-start gap-3 py-4" data-testid={`activity-${item.id}`}><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e7ecdf] text-[#426046]"><Check size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#36503b]">{item.title}</p><p className="mt-1 text-xs text-[#7d8174]">{item.detail}</p></div><span className="shrink-0 text-[10px] text-[#929486]">{dateText(item.createdAt)}</span></div>)}</div> : <Empty title="Your next step starts here." detail="As offers, orders and pickups come together, you’ll find the activity here." action={role === 'farmer' ? <Link href="/farmer/listings/new" className={secondaryBtn} data-testid="empty-create-listing">Create a listing</Link> : <Link href="/marketplace" className={secondaryBtn} data-testid="empty-browse-market">Browse materials</Link>} />}
        </section><section className="rounded-[24px] bg-[#dfdfc2] p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4f2e5] text-[#4a6645]"><Leaf size={18} /></span><p className="mt-6 font-mono text-[9px] uppercase tracking-[.18em] text-[#737b64]">THE SECOND HARVEST</p><h2 className="mt-2 font-display text-2xl text-[#304a34]">{role === 'industry' ? 'Sourcing closer can change the whole equation.' : 'Every reused kilo is a little more value kept in motion.'}</h2><p className="mt-3 text-sm leading-6 text-[#67705f]">Track completed material and see how everyday trade adds up over time.</p><Link href={role === 'farmer' ? '/farmer/impact' : role === 'industry' ? '/industry/analytics' : '/admin/reports'} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#36533a]" data-testid="link-impact">See your impact <ArrowRight size={14} /></Link></section></div>
        {role === 'farmer' && <QuickDemand />}
      </div>}
    </AppShell>;
}
function QuickDemand() {
  const { data: demand } = useGetMarketDemand({ query: { queryKey: getGetMarketDemandQueryKey() } });
  return <section className="paper-card rounded-[24px] p-5 md:p-7"><div className="flex items-center justify-between"><div><p className="text-xs text-[#858878]">Market pulse</p><h2 className="font-display text-2xl text-[#2d4b37]">What buyers need nearby</h2></div><Link href="/farmer/buyers" className="text-xs font-semibold text-[#4b674d]" data-testid="link-all-buyers">Browse buyers <ArrowRight size={13} className="inline" /></Link></div>{demand?.length ? <div className="mt-5 flex flex-wrap gap-2">{demand.slice(0, 6).map(item => <div key={item.wasteType} className="rounded-xl bg-[#f2f0e5] px-4 py-3" data-testid={`demand-${item.wasteType}`}><p className="text-xs font-semibold text-[#405841]">{item.wasteType}</p><p className="mt-1 text-[10px] text-[#7e8274]">Avg. {money(item.averagePrice)}/ton · {item.buyerCount} buyers</p></div>)}</div> : <p className="mt-4 text-sm text-[#777c6e]">Demand signals will appear here as buyers share their needs.</p>}</section>;
}

function ListingTile({ item, role, saved = false, onSaved, viewOnly = false }: { item: Listing; role: 'farmer' | 'industry'; saved?: boolean; onSaved?: () => void; viewOnly?: boolean }) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.price));
  const [pickupDate, setPickupDate] = useState('');
  const [message, setMessage] = useState('');
  const offer = useCreateOffer();
  const order = useCreateOrder();
  const save = useSaveFavorite();
  const remove = useRemoveFavorite();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const itemQuery = useGetListing(item.id, { query: { queryKey: getGetListingQueryKey(item.id), enabled: false } });
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  function done(kind: 'offer' | 'order') {
    toast.success(kind === 'offer' ? 'Offer sent to the farmer.' : 'Purchase request sent.');
    setOfferOpen(false);
    invalidate(getGetOffersQueryKey(), getGetOrdersQueryKey(), getGetDashboardQueryKey(), getGetListingsQueryKey());
  }
  return <article className="paper-card overflow-hidden rounded-[22px]" data-testid={`listing-card-${item.id}`}>
    <div className="relative h-[142px] overflow-hidden bg-[#e0d7b4]">
      {item.imageUrl ? <img src={item.imageUrl} alt={item.wasteType} className="h-full w-full object-cover" data-testid={`listing-image-${item.id}`} /> : <div className="absolute inset-0 bg-[linear-gradient(125deg,#d5c99d,#84936b_55%,#526b4d)]"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(125deg,transparent 0 16px,#f2e4a9 17px 19px,transparent 20px 31px)' }} /><Wheat className="absolute bottom-4 right-5 text-[#f7f0d2]/80" size={46} /></div>}
      <div className="absolute left-3 top-3"><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>
      {role === 'industry' && !viewOnly && <button onClick={() => { if (!isSignedIn) { setLocation('/sign-in'); return; } const fn = saved ? remove : save; fn.mutate({ listingId: item.id }, { onSuccess: () => { invalidate(getGetFavoritesQueryKey()); toast.success(saved ? 'Removed from saved materials.' : 'Saved to your materials.'); onSaved?.(); }, onError: (e) => toast.error(tx(e)) }); }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#fbfaf5]/90 text-[#466047] hover:bg-white" aria-label={saved ? 'Remove saved listing' : 'Save listing'} data-testid={`button-favorite-${item.id}`}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>}
    </div>
    <div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-display text-xl leading-tight text-[#2b4834]">{item.wasteType}</h3><p className="mt-1 text-[11px] text-[#777d70]">{item.quantity.toLocaleString('en-IN')} {item.unit} available</p></div><div className="shrink-0 text-right"><strong className="font-display text-xl text-[#31563a]">{money(item.price)}</strong><p className="text-[10px] text-[#858879]">per {item.unit === 'ton' ? 'ton' : item.unit}</p></div></div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#7a7e72]"><MapPin size={13} /> {item.city}, {item.state}{item.distanceKm != null && <span className="ml-auto">{item.distanceKm.toFixed(1)} km away</span>}</div>
      <p className="mt-3 line-clamp-2 min-h-[38px] text-xs leading-5 text-[#74796d]">{item.description || `Available ${item.wasteType.toLowerCase()} for reuse.`}</p>
      {item.farmerName && <div className="mt-3 flex items-center gap-2 border-t border-[#eeebdf] pt-3 text-[11px] text-[#6f786c]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e6ebdf] font-semibold text-[#496349]">{item.farmerName[0]}</span>{item.farmerName}{item.farmerVerified && <BadgeCheck size={14} className="text-[#60805b]" />}</div>}
      {role === 'industry' && !viewOnly ? <div className="mt-4 flex gap-2"><button className={`${secondaryBtn} flex-1 !px-2 !py-2 text-xs`} onClick={() => { if (!isSignedIn) { setLocation('/sign-in'); return; } setOfferOpen(!offerOpen); }} data-testid={`button-make-offer-${item.id}`}>{offerOpen ? 'Close offer' : 'Make an offer'}</button><button className={`${primaryBtn} flex-1 !px-2 !py-2 text-xs`} disabled={order.isPending} onClick={() => { if (!isSignedIn) { setLocation('/sign-in'); return; } order.mutate({ data: { listingId: item.id, quantity: item.quantity, pickupDate: item.availableDate || null } }, { onSuccess: () => done('order'), onError: (e) => toast.error(tx(e)) }); }} data-testid={`button-buy-now-${item.id}`}>Buy now</button></div> : null}
      {role === 'farmer' && <div className="mt-4 flex gap-2 border-t border-[#eeebdf] pt-3">
        <button className={`${secondaryBtn} flex-1 !px-2 !py-2 text-xs`} disabled={updateListing.isPending} onClick={() => updateListing.mutate({ listingId: item.id, data: { status: item.status === 'available' ? 'sold' : 'available' } }, { onSuccess: () => { toast.success(item.status === 'available' ? 'Listing marked as sold.' : 'Listing is available again.'); invalidate(getGetListingsQueryKey({ mine: true }), getGetListingQueryKey(item.id), getGetDashboardQueryKey()); }, onError: e => toast.error(tx(e)) })} data-testid={`button-toggle-listing-${item.id}`}>{item.status === 'available' ? 'Mark as sold' : 'Make available'}</button>
        <button className="rounded-xl px-3 py-2 text-xs font-semibold text-[#8b4a3b] hover:bg-[#f6eae5]" disabled={deleteListing.isPending} onClick={() => { if (window.confirm(`Remove your ${item.wasteType} listing?`)) deleteListing.mutate({ listingId: item.id }, { onSuccess: () => { toast.success('Listing removed.'); invalidate(getGetListingsQueryKey({ mine: true }), getGetListingQueryKey(item.id), getGetDashboardQueryKey()); }, onError: e => toast.error(tx(e)) }); }} data-testid={`button-delete-listing-${item.id}`}>Remove</button>
        <span className="sr-only" data-testid={`status-listing-query-${item.id}`}>{itemQuery.data?.status || item.status}</span>
      </div>}
      {offerOpen && <form className="mt-4 space-y-2 border-t border-[#e9e5d8] pt-4" onSubmit={(event) => { event.preventDefault(); const count = Number(quantity); const amount = Number(price); if (!(count > 0 && count <= item.quantity && amount >= 0)) { toast.error('Enter a valid quantity and offer price.'); return; } offer.mutate({ data: { listingId: item.id, quantity: count, price: amount, pickupDate: pickupDate || null, message } }, { onSuccess: () => done('offer'), onError: (e) => toast.error(tx(e)) }); }} data-testid={`form-offer-${item.id}`}>
        <div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-semibold text-[#777c6f]">Quantity<input className={`${inputClass} mt-1 !px-2 !py-2`} type="number" min="0.1" max={item.quantity} step="any" value={quantity} onChange={e => setQuantity(e.target.value)} data-testid={`input-offer-quantity-${item.id}`} /></label><label className="text-[10px] font-semibold text-[#777c6f]">Price / unit<input className={`${inputClass} mt-1 !px-2 !py-2`} type="number" min="0" step="any" value={price} onChange={e => setPrice(e.target.value)} data-testid={`input-offer-price-${item.id}`} /></label></div>
        <label className="block text-[10px] font-semibold text-[#777c6f]">Pickup date<input className={`${inputClass} mt-1 !px-2 !py-2`} type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} data-testid={`input-offer-date-${item.id}`} /></label>
        <label className="block text-[10px] font-semibold text-[#777c6f]">Message<textarea className={`${inputClass} mt-1 !px-2 !py-2`} rows={2} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Introduce your business or pickup plan" data-testid={`input-offer-message-${item.id}`} /></label>
        <button className={`${primaryBtn} w-full !py-2.5 text-xs`} disabled={offer.isPending} data-testid={`button-send-offer-${item.id}`}>{offer.isPending ? 'Sending…' : 'Send offer'} <ArrowRight size={14} /></button>
      </form>}
    </div>
  </article>;
}

function Marketplace({ role = 'industry', path = '/marketplace', readOnly = false }: { role?: 'farmer' | 'industry' | 'admin'; path?: string; readOnly?: boolean }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<'recent' | 'price' | 'quantity'>('recent');
  const [savedOnly, setSavedOnly] = useState(path === '/industry/suppliers');
  const params = useMemo(() => ({ search: search.trim() || undefined, city: city.trim() || undefined, wasteType: type || undefined, sort, mine: path === '/farmer/listings' ? true : undefined }), [search, city, type, sort, path]);
  const query = useGetListings(params, { query: { queryKey: getGetListingsQueryKey(params) } });
  const favorites = useGetFavorites({ query: { queryKey: getGetFavoritesQueryKey() } });
  const items = (savedOnly ? favorites.data : query.data) as Listing[] | undefined;
  const savedIds = new Set(((favorites.data || []) as Listing[]).map(listing => listing.id));
  const title = path === '/farmer/listings' ? 'Your listed material' : path === '/industry/suppliers' ? 'Saved suppliers’ listings' : readOnly ? 'Marketplace listings' : 'Material near your next product';
  const action = role === 'farmer' && path === '/farmer/listings' ? <Link href="/farmer/listings/new" className={primaryBtn} data-testid="button-create-listing"><Plus size={16} /> Add a listing</Link> : undefined;
  return <AppShell role={role}><Title eyebrow={role === 'farmer' ? 'YOUR MATERIAL' : 'NEARBY MATERIAL'} title={title} detail={path === '/farmer/listings' ? 'Manage availability and see what’s moving.' : 'Search agricultural residue that’s ready for another use.'} action={action} />
    <div className="mb-6 rounded-[22px] border border-[#e1ddcf] bg-[#ebe9dd] p-3 md:p-4"><div className="grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 text-[#7b8273]" size={16} /><input className={`${inputClass} !pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search straw, bagasse, husk…" aria-label="Search material" data-testid="input-search-material" /></label>
      <label><span className="sr-only">City</span><input className={inputClass} value={city} onChange={e => setCity(e.target.value)} placeholder="City or district" data-testid="input-filter-city" /></label>
      <label><span className="sr-only">Waste type</span><select className={inputClass} value={type} onChange={e => setType(e.target.value)} data-testid="select-filter-waste"><option value="">All materials</option>{wasteTypes.map(waste => <option key={waste} value={waste}>{waste}</option>)}</select></label>
      <div className="flex gap-2"><select className={`${inputClass} min-w-[125px]`} value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort listings" data-testid="select-sort-listings"><option value="recent">Most recent</option><option value="price">Price</option><option value="quantity">Quantity</option></select>{path === '/industry/suppliers' || path === '/industry/marketplace' ? <button className={`${secondaryBtn} shrink-0 !px-3`} onClick={() => setSavedOnly(!savedOnly)} data-testid="button-toggle-saved"><Heart size={15} fill={savedOnly ? 'currentColor' : 'none'} />{savedOnly ? 'Saved' : 'Saved only'}</button> : null}</div>
    </div><div className="mt-2 flex items-center justify-between px-1 text-[10px] text-[#808476]"><span className="flex items-center gap-1"><Filter size={12} /> Search across active listings</span><button onClick={() => { setSearch(''); setCity(''); setType(''); setSort('recent'); }} className="font-semibold text-[#49654b]" data-testid="button-clear-filters">Clear filters</button></div></div>
    {((savedOnly && favorites.isLoading) || (!savedOnly && query.isLoading)) ? <SpinnerLine /> : query.isError && !savedOnly ? <Problem error={query.error} retry={() => void query.refetch()} /> : favorites.isError && savedOnly ? <Problem error={favorites.error} retry={() => void favorites.refetch()} /> : items?.length ? <><p className="mb-3 text-xs text-[#7a7e72]" data-testid="text-listing-count">{items.length} {items.length === 1 ? 'material match' : 'material matches'}</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(item => <ListingTile item={item} key={item.id} role={role === 'farmer' ? 'farmer' : 'industry'} viewOnly={readOnly} saved={savedIds.has(item.id)} onSaved={() => void favorites.refetch()} />)}</div></> : <Empty title={savedOnly ? 'Nothing saved just yet.' : 'No material found nearby.'} detail={savedOnly ? 'Save listings to keep promising supply in one place.' : 'Try another town or broaden your material search.'} action={savedOnly ? <button className={secondaryBtn} onClick={() => setSavedOnly(false)} data-testid="button-view-all-material">Browse all material</button> : undefined} />}
  </AppShell>;
}

function NewListing() {
  const [, setLocation] = useLocation();
  const upload = useRequestUploadUrl();
  const classify = useClassifyWaste();
  const estimate = useEstimatePrice();
  const create = useCreateListing();
  const { data: profile } = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), retry: false } });
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'ton' | 'quintal'>('ton');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [locationField, setLocationField] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [description, setDescription] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [uses, setUses] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  async function processFile(selected: File) {
    setFile(selected); setErrorMessage('');
    try {
      const response = await upload.mutateAsync({ data: { name: selected.name, size: selected.size, contentType: selected.type as 'image/jpeg' | 'image/png' | 'image/webp' } });
      const uploadResult = await fetch(response.uploadURL, { method: 'PUT', headers: { 'Content-Type': selected.type }, body: selected });
      if (!uploadResult.ok) throw new Error('Photo upload did not complete. Please try another image.');
      const servedUrl = `/api/storage${response.objectPath}`;
      setImageUrl(servedUrl);
      const raw = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(selected); });
      const identified = await classify.mutateAsync({ data: { imageData: raw, fileName: selected.name } });
      setWasteType(identified.wasteType); setUses(identified.possibleUses); setConfidence(identified.confidence);
      toast.success(`Photo identified as ${identified.wasteType}.`);
    } catch (error) { setErrorMessage(tx(error)); toast.error(tx(error)); }
  }
  function priceGuide() {
    const q = Number(quantity);
    if (!wasteType || !(q > 0) || !locationField) { toast.error('Add material, quantity and pickup location to estimate a price.'); return; }
    estimate.mutate({ data: { wasteType, quantity: q, unit, location: locationField } }, { onSuccess: result => { setPrice(String(result.suggestedPrice)); toast.success(`Suggested price: ${money(result.suggestedPrice)} per ${unit}.`); }, onError: e => toast.error(tx(e)) });
  }
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = Number(quantity), p = Number(price);
    if (!wasteType.trim() || !(q > 0) || !(p >= 0) || !locationField.trim() || !city.trim() || !state.trim()) { toast.error('Complete material, quantity, price and location before publishing.'); return; }
    const data: ListingInput = { wasteType, quantity: q, unit, price: p, location, city, state, availableDate: availableDate || null, description, imageUrl: imageUrl || null, aiConfidence: confidence, uses };
    create.mutate({ data }, { onSuccess: listing => { toast.success(`Your ${listing.wasteType} listing is now live.`); invalidate(getGetListingsQueryKey({ mine: true }), getGetListingsQueryKey(), getGetDashboardQueryKey(), getGetMarketDemandQueryKey()); setLocation('/farmer/listings'); }, onError: e => toast.error(tx(e)) });
  }
  return <AppShell role="farmer"><Title eyebrow="ADD YOUR HARVEST" title="Give residue a second route." detail="A clear photo and a few details help the right buyer find it." />
    <form onSubmit={publish} className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]" data-testid="form-new-listing">
      <section className="paper-card rounded-[24px] p-5 md:p-7"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#858879]">01 · SHOW THE MATERIAL</p><h2 className="mt-2 font-display text-2xl text-[#2a4935]">Start with a field photo</h2>
        <label className="mt-5 flex min-h-[230px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#bfc5b1] bg-[#f3f2e9] text-center transition hover:bg-[#eeefe4]" data-testid="upload-photo-dropzone">
          {imageUrl ? <img src={imageUrl} alt="Your agricultural residue" className="h-[230px] w-full object-cover" data-testid="image-listing-preview" /> : <><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5eadc] text-[#47634a]"><Upload size={21} /></span><strong className="mt-4 text-sm text-[#3a5941]">{file ? file.name : 'Choose a photo of your residue'}</strong><small className="mt-1 text-[11px] text-[#838779]">JPG, PNG or WebP · up to 15 MB</small><small className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#60744f]"><Wheat size={12} /> AI will identify the material</small></>}
          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={e => { const selected = e.target.files?.[0]; if (!selected) return; if (selected.size > 15_000_000) { toast.error('Choose an image under 15 MB.'); return; } void processFile(selected); }} data-testid="input-listing-photo" />
        </label>
        {(upload.isPending || classify.isPending) && <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eaf0e4] p-3 text-xs text-[#416048]" data-testid="status-image-processing"><span className="h-2 w-2 animate-pulse rounded-full bg-[#688762]" />{upload.isPending ? 'Preparing a secure upload…' : 'Looking closely at your material…'}</div>}
        {errorMessage && <p className="mt-3 rounded-xl bg-[#f8ebe7] p-3 text-xs text-[#8c493b]" role="alert" data-testid="status-upload-error">{errorMessage}</p>}
        {confidence !== null && <div className="mt-4 rounded-2xl border border-[#dfe6d7] bg-[#f2f5ed] p-4" data-testid="panel-ai-classification"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase tracking-[.14em] text-[#75816c]">PHOTO IDENTIFICATION</span><Badge>{Math.round(confidence * 100)}% confidence</Badge></div><p className="mt-2 font-display text-xl text-[#31543a]">{wasteType}</p><p className="mt-1 text-xs text-[#7b806f]">Check the suggestion and adjust the material details if needed.</p>{uses.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{uses.map(use => <span key={use} className="rounded-full bg-white px-2 py-1 text-[10px] text-[#62715e]">{use}</span>)}</div>}</div>}
        <div className="mt-6 rounded-2xl bg-[#f0eee3] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#435a45]"><ShieldCheck size={15} /> Your listing, your terms</div><p className="mt-1 text-[11px] leading-5 text-[#7d8175]">Buyers contact you through an offer or purchase request. You decide when to accept and arrange pickup.</p></div>
      </section>
      <section className="paper-card rounded-[24px] p-5 md:p-7"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#858879]">02 · SET THE TERMS</p><h2 className="mt-2 font-display text-2xl text-[#2a4935]">Make it easy to say yes</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-[#566456]">Material type<select value={wasteType} onChange={e => setWasteType(e.target.value)} className={`${inputClass} mt-1.5`} required data-testid="select-listing-waste">{['', ...wasteTypes].map(v => <option key={v} value={v}>{v || 'Choose material'}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#566456]">Quantity<input className={`${inputClass} mt-1.5`} type="number" min="0.1" step="any" required value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 8" data-testid="input-listing-quantity" /></label>
          <label className="text-xs font-semibold text-[#566456]">Measurement<select className={`${inputClass} mt-1.5`} value={unit} onChange={e => setUnit(e.target.value as typeof unit)} data-testid="select-listing-unit"><option value="ton">Ton</option><option value="quintal">Quintal</option><option value="kg">Kilogram</option></select></label>
          <label className="text-xs font-semibold text-[#566456]">Price per {unit}<div className="mt-1.5 flex gap-2"><span className="grid w-10 shrink-0 place-items-center rounded-xl bg-[#f0eee3] text-sm text-[#66705f]">₹</span><input className={inputClass} type="number" min="0" step="any" required value={price} onChange={e => setPrice(e.target.value)} placeholder="Set your price" data-testid="input-listing-price" /><button type="button" className="shrink-0 rounded-xl border border-[#d9dccb] px-3 text-[10px] font-semibold text-[#51684e] hover:bg-[#eff1e8]" disabled={estimate.isPending} onClick={priceGuide} data-testid="button-estimate-price">{estimate.isPending ? 'Estimating' : 'Price guide'}</button></div></label>
        </div>
        <div className="mt-4 rounded-xl border border-[#e5e3d8] bg-[#f7f6ef] p-3 text-[11px] text-[#70776c]"><span className="font-semibold text-[#495e48]">A guide, not a rule.</span> Estimates use current local signals; you are always free to set your own price.</div>
        <div className="mt-5 border-t border-[#ece9df] pt-5"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#858879]">PICKUP LOCATION</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#566456]">Village, mandal or pickup point<input className={`${inputClass} mt-1.5`} required value={location} onChange={e => setPrice(e.target.value)} placeholder="Near the co-operative mill" data-testid="input-listing-location" /></label><label className="text-xs font-semibold text-[#566456]">City / district<input className={`${inputClass} mt-1.5`} required value={city} onChange={e => setCity(e.target.value)} placeholder="City or district" data-testid="input-listing-city" /></label><label className="text-xs font-semibold text-[#566456]">State<input className={`${inputClass} mt-1.5`} required value={state} onChange={e => setState(e.target.value)} placeholder="State" data-testid="input-listing-state" /></label><label className="text-xs font-semibold text-[#566456]">Available from<input className={`${inputClass} mt-1.5`} type="date" value={availableDate} onChange={e => setAvailableDate(e.target.value)} data-testid="input-listing-date" /></label></div></div>
        <label className="mt-4 block text-xs font-semibold text-[#566456]">A note for buyers<textarea className={`${inputClass} mt-1.5`} value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={2000} placeholder="Describe dryness, storage and how the material can be collected." data-testid="input-listing-description" /></label>
        <button className={`${primaryBtn} mt-6 w-full`} type="submit" disabled={create.isPending || upload.isPending || classify.isPending} data-testid="button-publish-listing">{create.isPending ? 'Publishing your listing…' : 'Publish listing'} <ArrowRight size={16} /></button>
      </section>
    </form>
  </AppShell>;
}

function Offers({ role }: { role: 'farmer' | 'industry' }) {
  const query = useGetOffers({ query: { queryKey: getGetOffersQueryKey() } });
  const respond = useRespondToOffer();
  function reply(offer: Offer, status: 'accepted' | 'rejected') {
    respond.mutate({ offerId: offer.id, data: { status } }, { onSuccess: () => { toast.success(status === 'accepted' ? 'Offer accepted. Now confirm pickup details in orders.' : 'Offer declined.'); invalidate(getGetOffersQueryKey(), getGetOrdersQueryKey(), getGetDashboardQueryKey()); }, onError: e => toast.error(tx(e)) });
  }
  return <AppShell role={role}><Title eyebrow="DIRECT TRADE" title={role === 'farmer' ? 'Offers for your material' : 'Your offers'} detail="An offer is the start of a conversation. Agree the details before pickup." />
    {query.isLoading ? <SpinnerLine /> : query.isError ? <Problem error={query.error} retry={() => void query.refetch()} /> : query.data?.length ? <div className="space-y-3">{query.data.map(offer => <article key={offer.id} className="paper-card rounded-[22px] p-5 md:p-6" data-testid={`offer-card-${offer.id}`}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7ecdf] text-[#46634a]"><FileText size={19} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl text-[#2a4935]">{offer.listingTitle}</h2><Badge tone={statusTone(offer.status)}>{offer.status}</Badge></div><p className="mt-1 text-xs text-[#798074]">{role === 'farmer' ? `From ${offer.buyerName}` : 'Offer made on'} · {offer.quantity} {offer.unit} · <strong>{money(offer.price)} / unit</strong></p><p className="mt-2 max-w-2xl text-xs leading-5 text-[#71786d]">{offer.message || 'No note was added.'}</p><p className="mt-2 text-[10px] text-[#929486]">Pickup requested: {dateText(offer.pickupDate)} · Sent {dateText(offer.createdAt)}</p></div></div>
        {role === 'farmer' && offer.status === 'pending' && <div className="flex gap-2"><button className={secondaryBtn} onClick={() => reply(offer, 'rejected')} disabled={respond.isPending} data-testid={`button-reject-offer-${offer.id}`}>Decline</button><button className={primaryBtn} onClick={() => reply(offer, 'accepted')} disabled={respond.isPending} data-testid={`button-accept-offer-${offer.id}`}><Check size={15} /> Accept offer</button></div>}
      </div></article>)}</div> : <Empty title="No offers on the table." detail={role === 'farmer' ? 'When a buyer is interested in one of your listings, their offer will appear here.' : 'Browse available agricultural residue and send a clear offer to its grower.'} action={<Link href="/marketplace" className={secondaryBtn} data-testid="link-offer-marketplace">Explore materials</Link>} />}
  </AppShell>;
}

function Orders({ role }: { role: 'farmer' | 'industry' }) {
  const query = useGetOrders({ query: { queryKey: getGetOrdersQueryKey() } });
  const update = useUpdateOrder();
  const [editing, setEditing] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [transport, setTransport] = useState(false);
  function advance(order: Order, status: 'confirmed' | 'pickup_scheduled' | 'picked_up' | 'completed') {
    update.mutate({ orderId: order.id, data: { status } }, { onSuccess: () => { toast.success(`Order marked ${status.replaceAll('_', ' ')}.`); invalidate(getGetOrdersQueryKey(), getGetDashboardQueryKey(), getGetListingsQueryKey()); }, onError: e => toast.error(tx(e)) });
  }
  function schedule(order: Order) {
    if (!pickupDate || !pickupTime || !address.trim() || !phone.trim()) { toast.error('Add pickup date, time, address and contact number.'); return; }
    update.mutate({ orderId: order.id, data: { status: 'pickup_scheduled', pickupDate, pickupTime, pickupAddress: address, contactNumber: phone, transportRequired: transport } }, { onSuccess: () => { toast.success('Pickup details saved.'); setEditing(null); invalidate(getGetOrdersQueryKey(), getGetDashboardQueryKey()); }, onError: e => toast.error(tx(e)) });
  }
  const progression: Record<string, 'confirmed' | 'pickup_scheduled' | 'picked_up' | 'completed'> = { pending: 'confirmed', confirmed: 'pickup_scheduled', pickup_scheduled: 'picked_up', picked_up: 'completed' };
  return <AppShell role={role}><Title eyebrow="THE HANDOVER" title={role === 'farmer' ? 'Orders & pickups' : 'Your material orders'} detail="Keep pickup plans and order progress in one clear place." />
    {query.isLoading ? <SpinnerLine /> : query.isError ? <Problem error={query.error} retry={() => void query.refetch()} /> : query.data?.length ? <div className="space-y-4">{query.data.map(order => <article key={order.id} className="paper-card rounded-[24px] p-5 md:p-6" data-testid={`order-card-${order.id}`}><OrderStatusDetail orderId={order.id} /><div className="flex flex-col gap-5 md:flex-row md:justify-between"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7ecdf] text-[#416048]"><Truck size={19} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl text-[#2a4935]">{order.listingTitle}</h2><Badge tone={statusTone(order.status)}>{order.status.replaceAll('_', ' ')}</Badge></div><p className="mt-1 text-xs text-[#73796d]">{role === 'farmer' ? `Buyer: ${order.buyerName}` : `Grower: ${order.farmerName}`} · {order.quantity} {order.unit} · <strong>{money(order.totalAmount)}</strong></p><p className="mt-2 text-[10px] text-[#85897b]">Order placed {dateText(order.createdAt)} · Pickup {dateText(order.pickupDate)}</p>
        {(order.pickupAddress || order.pickupTime || order.contactNumber) && <div className="mt-4 grid gap-2 rounded-xl bg-[#f1f0e6] p-3 text-xs text-[#687265] sm:grid-cols-2"><p><MapPin size={13} className="mr-1 inline" />{order.pickupAddress || 'Pickup point to be confirmed'}</p><p><Clock3 size={13} className="mr-1 inline" />{order.pickupTime || 'Time to be confirmed'}</p>{order.contactNumber && <p>{order.contactNumber}</p>}<p>{order.transportRequired ? 'Transport arranged by buyer' : 'Transport to be agreed'}</p></div>}
      </div></div><div className="flex flex-wrap items-start gap-2 md:flex-col md:items-end"><span className="rounded-xl bg-[#f0eee3] px-3 py-2 text-xs font-bold text-[#34533b]">{money(order.totalAmount)}</span>
        {order.status === 'pending' && <button className={secondaryBtn} onClick={() => advance(order, 'confirmed')} disabled={update.isPending} data-testid={`button-confirm-order-${order.id}`}>Confirm order</button>}
        {order.status === 'confirmed' && <button className={primaryBtn} onClick={() => { setEditing(editing === order.id ? null : order.id); setPickupDate(order.pickupDate || ''); setPickupTime(order.pickupTime || ''); setAddress(order.pickupAddress || ''); setPhone(order.contactNumber || ''); }} data-testid={`button-schedule-pickup-${order.id}`}>Schedule pickup</button>}
        {['pickup_scheduled', 'picked_up'].includes(order.status) && <button className={primaryBtn} onClick={() => advance(order, progression[order.status])} disabled={update.isPending} data-testid={`button-progress-order-${order.id}`}>{order.status === 'pickup_scheduled' ? 'Mark picked up' : 'Complete order'} <ArrowRight size={14} /></button>}
        {order.status === 'completed' && <Badge>Cycle complete</Badge>}
      </div></div>
      {editing === order.id && <div className="mt-5 border-t border-[#e8e5da] pt-5" data-testid={`panel-pickup-${order.id}`}><h3 className="font-display text-xl text-[#34513b]">Set the pickup details</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-[11px] font-semibold text-[#70776b]">Date<input type="date" className={`${inputClass} mt-1`} value={pickupDate} onChange={e => setPickupDate(e.target.value)} data-testid={`input-pickup-date-${order.id}`} /></label><label className="text-[11px] font-semibold text-[#70776b]">Time<input type="time" className={`${inputClass} mt-1`} value={pickupTime} onChange={e => setPickupTime(e.target.value)} data-testid={`input-pickup-time-${order.id}`} /></label><label className="text-[11px] font-semibold text-[#70776b]">Pickup point<input className={`${inputClass} mt-1`} value={address} onChange={e => setAddress(e.target.value)} data-testid={`input-pickup-address-${order.id}`} /></label><label className="text-[11px] font-semibold text-[#70776b]">Contact<input className={`${inputClass} mt-1`} value={phone} onChange={e => setPhone(e.target.value)} data-testid={`input-pickup-contact-${order.id}`} /></label></div><label className="mt-3 flex items-center gap-2 text-xs text-[#636e60]"><input type="checkbox" checked={transport} onChange={e => setTransport(e.target.checked)} data-testid={`input-transport-${order.id}`} /> Buyer has arranged transport</label><div className="mt-4 flex gap-2"><button className={primaryBtn} onClick={() => schedule(order)} disabled={update.isPending} data-testid={`button-save-pickup-${order.id}`}>Save pickup plan <Check size={15} /></button><button className={secondaryBtn} onClick={() => setEditing(null)} data-testid={`button-cancel-pickup-${order.id}`}>Cancel</button></div></div>}
        {order.status === 'completed' && <ReviewForm order={order} role={role} />}
      </article>)}</div> : <Empty title="No orders to track." detail="When a buyer requests your material, the order and pickup plan will land here." action={<Link href="/marketplace" className={secondaryBtn} data-testid="link-browse-for-orders">Browse the marketplace</Link>} />}
  </AppShell>;
}
function OrderStatusDetail({ orderId }: { orderId: number }) {
  const order = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId) } });
  return <span className="sr-only" data-testid={`order-detail-status-${orderId}`}>{order.data?.status || (order.isLoading ? 'Loading order details' : 'Order detail unavailable')}</span>;
}
function ReviewForm({ order, role }: { order: Order; role: 'farmer' | 'industry' }) {
  const review = useCreateReview();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <div className="mt-5 border-t border-[#e8e5da] pt-4" data-testid={`review-form-${order.id}`}>
    {submitted ? <p className="flex items-center gap-2 text-xs font-semibold text-[#527050]" data-testid={`status-review-${order.id}`}><CheckCircle2 size={15} /> Thank you. Your review helps build trust in the cycle.</p> : <form className="grid gap-2 sm:grid-cols-[140px_1fr_auto]" onSubmit={event => { event.preventDefault(); if (comment.trim().length < 3) { toast.error('Please add a short note about the completed order.'); return; } const profileId = role === 'farmer' ? order.buyerId : order.farmerId; review.mutate({ data: { orderId: order.id, rating: Number(rating), comment } }, { onSuccess: () => { setSubmitted(true); toast.success('Review submitted.'); invalidate(getGetProfileReviewsQueryKey(profileId), getGetProfileQueryKey(profileId)); }, onError: e => toast.error(tx(e)) }); }} data-testid={`form-review-${order.id}`}>
      <label className="text-[10px] font-semibold text-[#70776b]">Your rating<select value={rating} onChange={e => setRating(e.target.value)} className={`${inputClass} mt-1 !py-2`} data-testid={`select-review-rating-${order.id}`}><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Fair</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label>
      <label className="text-[10px] font-semibold text-[#70776b]">Leave a note<textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} minLength={3} maxLength={1000} className={`${inputClass} mt-1 !py-2`} placeholder="How did the pickup and trade go?" data-testid={`input-review-comment-${order.id}`} /></label>
      <button className={`${secondaryBtn} self-end !py-2 text-xs`} disabled={review.isPending} data-testid={`button-submit-review-${order.id}`}>{review.isPending ? 'Sending…' : 'Leave review'}</button>
    </form>}
  </div>;
}

function BuyerDirectory() {
  const buyers = useGetNearbyBuyers(undefined, { query: { queryKey: getGetNearbyBuyersQueryKey() } });
  const recs = useGetRecommendations({ query: { queryKey: getGetRecommendationsQueryKey() } });
  return <AppShell role="farmer"><Title eyebrow="LOCAL DEMAND" title="Buyers around your harvest" detail="Find businesses looking for the material you already have." />
    {recs.data?.insights?.length ? <section className="mb-5 rounded-[22px] bg-[#e4e6d4] p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#737b67]">MARKET NOTES</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{recs.data.insights.slice(0, 4).map((insight, i) => <p key={insight} className="flex gap-2 text-xs leading-5 text-[#53644f]" data-testid={`recommendation-${i}`}><ArrowUpRight size={15} className="mt-0.5 shrink-0" />{insight}</p>)}</div></section> : null}
    {buyers.isLoading ? <SpinnerLine /> : buyers.isError ? <Problem error={buyers.error} retry={() => void buyers.refetch()} /> : buyers.data?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{buyers.data.map(buyer => <article className="paper-card rounded-[23px] p-5" key={buyer.id} data-testid={`buyer-card-${buyer.id}`}><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6e8d8] text-[#3e5c42]"><Factory size={20} /></span><div><h2 className="font-display text-xl text-[#2c4a36]">{buyer.companyName}</h2><p className="text-xs text-[#7b8073]">{buyer.city}, {buyer.state}</p></div>{buyer.verified && <BadgeCheck className="ml-auto text-[#5b7b54]" size={18} />}</div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f2f0e6] p-3"><p className="text-[10px] text-[#818577]">Looking for</p><p className="mt-1 text-xs font-semibold text-[#405640]">{buyer.requiredWasteTypes.join(', ')}</p></div><div className="rounded-xl bg-[#f2f0e6] p-3"><p className="text-[10px] text-[#818577]">Typical offer</p><p className="mt-1 text-xs font-semibold text-[#405640]">{money(buyer.offerPerTon)} / ton</p></div></div><div className="mt-4 flex justify-between text-[11px] text-[#71796d]"><span>{buyer.quantityNeeded.toLocaleString('en-IN')} tons sought</span><span>{buyer.distanceKm?.toFixed(1) || '—'} km away</span></div><Link href="/farmer/listings/new" className={`${secondaryBtn} mt-4 w-full`} data-testid={`link-list-for-buyer-${buyer.id}`}>List material for this demand <ArrowRight size={14} /></Link></article>)}</div> : <Empty title="No nearby buyers found." detail="As more businesses share their supply needs, they’ll show up here." action={<Link href="/farmer/listings/new" className={secondaryBtn} data-testid="link-start-listing-empty">List material anyway</Link>} />}
  </AppShell>;
}

function Notifications() {
  const query = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const mark = useMarkNotificationRead();
  return <AppShell role="farmer"><Title eyebrow="STAY IN THE LOOP" title="Notifications" detail="Updates on offers, pickups and the people finding your material." />
    {query.isLoading ? <SpinnerLine /> : query.isError ? <Problem error={query.error} retry={() => void query.refetch()} /> : query.data?.length ? <div className="space-y-3">{query.data.map(item => <article key={item.id} className={`paper-card flex gap-4 rounded-[20px] p-5 ${!item.read ? 'border-l-4 border-l-[#78905e]' : ''}`} data-testid={`notification-card-${item.id}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9ecdf] text-[#4a684b]"><Bell size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-[#34503b]" data-testid={`notification-title-${item.id}`}>{item.title}</h2>{!item.read && <Badge>New</Badge>}</div><p className="mt-1 text-xs leading-5 text-[#73796d]">{item.message}</p><p className="mt-2 text-[10px] text-[#929486]">{dateText(item.createdAt)}</p></div>{!item.read && <button className="text-[10px] font-bold text-[#4c684e]" onClick={() => mark.mutate({ notificationId: item.id }, { onSuccess: () => { invalidate(getGetNotificationsQueryKey(), getGetDashboardQueryKey()); toast.success('Marked as read.'); }, onError: e => toast.error(tx(e)) })} data-testid={`button-read-notification-${item.id}`}>Mark read</button>}</article>)}</div> : <Empty title="All caught up." detail="New offers and pickup updates will find you here." />}
  </AppShell>;
}

function SimpleDataPage({ role, type }: { role: 'farmer' | 'industry' | 'admin'; type: 'earnings' | 'impact' | 'analytics' | 'reports' | 'settings' }) {
  const dash = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const title: Record<typeof type, string> = { earnings: 'Earnings', impact: 'Your second-harvest impact', analytics: 'Sourcing analytics', reports: 'Marketplace reports', settings: 'Platform settings' };
  const metrics = type === 'earnings' ? [['Completed earnings', money(dash.data?.totalEarnings || 0)], ['Orders completed', String(dash.data?.completedOrders || 0)], ['Listings active', String(dash.data?.activeListings || 0)]] : type === 'impact' ? [['Waste put to use', `${(dash.data?.wasteReusedKg || 0).toLocaleString('en-IN')} kg`], ['Orders completed', String(dash.data?.completedOrders || 0)], ['Material listed', `${(dash.data?.totalQuantity || 0).toLocaleString('en-IN')} kg`]] : type === 'analytics' ? [['Material sourced', `${(dash.data?.totalQuantity || 0).toLocaleString('en-IN')} kg`], ['Total spend', money(dash.data?.totalSpent || 0)], ['Orders completed', String(dash.data?.completedOrders || 0)]] : [];
  return <AppShell role={role}><Title eyebrow={type === 'impact' ? 'GOOD MATERIAL IN MOTION' : 'YOUR MARKETPLACE'} title={title[type]} detail={type === 'impact' ? 'A tangible view of material finding its next use.' : 'A practical summary of your marketplace activity.'} />
    {dash.isLoading ? <SpinnerLine /> : dash.isError ? <Problem error={dash.error} retry={() => void dash.refetch()} /> : metrics.length ? <><div className="grid gap-4 sm:grid-cols-3">{metrics.map(([label, value], i) => <article key={label} className="paper-card rounded-[22px] p-6" data-testid={`summary-${type}-${i}`}><p className="text-xs text-[#7f8276]">{label}</p><p className="mt-3 font-display text-3xl text-[#294a35]">{value}</p></article>)}</div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="paper-card rounded-[24px] p-6"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#828578]">RECENT PROGRESS</p><h2 className="mt-2 font-display text-2xl text-[#2b4b35]">Every completed order counts.</h2><div className="mt-6 space-y-3">{(dash.data?.monthly || []).map(point => <div key={point.label} className="grid grid-cols-[75px_1fr_56px] items-center gap-3 text-xs"><span className="text-[#71786c]">{point.label}</span><div className="h-2 rounded-full bg-[#e8e6db]"><div className="h-2 rounded-full bg-[#799064]" style={{ width: `${Math.max(5, Math.min(100, point.value))}%` }} /></div><span className="text-right font-mono text-[10px] text-[#697364]">{point.value.toLocaleString('en-IN')}</span></div>)}</div>{!dash.data?.monthly?.length && <p className="mt-5 text-xs text-[#85897c]">Monthly activity will build here as you trade.</p>}</section><aside className="rounded-[24px] bg-[#e1e2ce] p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7f5e9] text-[#4a684c]"><Leaf size={19} /></span><h2 className="mt-5 font-display text-2xl text-[#304a35]">{type === 'analytics' ? 'A closer supply chain starts with a better local match.' : 'A second harvest is good business.'}</h2><p className="mt-3 text-sm leading-6 text-[#6c7567]">Keep making clear agreements, plan pickups ahead and bring more useful material back into circulation.</p></aside></div></> : type === 'settings' ? <section className="paper-card max-w-2xl rounded-[24px] p-6"><h2 className="font-display text-2xl text-[#294a35]">Marketplace settings</h2><p className="mt-2 text-sm leading-6 text-[#73796d]">Operational controls are managed through your AgriCycle service configuration. No unsupported settings are changed from this screen.</p><div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f0eee3] p-4 text-xs text-[#556650]"><ShieldCheck size={17} /> Sign-in protection and role permissions remain enabled.</div></section> : <Empty title="Reports are taking shape." detail="Platform totals and user activity will appear here as the marketplace grows." />}
  </AppShell>;
}

function AdminUsers() {
  const users = useGetAdminUsers({ query: { queryKey: getGetAdminUsersQueryKey() } });
  const verify = useSetUserVerification();
  return <AppShell role="admin"><Title eyebrow="COMMUNITY CARE" title="Marketplace users" detail="Review participant profiles and verification status." />
    {users.isLoading ? <SpinnerLine /> : users.isError ? <Problem error={users.error} retry={() => void users.refetch()} /> : users.data?.length ? <div className="overflow-hidden rounded-[22px] border border-[#e0dccf] bg-[#fbfaf5]"><div className="hidden grid-cols-[1.4fr_1fr_.8fr_.7fr] gap-4 bg-[#eeece1] px-5 py-3 font-mono text-[9px] uppercase tracking-[.13em] text-[#818477] md:grid"><span>Participant</span><span>Location</span><span>Role</span><span>Status</span></div>{users.data.map((user: Profile) => <div key={user.id} className="grid gap-3 border-t border-[#ece9df] px-5 py-4 md:grid-cols-[1.4fr_1fr_.8fr_.7fr] md:items-center" data-testid={`admin-user-${user.id}`}><div><p className="text-sm font-semibold text-[#34503b]">{user.name}</p><p className="text-[11px] text-[#83877a]">{user.email}</p></div><span className="text-xs text-[#687266]">{user.city}, {user.state}</span><span className="text-xs capitalize text-[#687266]">{user.role}</span><button className={`${user.verified ? 'text-[#58714f]' : 'text-[#8b672c]'} flex items-center gap-1 text-xs font-semibold`} onClick={() => verify.mutate({ profileId: user.id, data: { verified: !user.verified } }, { onSuccess: () => { toast.success(user.verified ? 'Verification removed.' : 'Participant verified.'); invalidate(getGetAdminUsersQueryKey(), getGetProfileQueryKey(user.id)); }, onError: e => toast.error(tx(e)) })} disabled={verify.isPending} data-testid={`button-verify-user-${user.id}`}>{user.verified ? <><BadgeCheck size={14} /> Verified · remove</> : <><ShieldCheck size={14} /> Verify profile</>}</button></div>)}</div> : <Empty title="No participants to review." detail="New marketplace profiles will be listed here." />}
  </AppShell>;
}
function AdminDashboard() {
  const stats = useGetAdminStatistics({ query: { queryKey: getGetAdminStatisticsQueryKey() } });
  return <AppShell role="admin"><Title eyebrow="PLATFORM OVERVIEW" title="The cycle, at platform scale." detail="A live view of the AgriCycle marketplace." action={<Link href="/admin/users" className={primaryBtn} data-testid="button-review-people"><Users size={16} /> Review participants</Link>} />
    {stats.isLoading ? <SpinnerLine /> : stats.isError ? <Problem error={stats.error} retry={() => void stats.refetch()} /> : stats.data ? <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Participants', stats.data.totalUsers], ['Farmers', stats.data.farmers], ['Industry buyers', stats.data.industries], ['Active listings', stats.data.listings], ['Orders', stats.data.orders], ['Material reused', `${stats.data.wasteReusedKg.toLocaleString('en-IN')} kg`], ['Transactions', stats.data.transactions]].map(([label, value], i) => <article className="paper-card rounded-2xl p-5" key={label} data-testid={`admin-stat-${i}`}><p className="text-xs text-[#828578]">{label}</p><p className="mt-3 font-display text-3xl text-[#2b4b35]">{value}</p></article>)}</div><section className="paper-card mt-6 rounded-[24px] p-5"><div className="flex items-center justify-between"><h2 className="font-display text-2xl text-[#2b4b35]">New to the cycle</h2><Link href="/admin/users" className="text-xs font-semibold text-[#526a4f]" data-testid="link-admin-users">View participants</Link></div><div className="mt-4 grid gap-3 md:grid-cols-2">{stats.data.recentUsers.map(user => <div key={user.id} className="flex items-center gap-3 rounded-xl bg-[#f1efe5] p-3" data-testid={`recent-user-${user.id}`}><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e2e7d9] font-display text-lg text-[#476047]">{user.name[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#405541]">{user.name}</p><p className="text-[10px] text-[#83877b]">{user.city} · {user.role}</p></div><Badge tone={statusTone(user.verified ? 'verified' : 'pending')}>{user.verified ? 'verified' : 'review'}</Badge></div>)}</div></section></> : <Empty title="Statistics are not available." detail="Try again when the marketplace is reachable." />}
  </AppShell>;
}

function NotFoundPage() {
  return <div className="grain flex min-h-[100dvh] flex-col bg-[#f4f1e7]"><PublicNav /><main className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-8 px-5 py-14 md:grid-cols-[.8fr_1.2fr] md:px-10"><div><p className="font-mono text-xs uppercase tracking-[.23em] text-[#849076]">FIELD NOTE 404</p><h1 className="mt-3 font-display text-7xl tracking-[-.07em] text-[#294a35]">No path<br /><span className="italic text-[#8a8d65]">grows here.</span></h1><p className="mt-5 max-w-md text-sm leading-6 text-[#737a6c]">That address may have moved, or the field may not exist yet. Let’s get you back to the cycle.</p><div className="mt-6 flex flex-wrap gap-2"><Link href="/" className={primaryBtn} data-testid="link-404-home"><ArrowRight className="rotate-180" size={15} /> Back to home</Link><Link href="/marketplace" className={secondaryBtn} data-testid="link-404-marketplace">Browse material</Link></div></div><div className="relative mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-[34px] bg-[#e5e1cf]"><div className="absolute inset-x-[-12%] bottom-[-2%] h-[65%] rotate-[-10deg] rounded-[50%] bg-[#758459]" /><div className="absolute inset-x-[-18%] bottom-[-20%] h-[60%] rotate-[9deg] rounded-[50%] bg-[#35583c]" /><div className="absolute left-[13%] top-[17%] text-[#5f7a52]"><Wheat size={160} strokeWidth={.75} /></div><span className="absolute bottom-8 right-8 rounded-xl bg-[#faf7e9] px-4 py-2 font-mono text-2xl text-[#476044]">404</span></div></main><Footer /></div>;
}
function ProfilePage() {
  const profileQuery = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), retry: false } });
  const publicProfile = useGetProfile(profileQuery.data?.id || 0, { query: { queryKey: getGetProfileQueryKey(profileQuery.data?.id || 0), enabled: !!profileQuery.data?.id } });
  const reviewsQuery = useGetProfileReviews(profileQuery.data?.id || 0, { query: { queryKey: getGetProfileReviewsQueryKey(profileQuery.data?.id || 0), enabled: !!profileQuery.data?.id } });
  const save = useSaveMyProfile();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  useEffect(() => { if (profileQuery.data) { setName(profileQuery.data.name); setPhone(profileQuery.data.phone || ''); setCity(profileQuery.data.city); setState(profileQuery.data.state); } }, [profileQuery.data]);
  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = profileQuery.data;
    if (!profile || name.trim().length < 2 || phone.trim().length < 7 || city.trim().length < 2 || state.trim().length < 2) { toast.error('Please check your name, phone and location.'); return; }
    const body: ProfileInput = { name, phone, role: profile.role === 'admin' ? 'farmer' : profile.role, city, state, farmSize: profile.farmSize, companyName: profile.companyName, industryType: profile.industryType, requiredWasteTypes: profile.requiredWasteTypes };
    save.mutate({ data: body }, { onSuccess: () => { toast.success('Profile updated.'); setEdit(false); invalidate(getGetMyProfileQueryKey()); }, onError: e => toast.error(tx(e)) });
  }
  if (profileQuery.isLoading) return <div className="min-h-[100dvh] bg-[#f4f1e7] p-10"><SpinnerLine /></div>;
  if (profileQuery.isError) return <AppShell role="farmer"><Problem error={profileQuery.error} retry={() => void profileQuery.refetch()} /></AppShell>;
  if (!profileQuery.data) return <Redirect to="/setup" />;
  const profile = profileQuery.data;
  return <AppShell role={profile.role === 'admin' ? 'admin' : profile.role}><Title eyebrow="YOUR ACCOUNT" title="Your profile" detail="The details that help the right people find you." action={!edit ? <button className={secondaryBtn} onClick={() => setEdit(true)} data-testid="button-edit-profile">Edit details</button> : null} />
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="paper-card rounded-[24px] p-6"><div className="flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#e2e8dc] font-display text-3xl text-[#416048]">{profile.name[0]}</span><div><h2 className="font-display text-2xl text-[#2b4b36]" data-testid="text-profile-name">{profile.name}</h2><p className="text-xs capitalize text-[#7b8174]">{profile.role} · {profile.city}, {profile.state}</p></div></div><div className="mt-6 space-y-3 border-t border-[#ebe8dd] pt-5 text-sm"><p><span className="text-[#898c80]">Email </span><strong className="ml-2 font-medium text-[#435644]">{profile.email}</strong></p><p><span className="text-[#898c80]">Phone </span><strong className="ml-2 font-medium text-[#435644]">{profile.phone || 'Not added'}</strong></p>{profile.companyName && <p><span className="text-[#898c80]">Business </span><strong className="ml-2 font-medium text-[#435644]">{profile.companyName}</strong></p>}{profile.farmSize && <p><span className="text-[#898c80]">Farm size </span><strong className="ml-2 font-medium text-[#435644]">{profile.farmSize} acres</strong></p>}<p className="flex items-center gap-2"><span className="text-[#898c80]">Verification </span><Badge tone={statusTone(profile.verified ? 'verified' : 'pending')}>{profile.verified ? 'verified' : 'not yet verified'}</Badge></p></div>
      {edit && <form className="mt-6 space-y-3 border-t border-[#ebe8dd] pt-5" onSubmit={updateProfile} data-testid="form-edit-profile">{[['Name', name, setName, 'name'], ['Phone number', phone, setPhone, 'phone'], ['City', city, setCity, 'city'], ['State', state, setState, 'state']].map(([label, val, setter, key]) => <label key={String(key)} className="block text-xs font-semibold text-[#596657]">{String(label)}<input className={`${inputClass} mt-1`} value={String(val)} onChange={e => (setter as (value: string) => void)(e.target.value)} required data-testid={`input-profile-${String(key)}`} /></label>)}<div className="flex gap-2"><button className={primaryBtn} type="submit" disabled={save.isPending} data-testid="button-save-profile">Save profile</button><button className={secondaryBtn} type="button" onClick={() => setEdit(false)} data-testid="button-cancel-profile">Cancel</button></div></form>}
    </section><section className="paper-card rounded-[24px] p-6"><p className="font-mono text-[9px] uppercase tracking-[.17em] text-[#888a7d]">COMMUNITY REPUTATION</p><h2 className="mt-2 font-display text-2xl text-[#2b4b36]">Trade built on trust</h2><p className="mt-2 text-sm text-[#73796d]">Average rating <strong className="text-[#35513b]">{(publicProfile.data?.rating ?? profile.rating).toFixed(1)} / 5</strong></p>
      {reviewsQuery.isLoading ? <div className="mt-5"><SpinnerLine /></div> : reviewsQuery.isError ? <Problem error={reviewsQuery.error} retry={() => void reviewsQuery.refetch()} /> : reviewsQuery.data?.length ? <div className="mt-5 space-y-3">{reviewsQuery.data.map(review => <article key={review.id} className="rounded-xl bg-[#f2f0e7] p-4" data-testid={`review-${review.id}`}><p className="text-sm leading-6 text-[#5f6d5c]">“{review.comment}”</p><div className="mt-2 flex justify-between text-[10px] text-[#82877a]"><span>{review.fromName}</span><span>{review.rating} / 5 · {dateText(review.createdAt)}</span></div></article>)}</div> : <div className="mt-5 rounded-xl bg-[#f2f0e7] p-5 text-center text-xs text-[#7d8276]">Your marketplace reviews will appear after completed orders.</div>}
    </section></div>
  </AppShell>;
}

function SetupProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const profile = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), enabled: !!isSignedIn, retry: false } });
  const save = useSaveMyProfile();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<'farmer' | 'industry'>('farmer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [required, setRequired] = useState<string[]>([]);
  useEffect(() => { if (user) setName(`${user.firstName || ''} ${user.lastName || ''}`.trim()); }, [user]);
  if (!isLoaded) return <div className="min-h-[100dvh] bg-[#f4f1e7] p-10"><SpinnerLine /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (profile.data) return <Redirect to={`/${profile.data.role}/dashboard`} />;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 7 || city.trim().length < 2 || state.trim().length < 2 || (role === 'industry' && companyName.trim().length < 2)) { toast.error('Please complete the required profile details.'); return; }
    const data: ProfileInput = { name, phone, role, city, state, farmSize: role === 'farmer' ? Number(farmSize) || null : null, companyName: role === 'industry' ? companyName : null, industryType: role === 'industry' ? industryType : null, requiredWasteTypes: role === 'industry' ? required : [] };
    save.mutate({ data }, { onSuccess: result => { toast.success('Your marketplace profile is ready.'); invalidate(getGetMyProfileQueryKey()); setLocation(`/${result.role}/dashboard`); }, onError: e => toast.error(tx(e)) });
  }
  return <div className="grain min-h-[100dvh] bg-[#f4f1e7] px-4 py-6"><div className="mx-auto max-w-[850px]"><Brand /><div className="mt-8 grid gap-5 md:grid-cols-[.7fr_1.3fr]">
    <aside className="rounded-[24px] bg-[#254936] p-6 text-[#f7f4e8]"><span className="font-mono text-[9px] uppercase tracking-[.2em] text-[#c9d2b9]">WELCOME TO THE CYCLE</span><h1 className="mt-4 font-display text-4xl leading-tight">First, let’s get to know your work.</h1><p className="mt-4 text-sm leading-6 text-[#d6ddcf]">This profile helps match growers with buyers who are close enough to make a practical pickup.</p><div className="mt-8 border-t border-white/20 pt-5 text-xs text-[#c9d2bf]">You can update your details any time.</div></aside>
    <form onSubmit={submit} className="paper-card rounded-[24px] p-6 md:p-8" data-testid="form-profile-setup"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#878a7c]">YOUR MARKETPLACE PROFILE</p><h2 className="mt-2 font-display text-2xl text-[#2d4c37]">Which side are you on?</h2><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className={`rounded-xl border p-4 text-left ${role === 'farmer' ? 'border-[#648164] bg-[#edf1e6]' : 'border-[#e1ddcf]'}`} onClick={() => setRole('farmer')} data-testid="button-role-farmer"><Wheat size={20} /><strong className="mt-2 block text-sm">I grow</strong><small className="text-[10px] text-[#818577]">Sell my crop residue</small></button><button type="button" className={`rounded-xl border p-4 text-left ${role === 'industry' ? 'border-[#648164] bg-[#edf1e6]' : 'border-[#e1ddcf]'}`} onClick={() => setRole('industry')} data-testid="button-role-industry"><Factory size={20} /><strong className="mt-2 block text-sm">I make</strong><small className="text-[10px] text-[#818577]">Source reusable material</small></button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{[['Full name', name, setName, 'name'], ['Phone number', phone, setPhone, 'phone'], ['City / district', city, setCity, 'city'], ['State', state, setState, 'state']].map(([label, val, setter, key]) => <label key={String(key)} className="text-xs font-semibold text-[#596657]">{String(label)}<input className={`${inputClass} mt-1`} value={String(val)} onChange={e => (setter as (value: string) => void)(e.target.value)} required data-testid={`setup-${String(key)}`} /></label>)}</div>
      {role === 'farmer' ? <label className="mt-3 block text-xs font-semibold text-[#596657]">Farm size in acres <input className={`${inputClass} mt-1`} type="number" min="0" step="any" value={farmSize} onChange={e => setFarmSize(e.target.value)} placeholder="Optional" data-testid="setup-farm-size" /></label> : <div className="mt-3 space-y-3"><label className="block text-xs font-semibold text-[#596657]">Company name<input className={`${inputClass} mt-1`} required value={companyName} onChange={e => setCompanyName(e.target.value)} data-testid="setup-company-name" /></label><label className="block text-xs font-semibold text-[#596657]">Industry type<input className={`${inputClass} mt-1`} value={industryType} onChange={e => setIndustryType(e.target.value)} placeholder="Paper, packaging, energy…" data-testid="setup-industry-type" /></label><div><p className="text-xs font-semibold text-[#596657]">Materials you need</p><div className="mt-2 flex flex-wrap gap-2">{wasteTypes.map(waste => <button type="button" key={waste} onClick={() => setRequired(required.includes(waste) ? required.filter(item => item !== waste) : [...required, waste])} className={`rounded-full border px-3 py-1.5 text-[10px] ${required.includes(waste) ? 'border-[#547253] bg-[#e7eddf] text-[#385c3d]' : 'border-[#dedaca] text-[#71776b]'}`} data-testid={`button-required-${waste.toLowerCase().replaceAll(' ', '-')}`}>{waste}</button>)}</div></div></div>}
      <button className={`${primaryBtn} mt-6 w-full`} disabled={save.isPending} data-testid="button-save-setup">{save.isPending ? 'Setting up your profile…' : 'Continue to AgriCycle'} <ArrowRight size={15} /></button>
    </form></div></div></div>;
}

function AppRoutes() {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useUser();
  const isPrivate = location === '/setup' || location === '/profile' || /^\/(farmer|industry|admin)\//.test(location);
  const profile = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey(), enabled: isPrivate && !!isSignedIn, retry: false } });
  if (isPrivate && !isLoaded) return <div className="min-h-[100dvh] bg-[#f4f1e7] p-6"><div className="mx-auto max-w-3xl"><SpinnerLine label="Checking your session" /></div></div>;
  if (isPrivate && !isSignedIn) return <Redirect to="/sign-in" />;
  if (isPrivate && isSignedIn && profile.isLoading) return <div className="min-h-[100dvh] bg-[#f4f1e7] p-6"><div className="mx-auto max-w-3xl"><SpinnerLine label="Loading your marketplace profile" /></div></div>;
  if (isPrivate && isSignedIn && profile.isError) return <div className="min-h-[100dvh] bg-[#f4f1e7] p-6"><div className="mx-auto max-w-3xl"><Problem error={profile.error} retry={() => void profile.refetch()} /></div></div>;
  if (isPrivate && isSignedIn && location !== '/setup' && !profile.data) return <Redirect to="/setup" />;
  if (location === '/setup' && profile.data) return <Redirect to={`/${profile.data.role}/dashboard`} />;
  const roleRoute = location.match(/^\/(farmer|industry|admin)\//)?.[1];
  if (roleRoute && profile.data && profile.data.role !== roleRoute) return <Redirect to={`/${profile.data.role}/dashboard`} />;
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/marketplace" component={() => <Marketplace path="/marketplace" />} />
    <Route path="/about" component={() => <InfoPage kind="about" />} />
    <Route path="/how-it-works" component={() => <InfoPage kind="how" />} />
    <Route path="/sign-in/*?" component={() => <AuthPage mode="sign-in" />} />
    <Route path="/sign-up/*?" component={() => <AuthPage mode="sign-up" />} />
    <Route path="/setup" component={SetupProfile} />
    <Route path="/farmer/dashboard" component={() => <Dashboard role="farmer" />} />
    <Route path="/farmer/listings" component={() => <Marketplace role="farmer" path="/farmer/listings" />} />
    <Route path="/farmer/listings/new" component={NewListing} />
    <Route path="/farmer/offers" component={() => <Offers role="farmer" />} />
    <Route path="/farmer/orders" component={() => <Orders role="farmer" />} />
    <Route path="/farmer/earnings" component={() => <SimpleDataPage role="farmer" type="earnings" />} />
    <Route path="/farmer/buyers" component={BuyerDirectory} />
    <Route path="/farmer/notifications" component={Notifications} />
    <Route path="/farmer/impact" component={() => <SimpleDataPage role="farmer" type="impact" />} />
    <Route path="/industry/dashboard" component={() => <Dashboard role="industry" />} />
    <Route path="/industry/marketplace" component={() => <Marketplace role="industry" path="/industry/marketplace" />} />
    <Route path="/industry/offers" component={() => <Offers role="industry" />} />
    <Route path="/industry/orders" component={() => <Orders role="industry" />} />
    <Route path="/industry/suppliers" component={() => <Marketplace role="industry" path="/industry/suppliers" />} />
    <Route path="/industry/analytics" component={() => <SimpleDataPage role="industry" type="analytics" />} />
    <Route path="/admin/dashboard" component={AdminDashboard} />
    <Route path="/admin/users" component={AdminUsers} />
    <Route path="/admin/listings" component={() => <Marketplace role="industry" path="/admin/listings" />} />
    <Route path="/admin/orders" component={() => <Orders role="industry" />} />
    <Route path="/admin/reports" component={() => <SimpleDataPage role="admin" type="reports" />} />
    <Route path="/admin/settings" component={() => <SimpleDataPage role="admin" type="settings" />} />
    <Route path="/profile" component={ProfilePage} />
    <Route component={NotFoundPage} />
  </Switch></ErrorBoundary>;
}
function ClerkCacheBridge() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const userId = user?.id ?? null;
    if (previousUser.current !== undefined && previousUser.current !== userId) client.clear();
    previousUser.current = userId;
  }), [addListener, client]);
  return null;
}
function ClerkApp() {
  const [, setLocation] = useLocation();
  const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={enUS}
    routerPush={(to) => { queryClient.clear(); setLocation(stripBase(to)); }}
    routerReplace={(to) => { queryClient.clear(); setLocation(stripBase(to), { replace: true }); }}
  ><ClerkCacheBridge /><AppRoutes /></ClerkProvider>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><ClerkApp /></WouterRouter><Toaster richColors position="top-right" /></TooltipProvider></QueryClientProvider>;
}

export default App;
