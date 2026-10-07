// AgriCycle - Frontend Application Engine
// Comprehensive full-featured agricultural waste marketplace

(function () {
  'use strict';

  // 1. Initial State & Storage
  const STORAGE_KEY = 'agricycle_state_v1';

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    // Default initial seed state
    return {
      currentUser: SEED_USERS[0], // Start logged in as Demo Farmer (Ramesh Patel)
      users: [...SEED_USERS],
      listings: [...SEED_LISTINGS],
      offers: [...SEED_OFFERS],
      orders: [...SEED_ORDERS],
      notifications: [...SEED_NOTIFICATIONS],
      reviews: [...SEED_REVIEWS],
      favorites: [101, 102],
      judgeStep: 1,
      judgeActive: true,
      lang: 'en' // 'en', 'te', 'hi'
    };
  }

  let state = loadState();
  state.lang = state.lang || 'en';

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function resetState() {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    showToast('Demo data reset to original seed state', 'info');
    navigate(window.location.hash || '#/');
  }

  // 2. Helpers, Translations & Voice Utilities
  function t(key) {
    const currentLang = state.lang || 'en';
    const dict = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) ? TRANSLATIONS[currentLang] : (typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS['en'] : {});
    return (dict && dict[key]) || (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) || key;
  }

  function formatMoney(amount) {
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(iso) {
    if (!iso) return 'To be agreed';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getPriceLimits(wasteType) {
    const limits = typeof PRICE_LIMITS !== 'undefined' ? PRICE_LIMITS : {};
    return limits[wasteType] || { min: 1800, max: 4000, fairRecommended: 2800, unit: 'ton' };
  }

  function checkPriceSafety(wasteType, price) {
    const bounds = getPriceLimits(wasteType);
    const p = Number(price);
    if (!p || p <= 0) return { status: 'invalid', message: 'Enter a valid price' };
    if (p < bounds.min) {
      return {
        status: 'low',
        badge: '⚠️ Below Mandi Limit (Too Low)',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        message: `₹${p.toLocaleString('en-IN')}/ton is below minimum harvesting cost (Min: ₹${bounds.min.toLocaleString('en-IN')}). Don't undersell!`
      };
    }
    if (p > bounds.max) {
      return {
        status: 'high',
        badge: '⚠️ Exceeds Mill Purchase Cap',
        color: 'text-red-800 bg-red-50 border-red-300',
        message: `₹${p.toLocaleString('en-IN')}/ton exceeds standard mill procurement cap (Max: ₹${bounds.max.toLocaleString('en-IN')}). Buyers may hesitate.`
      };
    }
    return {
      status: 'safe',
      badge: '✓ Fair Mandi Price Zone',
      color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
      message: `Optimal fair price! Fair return for farmer and within buyer procurement bounds.`
    };
  }

  let isSpeaking = false;
  function toggleVoiceSpeech(textToRead) {
    if (!('speechSynthesis' in window)) {
      showToast('Voice speech is not supported in this browser', 'info');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      showToast('Audio stopped', 'info');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    if (state.lang === 'hi') utterance.lang = 'hi-IN';
    else if (state.lang === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-IN';

    utterance.onstart = () => {
      isSpeaking = true;
      showToast(t('voiceReading'), 'info');
    };
    utterance.onend = () => {
      isSpeaking = false;
    };
    utterance.onerror = () => {
      isSpeaking = false;
    };
    window.speechSynthesis.speak(utterance);
  }

  function shareOnWhatsapp(title, qty, price, location) {
    const text = encodeURIComponent(
      `🌾 *AgriCycle Farm Deal* 🚜\n` +
      `• Material: ${title}\n` +
      `• Quantity: ${qty} (${(qty/3.5).toFixed(1)} Tractor Trolleys)\n` +
      `• Fair Price: ₹${price}/Ton\n` +
      `• Location: ${location}\n` +
      `• 0% Platform Commission · Direct Farmer Sale\n` +
      `View on AgriCycle: http://localhost:3000/#/marketplace`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast border-l-4 ${type === 'error' ? 'border-red-500' : type === 'info' ? 'border-amber-500' : 'border-brand-900'}`;
    const icon = type === 'error' ? 'alert-circle' : type === 'info' ? 'info' : 'check-circle-2';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <i data-lucide="${icon}" class="w-5 h-5 ${type === 'error' ? 'text-red-600' : type === 'info' ? 'text-amber-600' : 'text-brand-900'}"></i>
        <div class="text-sm font-medium text-gray-800">${message}</div>
      </div>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // 3. Simple Router
  function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  }

  function navigate(path) {
    if (!path.startsWith('#')) path = '#' + path;
    window.location.hash = path;
  }

  window.addEventListener('hashchange', () => {
    renderApp();
  });

  // 4. Modal Engine
  function showModal(contentHtml) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-content p-6 relative" id="modal-box">
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg" id="modal-close-btn">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
          ${contentHtml}
        </div>
      </div>
    `;
    lucide.createIcons();
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-backdrop').onclick = (e) => {
      if (e.target.id === 'modal-backdrop') closeModal();
    };
  }

  function closeModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
  }

  // 5. Navigation Bar Component with Kisan Topbar & Vernacular Support
  function renderNavbar() {
    const u = state.currentUser;
    const unreadCount = state.notifications.filter(n => !n.read && (!u || n.userId === u.id)).length;

    let roleLinks = '';
    if (u) {
      if (u.role === 'farmer') {
        roleLinks = `
          <a href="#/farmer/dashboard" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Dashboard</a>
          <a href="#/farmer/listings" class="text-sm font-semibold hover:text-brand-900 text-brand-700">My Listings</a>
          <a href="#/farmer/offers" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Offers</a>
          <a href="#/farmer/orders" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Orders & Pickups</a>
          <a href="#/farmer/earnings" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Earnings</a>
          <a href="#/farmer/buyers" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Nearby Buyers</a>
        `;
      } else if (u.role === 'industry') {
        roleLinks = `
          <a href="#/industry/dashboard" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Dashboard</a>
          <a href="#/industry/marketplace" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Find Waste</a>
          <a href="#/industry/offers" class="text-sm font-semibold hover:text-brand-900 text-brand-700">My Offers</a>
          <a href="#/industry/orders" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Orders</a>
          <a href="#/industry/suppliers" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Suppliers</a>
          <a href="#/industry/analytics" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Analytics</a>
        `;
      } else if (u.role === 'admin') {
        roleLinks = `
          <a href="#/admin/dashboard" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Overview</a>
          <a href="#/admin/users" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Users</a>
          <a href="#/admin/listings" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Listings</a>
          <a href="#/admin/orders" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Orders</a>
          <a href="#/admin/settings" class="text-sm font-semibold hover:text-brand-900 text-brand-700">Settings</a>
        `;
      }
    }

    return `
      <!-- Kisan Rural Support & Language Ribbon -->
      <div class="bg-brand-950 text-white/90 text-[11px] py-1.5 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 border-b border-white/10">
        <div class="flex items-center gap-3 font-medium">
          <span class="flex items-center gap-1 text-harvest font-bold">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> ${t('zeroCommission')}
          </span>
          <span class="hidden sm:inline text-white/30">|</span>
          <span class="flex items-center gap-1 text-white/80">
            <i data-lucide="phone-call" class="w-3 h-3 text-sprout"></i> ${t('kisanHelpline')}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Voice Audio Assistant Button -->
          <button onclick="window.AgriCycle.readCurrentPage()" class="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-harvest font-bold flex items-center gap-1 text-[10px] transition" title="${t('voiceAssistant')}">
            <i data-lucide="volume-2" class="w-3 h-3"></i> ${t('voiceAssistant')}
          </button>
          <!-- Language Selector -->
          <div class="flex items-center bg-white/10 rounded-full p-0.5 text-[10px]">
            <button onclick="window.AgriCycle.setLang('en')" class="px-2 py-0.5 rounded-full font-bold transition ${state.lang === 'en' ? 'bg-harvest text-brand-950' : 'text-white/80 hover:text-white'}">EN</button>
            <button onclick="window.AgriCycle.setLang('te')" class="px-2 py-0.5 rounded-full font-bold transition ${state.lang === 'te' ? 'bg-harvest text-brand-950' : 'text-white/80 hover:text-white'}">తెలుగు</button>
            <button onclick="window.AgriCycle.setLang('hi')" class="px-2 py-0.5 rounded-full font-bold transition ${state.lang === 'hi' ? 'bg-harvest text-brand-950' : 'text-white/80 hover:text-white'}">हिन्दी</button>
          </div>
        </div>
      </div>

      <header class="glass-header sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <a href="#/" class="flex items-center gap-2 text-brand-900 font-extrabold text-xl tracking-tight" id="nav-brand">
            <span class="w-8 h-8 rounded-xl bg-brand-900 text-harvest flex items-center justify-center shadow-sm">
              <i data-lucide="sprout" class="w-5 h-5"></i>
            </span>
            <span>Agri<span class="text-sprout italic">Cycle</span></span>
          </a>
          <nav class="hidden lg:flex items-center gap-5">
            <a href="#/marketplace" class="text-sm font-medium text-gray-700 hover:text-brand-900">Marketplace</a>
            <a href="#/how-it-works" class="text-sm font-medium text-gray-700 hover:text-brand-900">How It Works</a>
            <a href="#/about" class="text-sm font-medium text-gray-700 hover:text-brand-900">Impact & Purpose</a>
            ${roleLinks ? `<div class="h-4 w-px bg-gray-300"></div>` + roleLinks : ''}
          </nav>
        </div>

        <div class="flex items-center gap-3">
          ${u ? `
            <!-- Notifications Icon -->
            <a href="#/${u.role}/notifications" class="relative p-2 text-gray-600 hover:text-brand-900 rounded-xl hover:bg-black/5" title="Notifications" id="btn-notifications">
              <i data-lucide="bell" class="w-5 h-5"></i>
              ${unreadCount > 0 ? `<span class="absolute top-1 right-1 w-4 h-4 bg-harvest text-brand-950 font-bold text-[10px] rounded-full flex items-center justify-center">${unreadCount}</span>` : ''}
            </a>

            <!-- User Menu / Quick Role Switcher -->
            <div class="flex items-center gap-2 bg-white/80 border border-brand-200/60 rounded-full pl-2 pr-3 py-1 shadow-sm">
              <span class="w-7 h-7 rounded-full bg-brand-900 text-white font-bold text-xs flex items-center justify-center">
                ${u.name.charAt(0)}
              </span>
              <div class="text-left hidden sm:block">
                <span class="text-xs font-bold text-brand-900 block leading-none">${u.name.split(' ')[0]}</span>
                <span class="text-[10px] font-semibold text-sprout uppercase tracking-wider block">${u.role}</span>
              </div>
              <button onclick="window.AgriCycle.switchRole()" class="ml-1 text-xs text-gray-500 hover:text-brand-900 px-1 py-0.5 rounded border border-gray-200 bg-gray-50" title="Switch between Farmer / Industry / Admin">
                Switch
              </button>
              <button onclick="window.AgriCycle.logout()" class="text-gray-400 hover:text-red-600 p-1" title="Sign out">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : `
            <a href="#/login" class="text-sm font-semibold text-brand-900 px-3 py-2 rounded-xl hover:bg-black/5" id="btn-login-nav">Log In</a>
            <a href="#/register" class="btn-primary text-xs md:text-sm !py-2 !px-4" id="btn-register-nav">
              Join AgriCycle <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
          `}
        </div>
      </header>
    `;
  }


  // 6. Landing Page
  function renderLanding() {
    const activeListings = state.listings.filter(l => l.status === 'available').length;
    const totalTons = state.listings.reduce((acc, l) => acc + Number(l.quantity), 0);
    const co2SavedTons = Math.round(totalTons * 1.5);

    return `
      ${renderNavbar()}
      <main class="flex-1">
        <!-- Hero Section -->
        <section class="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-16 md:pt-16 md:pb-24 grid md:grid-cols-12 gap-10 items-center">
          <div class="md:col-span-7 space-y-6 text-left">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-900 text-xs font-bold border border-brand-200">
              <span class="w-2 h-2 rounded-full bg-sprout animate-pulse"></span>
              Official Problem Statement: India Agricultural Waste Marketplace
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-900 leading-[1.08]">
              Turn Agricultural Waste into <span class="text-sprout underline decoration-harvest decoration-wavy">Opportunity.</span>
            </h1>
            <p class="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl">
              Connect farmers who have crop residues like straw, husks, and bagasse directly with industries ready to purchase and reuse them. Stop open field burning, cut industrial raw material costs, and build a circular harvest.
            </p>
            <div class="flex flex-wrap gap-3 pt-2">
              <a href="#/farmer/listings/new" class="btn-primary text-base !py-3 !px-6 shadow-md" id="hero-btn-sell">
                <i data-lucide="upload" class="w-4 h-4"></i> Start Selling Residue
              </a>
              <a href="#/marketplace" class="btn-secondary text-base !py-3 !px-6" id="hero-btn-buy">
                <i data-lucide="search" class="w-4 h-4"></i> Find Agricultural Waste
              </a>
            </div>

            <!-- Trust / Stats Bar -->
            <div class="grid grid-cols-3 gap-4 pt-6 border-t border-brand-200/60 max-w-lg">
              <div>
                <span class="text-2xl font-extrabold text-brand-900 block">${activeListings}+</span>
                <span class="text-xs text-gray-600 font-medium">Active Lots Ready</span>
              </div>
              <div>
                <span class="text-2xl font-extrabold text-brand-900 block">${totalTons.toLocaleString('en-IN')} T</span>
                <span class="text-xs text-gray-600 font-medium">Biomass Listed</span>
              </div>
              <div>
                <span class="text-2xl font-extrabold text-sprout block">${co2SavedTons.toLocaleString('en-IN')} T</span>
                <span class="text-xs text-gray-600 font-medium">CO₂ Burning Avoided</span>
              </div>
            </div>
          </div>

          <!-- Hero Image & AI Preview Showcase -->
          <div class="md:col-span-5 relative">
            <div class="glass-card overflow-hidden rounded-3xl p-3 shadow-xl bg-white border border-brand-200">
              <div class="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img src="/hero_banner.jpg" alt="Harvest" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20"></div>
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-brand-900 shadow">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-harvest"></i> AI Vision Verified
                </div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs uppercase tracking-wider text-harvest font-bold">Rice Straw Bales</span>
                      <h4 class="text-lg font-bold">30 Tons · Ready in Kadapa</h4>
                    </div>
                    <div class="text-right">
                      <span class="text-xl font-extrabold text-white">₹2,100</span>
                      <span class="text-xs text-white/80 block">/ ton</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Floating AI Feature Callout -->
              <div class="mt-3 p-3 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-brand-900 text-harvest flex items-center justify-center shrink-0">
                  <i data-lucide="cpu" class="w-5 h-5"></i>
                </div>
                <div class="text-xs">
                  <strong class="text-brand-900 block">AI Automated Valuation & Waste Scan</strong>
                  <span class="text-gray-600">Snap a photo to classify material and get local fair market prices.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- How It Works Section -->
        <section class="bg-white border-y border-brand-200/60 py-16 px-4 md:px-8">
          <div class="max-w-6xl mx-auto text-center space-y-12">
            <div>
              <span class="text-xs uppercase font-extrabold tracking-widest text-sprout">Clear Two-Sided Trade</span>
              <h2 class="text-3xl sm:text-4xl font-extrabold text-brand-900 mt-2">How AgriCycle Works</h2>
              <p class="text-gray-600 max-w-xl mx-auto mt-2 text-sm sm:text-base">Connecting farms and factories in 4 simple transparent steps.</p>
            </div>

            <div class="grid md:grid-cols-2 gap-8 text-left">
              <!-- Farmer Steps -->
              <div class="bg-brand-50/70 p-6 rounded-2xl border border-brand-100 space-y-4">
                <div class="flex items-center gap-2 text-brand-900 font-bold text-lg pb-2 border-b border-brand-200">
                  <i data-lucide="wheat" class="w-5 h-5 text-harvest"></i> For Farmers
                </div>
                <div class="grid gap-3">
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-brand-900 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Upload Residue Photo</strong>
                      <p class="text-xs text-gray-600">Take a photo from your phone. AI detects residue type and moisture.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-brand-900 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Get AI Suggested Pricing</strong>
                      <p class="text-xs text-gray-600">See benchmark prices in your district so you never undersell.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-brand-900 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Review & Accept Offers</strong>
                      <p class="text-xs text-gray-600">Nearby bioenergy and paper mills send offers. Accept or counter.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-brand-900 text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Arrange Pickup & Get Paid</strong>
                      <p class="text-xs text-gray-600">Buyer brings transport directly to your field gate. Guaranteed payment.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Industry Steps -->
              <div class="bg-brand-50/70 p-6 rounded-2xl border border-brand-100 space-y-4">
                <div class="flex items-center gap-2 text-brand-900 font-bold text-lg pb-2 border-b border-brand-200">
                  <i data-lucide="factory" class="w-5 h-5 text-sprout"></i> For Industries & Buyers
                </div>
                <div class="grid gap-3">
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-sprout text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Search by Waste Type & Radius</strong>
                      <p class="text-xs text-gray-600">Filter within 25 km, 50 km, or 100 km to cut transport costs.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-sprout text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Verified Farmer Listings</strong>
                      <p class="text-xs text-gray-600">Inspect verified quality, moisture specs, and seller ratings.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-sprout text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Submit Offer or Instant Order</strong>
                      <p class="text-xs text-gray-600">Specify tons needed, propose price, and request pickup date.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-brand-100">
                    <span class="w-6 h-6 rounded-full bg-sprout text-white font-bold text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <strong class="text-sm text-brand-900 block">Track Logistics & ESG Impact</strong>
                      <p class="text-xs text-gray-600">Live order stepper from pickup to mill delivery + certified CO₂ reports.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Supported Waste Types Carousel/Grid -->
        <section class="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <span class="text-xs uppercase font-extrabold tracking-widest text-sprout">High Value Biomass</span>
          <h2 class="text-3xl font-extrabold text-brand-900 mt-2">Supported Agricultural Residues</h2>
          <p class="text-gray-600 max-w-xl mx-auto mt-2 text-sm">Every crop byproduct has a lucrative industrial afterlife.</p>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-10 text-left">
            ${Object.values(WASTE_CATEGORIES).slice(0, 8).map(w => `
              <div class="glass-card p-4 rounded-2xl flex flex-col justify-between hover:border-brand-500 transition">
                <div class="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-gray-100">
                  <img src="${w.image}" alt="${w.name}" class="w-full h-full object-cover">
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-bold text-brand-900 text-sm">${w.name}</h4>
                    <span class="text-[10px] font-bold text-harvest bg-harvest-light px-2 py-0.5 rounded-full">${w.demandLevel}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 line-clamp-2">${w.description}</p>
                </div>
                <div class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span class="text-xs font-extrabold text-brand-900">Avg. ${formatMoney(w.avgPrice)}/ton</span>
                  <a href="#/marketplace?type=${encodeURIComponent(w.name)}" class="text-xs font-semibold text-sprout hover:underline">
                    Browse &rarr;
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Call to Action Section -->
        <section class="bg-gradient-to-br from-brand-900 via-brand-950 to-[#10291d] text-white py-16 px-4 md:px-8 text-center relative overflow-hidden">
          <div class="max-w-4xl mx-auto space-y-6 relative z-10">
            <span class="px-3.5 py-1.5 rounded-full bg-harvest text-brand-950 font-bold text-xs uppercase tracking-wider inline-block">
              Circular Economy in Action
            </span>
            <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">Give Agricultural Waste a Second Life.</h2>
            <p class="text-white/80 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Join hundreds of progressive farmers and industrial buyers across southern and western India turning stubble into green energy, paper, and wealth.
            </p>
            <div class="flex flex-wrap justify-center gap-4 pt-3">
              <a href="#/register?role=farmer" class="btn-harvest !py-3 !px-6 text-sm font-bold shadow-lg">
                <i data-lucide="wheat" class="w-4 h-4"></i> Join as Farmer
              </a>
              <a href="#/register?role=industry" class="btn-secondary !bg-white/10 !text-white !border-white/30 hover:!bg-white/20 !py-3 !px-6 text-sm font-bold">
                <i data-lucide="factory" class="w-4 h-4"></i> Join as Industry
              </a>
            </div>
          </div>
        </section>
      </main>
      ${renderFooter()}
    `;
  }

  function renderFooter() {
    return `
      <footer class="bg-brand-950 text-white/70 py-10 px-4 md:px-8 text-xs border-t border-white/10">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-white font-bold text-sm">
            <i data-lucide="sprout" class="w-4 h-4 text-harvest"></i> AgriCycle Marketplace
          </div>
          <div class="flex gap-6">
            <a href="#/marketplace" class="hover:text-white">Marketplace</a>
            <a href="#/how-it-works" class="hover:text-white">How It Works</a>
            <a href="#/about" class="hover:text-white">About & Impact</a>
            <a href="#/login" class="hover:text-white">Sign In</a>
          </div>
          <div class="text-white/50 text-[11px]">
            &copy; 2026 AgriCycle. Built for sustainable Indian agriculture.
          </div>
        </div>
      </footer>
    `;
  }

  // 7. Authentication Pages (/login, /register, /forgot-password)
  function renderLogin() {
    return `
      ${renderNavbar()}
      <div class="flex-1 flex items-center justify-center p-4 py-12">
        <div class="w-full max-w-md glass-card p-6 sm:p-8 bg-white border border-brand-200 shadow-xl rounded-3xl">
          <div class="text-center space-y-1 mb-6">
            <h2 class="text-2xl font-extrabold text-brand-900">Welcome Back</h2>
            <p class="text-xs text-gray-500">Sign in to manage your residue listings and orders</p>
          </div>

          <!-- 1-Click Quick Demo Accounts (Vital for Hackathon Evaluation) -->
          <div class="mb-6 p-3 bg-brand-50 border border-brand-200/80 rounded-2xl space-y-2">
            <span class="text-[11px] font-bold text-brand-900 uppercase tracking-wider block text-center">
              ⚡ 1-Click Hackathon Demo Access
            </span>
            <div class="grid grid-cols-3 gap-1.5">
              <button onclick="window.AgriCycle.quickLogin('farmer')" class="px-2 py-2 bg-white hover:bg-brand-100 border border-brand-200 text-brand-900 rounded-xl text-xs font-bold text-center flex flex-col items-center gap-1 shadow-sm transition">
                <i data-lucide="wheat" class="w-4 h-4 text-harvest"></i> Farmer
              </button>
              <button onclick="window.AgriCycle.quickLogin('industry')" class="px-2 py-2 bg-white hover:bg-brand-100 border border-brand-200 text-brand-900 rounded-xl text-xs font-bold text-center flex flex-col items-center gap-1 shadow-sm transition">
                <i data-lucide="factory" class="w-4 h-4 text-sprout"></i> Industry
              </button>
              <button onclick="window.AgriCycle.quickLogin('admin')" class="px-2 py-2 bg-white hover:bg-brand-100 border border-brand-200 text-brand-900 rounded-xl text-xs font-bold text-center flex flex-col items-center gap-1 shadow-sm transition">
                <i data-lucide="shield-check" class="w-4 h-4 text-brand-900"></i> Admin
              </button>
            </div>
          </div>

          <form onsubmit="window.AgriCycle.handleLoginForm(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" id="login-email" required value="farmer@agricycle.demo" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-900 text-sm">
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-gray-700">Password</label>
                <a href="#/forgot-password" class="text-xs text-sprout hover:underline">Forgot?</a>
              </div>
              <input type="password" id="login-password" required value="demo123" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-900 text-sm">
            </div>
            <button type="submit" class="btn-primary w-full !py-2.5 mt-2" id="btn-submit-login">
              Sign In to AgriCycle
            </button>
          </form>

          <p class="text-center text-xs text-gray-500 mt-6">
            Don't have an account? <a href="#/register" class="text-brand-900 font-bold hover:underline">Register now</a>
          </p>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  function renderRegister() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const defaultRole = urlParams.get('role') || 'farmer';

    return `
      ${renderNavbar()}
      <div class="flex-1 flex items-center justify-center p-4 py-10">
        <div class="w-full max-w-lg glass-card p-6 sm:p-8 bg-white border border-brand-200 shadow-xl rounded-3xl">
          <div class="text-center space-y-1 mb-6">
            <h2 class="text-2xl font-extrabold text-brand-900">Create an Account</h2>
            <p class="text-xs text-gray-500">Join India's leading circular agricultural marketplace</p>
          </div>

          <!-- Role Toggle -->
          <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
            <button type="button" id="reg-role-farmer" onclick="window.AgriCycle.setRegRole('farmer')" class="py-2 rounded-xl text-xs font-bold transition ${defaultRole === 'farmer' ? 'bg-brand-900 text-white shadow' : 'text-gray-600'}">
              🌾 I am a Farmer
            </button>
            <button type="button" id="reg-role-industry" onclick="window.AgriCycle.setRegRole('industry')" class="py-2 rounded-xl text-xs font-bold transition ${defaultRole === 'industry' ? 'bg-brand-900 text-white shadow' : 'text-gray-600'}">
              🏭 I am an Industry / Buyer
            </button>
          </div>

          <form onsubmit="window.AgriCycle.handleRegisterForm(event)" class="space-y-4 text-left">
            <input type="hidden" id="reg-role" value="${defaultRole}">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" id="reg-name" required placeholder="e.g. Ramesh Patel" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="reg-phone" required placeholder="+91 98480 00000" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" id="reg-email" required placeholder="name@domain.com" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" id="reg-password" required placeholder="Min 6 characters" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Village / City</label>
                <input type="text" id="reg-city" required placeholder="e.g. Anantapur" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input type="text" id="reg-state" required placeholder="e.g. Andhra Pradesh" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
            </div>

            <!-- Farmer specific field -->
            <div id="farmer-fields" class="${defaultRole === 'farmer' ? '' : 'hidden'}">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Farm Size (Acres - Optional)</label>
              <input type="number" id="reg-farmsize" placeholder="e.g. 15" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
            </div>

            <!-- Industry specific fields -->
            <div id="industry-fields" class="space-y-3 ${defaultRole === 'industry' ? '' : 'hidden'}">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Company / Mill Name</label>
                <input type="text" id="reg-company" placeholder="e.g. Green BioEnergy Pvt Ltd" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Industry Sector</label>
                <input type="text" id="reg-industry-type" placeholder="e.g. Paper & Packaging, Biomass Power" class="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm">
              </div>
            </div>

            <button type="submit" class="btn-primary w-full !py-2.5 mt-2" id="btn-submit-register">
              Complete Registration
            </button>
          </form>

          <p class="text-center text-xs text-gray-500 mt-6">
            Already have an account? <a href="#/login" class="text-brand-900 font-bold hover:underline">Log in</a>
          </p>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  function renderForgotPassword() {
    return `
      ${renderNavbar()}
      <div class="flex-1 flex items-center justify-center p-4 py-16">
        <div class="w-full max-w-md glass-card p-8 bg-white border border-brand-200 shadow-xl rounded-3xl text-center space-y-4">
          <span class="w-12 h-12 rounded-2xl bg-brand-100 text-brand-900 flex items-center justify-center mx-auto">
            <i data-lucide="key-round" class="w-6 h-6"></i>
          </span>
          <h2 class="text-2xl font-extrabold text-brand-900">Reset Password</h2>
          <p class="text-xs text-gray-600">Enter your registered email and we'll send verification credentials.</p>
          <form onsubmit="event.preventDefault(); showToast('Demo password reset link sent to email', 'info'); navigate('/login');" class="space-y-4 text-left">
            <input type="email" required placeholder="farmer@agricycle.demo" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm">
            <button type="submit" class="btn-primary w-full !py-2.5">Send Reset Link</button>
          </form>
          <a href="#/login" class="text-xs text-brand-900 font-bold block pt-2 hover:underline">&larr; Back to Sign In</a>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 8. Farmer Dashboard & Pages
  function renderFarmerDashboard() {
    const u = state.currentUser;
    const myListings = state.listings.filter(l => l.farmerId === u.id);
    const myOffers = state.offers.filter(o => o.farmerId === u.id && o.status === 'pending');
    const myOrders = state.orders.filter(o => o.farmerId === u.id);
    const completedOrders = myOrders.filter(o => o.status === 'completed');
    const totalEarnings = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalWasteReusedTons = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalTrolleys = (totalWasteReusedTons / 3.5).toFixed(1);

    return `
      ${renderNavbar()}
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-8">
        <!-- Dashboard Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-sprout">Farmer Workspace</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-harvest-light text-brand-950 font-bold border border-harvest/40">0% Commission · Direct Bank Pay</span>
            </div>
            <h1 class="text-3xl font-extrabold text-brand-900 mt-0.5">Welcome back, ${u.name}!</h1>
            <p class="text-xs sm:text-sm text-gray-600">Your crop residues are turning into income and clean industrial raw materials.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.AgriCycle.speakFarmerSummary()" class="px-3 py-2 rounded-xl bg-harvest-light hover:bg-harvest text-brand-950 font-extrabold text-xs flex items-center gap-1.5 transition border border-harvest/60 shadow-sm" title="Listen to audio summary">
              <i data-lucide="volume-2" class="w-4 h-4 text-brand-900"></i> ${t('voiceAssistant')}
            </button>
            <a href="#/farmer/listings/new" class="btn-primary shadow-sm" id="btn-create-listing-dash">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> ${t('sellResidue')}
            </a>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Active Listings</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${myListings.filter(l => l.status === 'available').length}</strong>
            <span class="text-[10px] text-sprout font-bold mt-1 block">Live on Marketplace</span>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Pending Offers</span>
            <strong class="text-2xl font-extrabold text-harvest block mt-1">${myOffers.length}</strong>
            <span class="text-[10px] text-gray-500 mt-1 block">Awaiting your review</span>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Completed Sales</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${completedOrders.length}</strong>
            <span class="text-[10px] text-sprout mt-1 block">Successfully fulfilled</span>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Total Earnings</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${formatMoney(totalEarnings)}</strong>
            <span class="text-[10px] text-sprout mt-1 block">Direct to bank</span>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200 col-span-2 lg:col-span-1">
            <span class="text-xs text-gray-500 font-medium block">Waste Reused</span>
            <strong class="text-2xl font-extrabold text-sprout block mt-1">${totalWasteReusedTons} Tons</strong>
            <span class="text-[10px] text-gray-500 mt-1 block">${Math.round(totalWasteReusedTons * 1.5)} T CO₂ Saved</span>
          </div>
        </div>

        <!-- Section: Pending Offers Alert (if any) -->
        ${myOffers.length > 0 ? `
          <div class="bg-harvest-light border border-harvest/40 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-harvest text-brand-950 font-bold flex items-center justify-center">
                <i data-lucide="bell" class="w-5 h-5"></i>
              </span>
              <div>
                <strong class="text-brand-900 text-sm block">You have ${myOffers.length} new industry offer${myOffers.length > 1 ? 's' : ''}!</strong>
                <span class="text-xs text-gray-600">${myOffers[0].buyerName} offered ${formatMoney(myOffers[0].price)}/ton for your ${myOffers[0].listingTitle}.</span>
              </div>
            </div>
            <a href="#/farmer/offers" class="btn-primary !py-2 !px-4 text-xs font-bold">Review Offers</a>
          </div>
        ` : ''}

        <!-- 2 Column Layout: Recent Listings & Recent Orders -->
        <div class="grid lg:grid-cols-2 gap-6">
          <!-- My Active Listings -->
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 class="font-extrabold text-brand-900 text-lg flex items-center gap-2">
                <i data-lucide="package" class="w-5 h-5 text-harvest"></i> My Residue Listings
              </h3>
              <a href="#/farmer/listings" class="text-xs font-bold text-sprout hover:underline">View All &rarr;</a>
            </div>

            <div class="divide-y divide-gray-100">
              ${myListings.slice(0, 3).map(l => `
                <div class="py-3 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <img src="${l.imageUrl}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                      <strong class="text-sm font-bold text-brand-900 block">${l.wasteType}</strong>
                      <span class="text-xs text-gray-500">${l.quantity} ${l.unit} · ${l.location}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-extrabold text-brand-900 block">${formatMoney(l.price)}/${l.unit}</span>
                    <span class="badge badge-${l.status}">${l.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Active Pickups & Orders -->
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 class="font-extrabold text-brand-900 text-lg flex items-center gap-2">
                <i data-lucide="truck" class="w-5 h-5 text-sprout"></i> Upcoming Pickups & Orders
              </h3>
              <a href="#/farmer/orders" class="text-xs font-bold text-sprout hover:underline">Manage &rarr;</a>
            </div>

            <div class="divide-y divide-gray-100">
              ${myOrders.slice(0, 3).map(o => `
                <div class="py-3 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center font-bold text-xs">
                      <i data-lucide="truck" class="w-5 h-5"></i>
                    </span>
                    <div>
                      <strong class="text-sm font-bold text-brand-900 block">${o.listingTitle} (${o.orderNumber})</strong>
                      <span class="text-xs text-gray-500">Buyer: ${o.buyerName} · Date: ${formatDate(o.pickupDate)}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-extrabold text-brand-900 block">${formatMoney(o.totalAmount)}</span>
                    <span class="badge badge-${o.status}">${o.status.replace('_', ' ')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- AI Local Demand Pulse -->
        <div class="p-6 rounded-3xl bg-brand-50/90 border border-brand-200 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-extrabold text-brand-900 text-base flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-harvest"></i> Local Industrial Demand Signals
            </h4>
            <a href="#/farmer/buyers" class="text-xs font-bold text-sprout hover:underline">View 5 Nearby Buyers &rarr;</a>
          </div>
          <div class="grid sm:grid-cols-3 gap-3">
            <div class="p-3 bg-white rounded-xl border border-brand-100 text-xs">
              <strong class="text-brand-900 block font-bold">Rice Husk in Anantapur</strong>
              <span class="text-gray-600">Green BioEnergy needs 85 tons. Avg offer ₹3,300/T.</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-brand-100 text-xs">
              <strong class="text-brand-900 block font-bold">Groundnut Shells</strong>
              <span class="text-gray-600">Deccan Biochar actively procuring within 35 km.</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-brand-100 text-xs">
              <strong class="text-brand-900 block font-bold">Sugarcane Bagasse</strong>
              <span class="text-gray-600">EcoPaper Mills running 120-ton seasonal contract.</span>
            </div>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 9. Create Agricultural Waste Listing (With AI Classifier & Price Estimator)
  function renderNewListing() {
    return `
      ${renderNavbar()}
      <div class="max-w-4xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <a href="#/farmer/dashboard" class="text-xs text-gray-500 hover:text-brand-900">&larr; Back to Dashboard</a>
          <h1 class="text-3xl font-extrabold text-brand-900 mt-1">List Agricultural Waste</h1>
          <p class="text-xs sm:text-sm text-gray-600">Use our AI vision scanner to classify residue and estimate fair market price.</p>
        </div>

        <form onsubmit="window.AgriCycle.handlePublishListing(event)" class="space-y-6">
          <div class="grid md:grid-cols-12 gap-6">
            <!-- Left: Photo Upload & AI Scan Card -->
            <div class="md:col-span-5 space-y-4">
              <div class="glass-card p-5 rounded-3xl bg-white border border-brand-200 space-y-3">
                <span class="text-xs uppercase font-extrabold tracking-wider text-sprout block">Step 1: Waste Photo</span>
                
                <!-- Upload Dropzone & Live Scanner -->
                <div class="scanner-container relative aspect-[4/3] bg-gray-100 rounded-2xl border-2 border-dashed border-brand-200 overflow-hidden flex flex-col items-center justify-center text-center p-3" id="dropzone-box">
                  <div id="scanner-laser" class="scanner-laser hidden"></div>
                  <img id="preview-image" src="${WASTE_CATEGORIES['Rice Husk'].image}" alt="Residue Preview" class="absolute inset-0 w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-white" id="upload-overlay">
                    <i data-lucide="camera" class="w-8 h-8 mb-2"></i>
                    <span class="text-xs font-bold">Upload Farm Photo</span>
                    <span class="text-[10px] text-white/80">Click or Drag & Drop</span>
                  </div>
                  <input type="file" id="file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="window.AgriCycle.handleImageUpload(event)">
                </div>

                <!-- Sample Images Quick Picker for Instant Hackathon Demonstration -->
                <div>
                  <span class="text-[11px] font-bold text-gray-500 block mb-1.5">Or test sample photo:</span>
                  <div class="grid grid-cols-4 gap-1.5">
                    <button type="button" onclick="window.AgriCycle.pickSample('Rice Husk')" class="text-[10px] p-1 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold truncate">
                      Rice Husk
                    </button>
                    <button type="button" onclick="window.AgriCycle.pickSample('Rice Straw')" class="text-[10px] p-1 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold truncate">
                      Rice Straw
                    </button>
                    <button type="button" onclick="window.AgriCycle.pickSample('Sugarcane Bagasse')" class="text-[10px] p-1 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold truncate">
                      Bagasse
                    </button>
                    <button type="button" onclick="window.AgriCycle.pickSample('Groundnut Shells')" class="text-[10px] p-1 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold truncate">
                      G-Nut Shells
                    </button>
                  </div>
                </div>

                <!-- AI Analysis Result Badge -->
                <div id="ai-classification-box" class="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold text-brand-900 flex items-center gap-1">
                      <i data-lucide="sparkles" class="w-3.5 h-3.5 text-harvest"></i> AI Identified Type:
                    </span>
                    <span id="ai-confidence" class="badge badge-available">95% Confidence</span>
                  </div>
                  <strong id="ai-waste-name" class="text-brand-900 text-base font-extrabold block">Rice Husk</strong>
                  <p id="ai-uses" class="text-[11px] text-gray-600">Possible uses: Biomass Pellet Fuel, Silica Extraction, Animal Bedding, Biochar</p>
                </div>
              </div>
            </div>

            <!-- Right: Listing Details & Pricing -->
            <div class="md:col-span-7 space-y-4">
              <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
                <span class="text-xs uppercase font-extrabold tracking-wider text-sprout block">Step 2: Quantity & Valuation</span>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Waste Type</label>
                    <select id="listing-type" required onchange="window.AgriCycle.handleTypeChange()" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold">
                      ${Object.keys(WASTE_CATEGORIES).map(k => `<option value="${k}">${k}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="block text-xs font-semibold text-gray-700">Quantity & Unit</label>
                      <span class="text-[10px] font-bold text-sprout">🚜 1 Trolley ≈ 3.5T</span>
                    </div>
                    <div class="flex gap-2">
                      <input type="number" id="listing-quantity" required value="12" step="0.5" min="0.1" oninput="window.AgriCycle.updateAiPriceEstimate()" class="w-2/3 px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
                      <select id="listing-unit" class="w-1/3 px-2 py-2 rounded-xl border border-gray-300 text-sm">
                        <option value="ton">Ton</option>
                        <option value="quintal">Quintal</option>
                        <option value="kg">Kg</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Rural Load Quick Presets (Tractor Trolley Loads) -->
                <div class="p-2.5 rounded-2xl bg-brand-50 border border-brand-100">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] font-bold text-brand-900 flex items-center gap-1">
                      🚜 ${t('tractorTrolleys')}:
                    </span>
                    <span class="text-[10px] text-gray-500">Quick 1-tap select</span>
                  </div>
                  <div class="grid grid-cols-5 gap-1.5 text-center">
                    <button type="button" onclick="window.AgriCycle.setTractorLoad(1)" class="p-1 rounded-xl bg-white hover:bg-harvest-light border border-brand-200 text-brand-950 font-bold text-[10px] shadow-xs">
                      1 Trolley<br><span class="text-[9px] text-gray-500">3.5 Tons</span>
                    </button>
                    <button type="button" onclick="window.AgriCycle.setTractorLoad(2)" class="p-1 rounded-xl bg-white hover:bg-harvest-light border border-brand-200 text-brand-950 font-bold text-[10px] shadow-xs">
                      2 Trolleys<br><span class="text-[9px] text-gray-500">7.0 Tons</span>
                    </button>
                    <button type="button" onclick="window.AgriCycle.setTractorLoad(3)" class="p-1 rounded-xl bg-white hover:bg-harvest-light border border-brand-200 text-brand-950 font-bold text-[10px] shadow-xs">
                      3 Trolleys<br><span class="text-[9px] text-gray-500">10.5 Tons</span>
                    </button>
                    <button type="button" onclick="window.AgriCycle.setTractorLoad(4)" class="p-1 rounded-xl bg-white hover:bg-harvest-light border border-brand-200 text-brand-950 font-bold text-[10px] shadow-xs">
                      4 Trolleys<br><span class="text-[9px] text-gray-500">14.0 Tons</span>
                    </button>
                    <button type="button" onclick="window.AgriCycle.setTractorLoad(3.43)" class="p-1 rounded-xl bg-white hover:bg-brand-100 border border-brand-200 text-brand-900 font-bold text-[10px] shadow-xs">
                      1 Lorry<br><span class="text-[9px] text-gray-500">12.0 Tons</span>
                    </button>
                  </div>
                </div>

                <!-- AI Suggested Pricing Widget -->
                <div class="p-4 rounded-2xl bg-harvest-light border border-harvest/50 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-brand-900 flex items-center gap-1.5">
                      <i data-lucide="trending-up" class="w-4 h-4 text-harvest"></i> AI Suggested Price:
                    </span>
                    <strong id="ai-price-tag" class="text-lg font-extrabold text-brand-900">₹3,200 / ton</strong>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-gray-600">
                    <span id="ai-market-range">Current Market Range: ₹2,500 – ₹3,900</span>
                    <button type="button" onclick="window.AgriCycle.applySuggestedPrice()" class="text-xs font-bold text-sprout hover:underline">
                      Apply Price
                    </button>
                  </div>
                  <p class="text-[10px] text-gray-500 italic">
                    *Price bounds regulated by regional Mandi and industrial biomass procurement ceilings.
                  </p>
                </div>

                <!-- Mandi Fair Price Guard & Input -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-semibold text-gray-700">Your Listing Price (₹ per unit)</label>
                    <button type="button" onclick="window.AgriCycle.speakPriceAdvice()" class="text-[11px] text-brand-900 font-bold flex items-center gap-1 hover:text-sprout" title="Listen to pricing guidance">
                      <i data-lucide="volume-2" class="w-3.5 h-3.5 text-harvest"></i> 🔊 Listen to Advice
                    </button>
                  </div>
                  <input type="number" id="listing-price" required value="3200" oninput="window.AgriCycle.checkListingPriceInput()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-extrabold text-brand-900 text-base">

                  <!-- Live Mandi Guard Feedback Box -->
                  <div id="mandi-price-guard-box" class="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-extrabold text-emerald-950 flex items-center gap-1">
                        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-700"></i> ${t('mandiPriceGuard')}:
                      </span>
                      <span id="mandi-guard-badge" class="badge text-emerald-800 bg-white border border-emerald-300 font-bold">✓ Fair Mandi Price Zone</span>
                    </div>
                    <p id="mandi-guard-msg" class="text-[11px] text-emerald-800 leading-tight">
                      Optimal fair price! Fair return for farmer and within buyer procurement bounds.
                    </p>
                    <div class="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[10px] text-gray-500 font-semibold">
                      <span id="mandi-min-floor">Min Floor: ₹2,500</span>
                      <span id="mandi-max-cap">Procurement Cap: ₹3,900</span>
                    </div>
                  </div>

                  <!-- Direct Net Bank Cash Payout Display -->
                  <div class="p-2.5 rounded-xl bg-brand-900 text-white flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <i data-lucide="wallet" class="w-4 h-4 text-harvest"></i>
                      <div>
                        <span class="text-[10px] text-white/70 block leading-none">Net Payout to Your Bank:</span>
                        <strong id="farmer-net-payout" class="text-sm font-extrabold text-harvest">₹38,400</strong>
                      </div>
                    </div>
                    <span class="text-[10px] font-bold text-sprout bg-white/10 px-2 py-0.5 rounded-full">0% Platform Deductions</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Location / Mandal</label>
                    <input type="text" id="listing-location" required value="Kalyandurg Road, Anantapur Rural" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Available Date</label>
                    <input type="date" id="listing-date" required value="2026-10-15" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Description & Storage Details</label>
                  <textarea id="listing-desc" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" placeholder="e.g. Dry post-harvest residue, stored under covered tin shed. Road accessible for 6-wheeler trucks.">Dry post-harvest residue with under 9% moisture content. Stored on wooden pallets under tin shed.</textarea>
                </div>

                <button type="submit" class="btn-primary w-full !py-3 font-bold text-sm shadow-md" id="btn-submit-publish">
                  Publish to Agricultural Marketplace &rarr;
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      ${renderFooter()}
    `;
  }

  // 10. Farmer Listings Management (/farmer/listings)
  function renderFarmerListings() {
    const u = state.currentUser;
    const myListings = state.listings.filter(l => l.farmerId === u.id);

    return `
      ${renderNavbar()}
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-sprout">Inventory Control</span>
            <h1 class="text-3xl font-extrabold text-brand-900">My Agricultural Waste Listings</h1>
          </div>
          <a href="#/farmer/listings/new" class="btn-primary !py-2 !px-4 text-xs font-bold">
            <i data-lucide="plus" class="w-4 h-4"></i> New Listing
          </a>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${myListings.map(l => {
            const trolleyEst = (l.quantity / 3.5).toFixed(1);
            return `
            <div class="glass-card rounded-3xl overflow-hidden bg-white border border-brand-200 flex flex-col justify-between">
              <div class="relative aspect-video">
                <img src="${l.imageUrl}" alt="${l.wasteType}" class="w-full h-full object-cover">
                <div class="absolute top-3 left-3 flex gap-1">
                  <span class="badge badge-${l.status}">${l.status}</span>
                  <span class="badge bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">✓ Mandi Zone</span>
                </div>
                <span class="absolute bottom-3 right-3 bg-brand-900/90 text-white px-2.5 py-1 rounded-xl text-xs font-extrabold">
                  ${formatMoney(l.price)} / ${l.unit}
                </span>
              </div>
              <div class="p-5 space-y-2 flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="font-extrabold text-brand-900 text-lg">${l.wasteType}</h3>
                  <span class="text-xs font-bold text-sprout bg-brand-50 px-2 py-0.5 rounded-full">🚜 ~${trolleyEst} Trolleys</span>
                </div>
                <p class="text-xs text-gray-500">${l.quantity} ${l.unit} · ${l.location}</p>
                <p class="text-xs text-gray-700 line-clamp-2">${l.description}</p>
              </div>
              <div class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <button onclick="window.AgriCycle.toggleListingStatus(${l.id})" class="btn-secondary text-xs !py-1.5 !px-3">
                    ${l.status === 'available' ? 'Mark Sold' : 'Make Available'}
                  </button>
                  <button onclick="window.AgriCycle.shareListingWhatsapp(${l.id})" class="p-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1" title="Share Deal Card on WhatsApp">
                    <i data-lucide="share-2" class="w-3.5 h-3.5 text-emerald-600"></i> WhatsApp
                  </button>
                </div>
                <button onclick="window.AgriCycle.deleteListing(${l.id})" class="text-xs text-red-600 hover:text-red-800 font-semibold px-1">
                  Remove
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 11. Farmer Offers (/farmer/offers)
  function renderFarmerOffers() {
    const u = state.currentUser;
    const myOffers = state.offers.filter(o => o.farmerId === u.id);

    return `
      ${renderNavbar()}
      <div class="max-w-5xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Trade Inquiries</span>
          <h1 class="text-3xl font-extrabold text-brand-900">Received Industry Offers</h1>
          <p class="text-xs sm:text-sm text-gray-600">Review, negotiate, or accept direct purchase offers from verified mills.</p>
        </div>

        <div class="space-y-4">
          ${myOffers.length === 0 ? `
            <div class="glass-card p-12 text-center rounded-3xl bg-white border border-brand-200">
              <i data-lucide="file-question" class="w-12 h-12 text-gray-400 mx-auto mb-3"></i>
              <h3 class="text-lg font-bold text-brand-900">No active offers yet</h3>
              <p class="text-xs text-gray-500 max-w-sm mx-auto mt-1">Offers will appear here as industries view your listings.</p>
            </div>
          ` : myOffers.map(o => `
            <div class="glass-card p-5 sm:p-6 rounded-3xl bg-white border border-brand-200 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-extrabold text-brand-900 text-lg">${o.listingTitle}</h3>
                    <span class="badge badge-${o.status}">${o.status}</span>
                  </div>
                  <span class="text-xs text-gray-500">From <strong>${o.buyerName}</strong> ${o.buyerVerified ? '✓ Verified Mill' : ''}</span>
                </div>
                <div class="text-left sm:text-right">
                  <span class="text-xl font-extrabold text-brand-900">${formatMoney(o.price * o.quantity)}</span>
                  <span class="text-xs text-gray-500 block">${o.quantity} ${o.unit} @ ${formatMoney(o.price)}/${o.unit}</span>
                </div>
              </div>

              <p class="text-xs text-gray-700 bg-brand-50/60 p-3 rounded-xl border border-brand-100">
                “${o.message}”
              </p>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 pt-1">
                <span>Requested Pickup: <strong>${formatDate(o.pickupDate)}</strong></span>
                
                ${o.status === 'pending' ? `
                  <div class="flex items-center gap-2">
                    <button onclick="window.AgriCycle.rejectOffer(${o.id})" class="btn-secondary !text-red-700 !py-1.5 !px-3">
                      Decline
                    </button>
                    <button onclick="window.AgriCycle.openCounterOfferModal(${o.id})" class="btn-secondary !py-1.5 !px-3">
                      Counter Offer
                    </button>
                    <button onclick="window.AgriCycle.acceptOffer(${o.id})" class="btn-primary !py-1.5 !px-4 !bg-sprout">
                      Accept Offer &rarr;
                    </button>
                  </div>
                ` : `
                  <span class="text-xs font-bold text-brand-900 uppercase">Offer ${o.status}</span>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 12. Orders & Pickups (Visual 5-Stage Stepper)
  function renderOrders(role) {
    const u = state.currentUser;
    const orders = state.orders.filter(o => role === 'farmer' ? o.farmerId === u.id : o.buyerId === u.id);

    const steps = ['pending', 'confirmed', 'pickup_scheduled', 'picked_up', 'completed'];
    const stepLabels = ['Pending', 'Confirmed', 'Pickup Scheduled', 'Picked Up', 'Completed'];

    return `
      ${renderNavbar()}
      <div class="max-w-5xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Fulfilment & Logistics</span>
          <h1 class="text-3xl font-extrabold text-brand-900">Orders & Pickup Tracking</h1>
          <p class="text-xs sm:text-sm text-gray-600">Track real-time progress from field handover to factory delivery.</p>
        </div>

        <div class="space-y-6">
          ${orders.map(o => {
            const currentStepIndex = steps.indexOf(o.status);

            return `
              <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span class="text-xs font-mono font-bold text-gray-400">ORDER ${o.orderNumber}</span>
                    <h3 class="font-extrabold text-brand-900 text-xl">${o.listingTitle} (${o.quantity} ${o.unit})</h3>
                    <span class="text-xs text-gray-500">${role === 'farmer' ? `Buyer: ${o.buyerName}` : `Farmer: ${o.farmerName}`}</span>
                  </div>
                  <div class="text-left sm:text-right">
                    <span class="text-2xl font-extrabold text-brand-900">${formatMoney(o.totalAmount)}</span>
                    <span class="badge badge-${o.status} block mt-0.5">${o.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <!-- 5-Stage Visual Stepper -->
                <div class="py-2">
                  <div class="flex items-center justify-between">
                    ${steps.map((s, idx) => `
                      <div class="stepper-step ${idx < currentStepIndex ? 'done' : idx === currentStepIndex ? 'active' : ''}">
                        <div class="stepper-circle">
                          ${idx < currentStepIndex ? '✓' : idx + 1}
                        </div>
                        <span class="text-[11px] font-bold mt-2 text-center ${idx <= currentStepIndex ? 'text-brand-900' : 'text-gray-400'}">
                          ${stepLabels[idx]}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Pickup Logistics Details -->
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span class="text-gray-500 block">Pickup Date & Time:</span>
                    <strong class="text-brand-900">${formatDate(o.pickupDate)} at ${o.pickupTime || 'Morning'}</strong>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Pickup Point:</span>
                    <strong class="text-brand-900">${o.pickupAddress || 'Farm Gate'}</strong>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Assigned Transport / Driver:</span>
                    <strong class="text-brand-900">${o.driverName || 'Driver dispatch pending'}</strong>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Contact Phone:</span>
                    <strong class="text-brand-900">${o.contactNumber || o.farmerPhone}</strong>
                  </div>
                </div>

                <!-- Action Controls -->
                <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
                  ${o.status === 'confirmed' ? `
                    <button onclick="window.AgriCycle.openPickupModal(${o.id})" class="btn-primary !py-2 !px-4 text-xs">
                      Schedule Transport & Lorry
                    </button>
                  ` : o.status === 'pickup_scheduled' ? `
                    <button onclick="window.AgriCycle.advanceOrderStep(${o.id}, 'picked_up')" class="btn-primary !py-2 !px-4 text-xs !bg-harvest text-brand-950 font-bold">
                      Confirm Loaded & Dispatched &rarr;
                    </button>
                  ` : o.status === 'picked_up' ? `
                    <button onclick="window.AgriCycle.advanceOrderStep(${o.id}, 'completed')" class="btn-primary !py-2 !px-4 text-xs !bg-sprout font-bold">
                      Complete Handover & Clear Payment &rarr;
                    </button>
                  ` : o.status === 'completed' ? `
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-sprout">✓ Order Fulfilled</span>
                      <button onclick="window.AgriCycle.openReviewModal(${o.id})" class="btn-secondary !py-1.5 !px-3 text-xs">
                        Leave Rating & Review
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 13. Farmer Earnings & ESG Environmental Impact
  function renderFarmerEarnings() {
    const u = state.currentUser;
    const completedOrders = state.orders.filter(o => o.farmerId === u.id && o.status === 'completed');
    const totalEarnings = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const thisMonthEarnings = totalEarnings; // demo

    return `
      ${renderNavbar()}
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Financial Ledger</span>
          <h1 class="text-3xl font-extrabold text-brand-900">Farmer Earnings & Payouts</h1>
          <p class="text-xs sm:text-sm text-gray-600">Track all income earned from turning crop waste into resources.</p>
        </div>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Total Lifetime Earnings</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${formatMoney(totalEarnings)}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">This Month (Oct)</span>
            <strong class="text-2xl font-extrabold text-sprout block mt-1">${formatMoney(thisMonthEarnings)}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Completed Sales</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${completedOrders.length}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Pending Settlements</span>
            <strong class="text-2xl font-extrabold text-harvest block mt-1">₹37,800</strong>
          </div>
        </div>

        <!-- Transaction History Table -->
        <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
          <h3 class="font-extrabold text-brand-900 text-lg">Completed Settlements</h3>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th class="p-3">Order ID</th>
                  <th class="p-3">Waste Lot</th>
                  <th class="p-3">Buyer Company</th>
                  <th class="p-3">Quantity</th>
                  <th class="p-3">Payout Amount</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${completedOrders.map(o => `
                  <tr>
                    <td class="p-3 font-mono font-bold">${o.orderNumber}</td>
                    <td class="p-3 font-bold text-brand-900">${o.listingTitle}</td>
                    <td class="p-3">${o.buyerName}</td>
                    <td class="p-3">${o.quantity} ${o.unit}</td>
                    <td class="p-3 font-extrabold text-brand-900">${formatMoney(o.totalAmount)}</td>
                    <td class="p-3"><span class="badge badge-completed">Paid</span></td>
                    <td class="p-3 text-right">
                      <button onclick="showToast('Receipt for ${o.orderNumber} downloaded', 'info')" class="text-sprout font-bold hover:underline">
                        View Slip
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  function renderFarmerImpact() {
    const totalTons = 27; // demo
    const burningAvoidedKg = totalTons * 1000;
    const co2SavedKg = Math.round(burningAvoidedKg * 1.48);

    return `
      ${renderNavbar()}
      <div class="max-w-4xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Environmental Scorecard</span>
          <h1 class="text-3xl font-extrabold text-brand-900">Your Agricultural Climate Impact</h1>
          <p class="text-xs sm:text-sm text-gray-600">Calculated according to Indian biomass open-burning prevention models.</p>
        </div>

        <div class="grid sm:grid-cols-3 gap-4">
          <div class="glass-card p-5 rounded-3xl bg-white border border-brand-200 text-center">
            <span class="w-10 h-10 rounded-xl bg-sprout/10 text-sprout flex items-center justify-center mx-auto mb-2">
              <i data-lucide="leaf" class="w-5 h-5"></i>
            </span>
            <span class="text-xs text-gray-500 font-medium">Waste Diverted from Burning</span>
            <strong class="text-3xl font-extrabold text-brand-900 block mt-1">${(burningAvoidedKg).toLocaleString('en-IN')} kg</strong>
            <span class="text-[10px] text-gray-400 mt-1 block">27 Metric Tons Total</span>
          </div>

          <div class="glass-card p-5 rounded-3xl bg-white border border-brand-200 text-center">
            <span class="w-10 h-10 rounded-xl bg-harvest/15 text-harvest flex items-center justify-center mx-auto mb-2">
              <i data-lucide="wind" class="w-5 h-5"></i>
            </span>
            <span class="text-xs text-gray-500 font-medium">CO₂ Emissions Prevented</span>
            <strong class="text-3xl font-extrabold text-sprout block mt-1">${(co2SavedKg).toLocaleString('en-IN')} kg</strong>
            <span class="text-[10px] text-gray-400 mt-1 block">Equivalent to 8 cars off road</span>
          </div>

          <div class="glass-card p-5 rounded-3xl bg-white border border-brand-200 text-center">
            <span class="w-10 h-10 rounded-xl bg-brand-100 text-brand-900 flex items-center justify-center mx-auto mb-2">
              <i data-lucide="award" class="w-5 h-5"></i>
            </span>
            <span class="text-xs text-gray-500 font-medium">Circular Harvest Rank</span>
            <strong class="text-3xl font-extrabold text-brand-900 block mt-1">Tier 1 🌱</strong>
            <span class="text-[10px] text-sprout font-bold mt-1 block">Certified Clean Grower</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-3">
          <h3 class="font-extrabold text-brand-900 text-lg">Why This Matters</h3>
          <p class="text-xs text-gray-600 leading-relaxed">
            Every winter across north and south India, millions of tons of stubble are burnt in open fields, creating hazardous smog (PM 2.5) and destroying vital soil microbes. By listing on AgriCycle, your crop residues are diverted to biomass boilers, paper manufacturing, and biochar creation.
          </p>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 14. Nearby Buyers Directory (/farmer/buyers)
  function renderNearbyBuyers() {
    const industries = state.users.filter(u => u.role === 'industry');

    return `
      ${renderNavbar()}
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Procurement Network</span>
          <h1 class="text-3xl font-extrabold text-brand-900">Nearby Industrial Buyers</h1>
          <p class="text-xs sm:text-sm text-gray-600">Companies actively seeking raw agricultural waste within 100 km of Anantapur.</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${industries.map((ind, i) => `
            <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center justify-between">
                  <h3 class="font-extrabold text-brand-900 text-lg">${ind.companyName}</h3>
                  ${ind.verified ? `<span class="badge badge-verified">✓ Verified</span>` : ''}
                </div>
                <span class="text-xs text-gray-500 block">${ind.city}, ${ind.state} · ${12 + i * 15} km away</span>
                <span class="text-xs font-bold text-sprout block mt-1">${ind.industryType}</span>
                
                <div class="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div>
                    <span class="text-gray-500 block">Needs Materials:</span>
                    <strong class="text-brand-900">${(ind.requiredWasteTypes || ['Rice Husk', 'Straw']).join(', ')}</strong>
                  </div>
                  <div>
                    <span class="text-gray-500 block">Typical Offer Rate:</span>
                    <strong class="text-brand-900 font-extrabold">${formatMoney(ind.offerRatePerTon || 3200)} / ton</strong>
                  </div>
                </div>
              </div>

              <a href="#/farmer/listings/new" class="btn-primary w-full !py-2 text-xs font-bold text-center">
                Create Listing for This Buyer &rarr;
              </a>
            </div>
          `).join('')}
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 15. Public & Industry Marketplace
  function renderMarketplace() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const filterType = urlParams.get('type') || '';
    const filterSearch = urlParams.get('search') || '';

    // Apply active filter
    let items = state.listings.filter(l => l.status === 'available');
    if (filterType) items = items.filter(l => l.wasteType.toLowerCase().includes(filterType.toLowerCase()));
    if (filterSearch) {
      const s = filterSearch.toLowerCase();
      items = items.filter(l => l.wasteType.toLowerCase().includes(s) || l.location.toLowerCase().includes(s) || l.description.toLowerCase().includes(s));
    }

    return `
      ${renderNavbar()}
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-6 text-left">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-sprout">Agricultural Waste Exchange</span>
            <h1 class="text-3xl font-extrabold text-brand-900">Explore Residue Listings</h1>
            <p class="text-xs sm:text-sm text-gray-600">Search high-calorific straw, husks, bagasse, and crop residues ready for pickup.</p>
          </div>
          ${state.currentUser?.role === 'farmer' ? `
            <a href="#/farmer/listings/new" class="btn-primary !py-2 !px-4 text-xs font-bold">
              <i data-lucide="plus" class="w-4 h-4"></i> List My Waste
            </a>
          ` : ''}
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200 space-y-3">
          <div class="grid sm:grid-cols-12 gap-3">
            <div class="sm:col-span-6 relative">
              <input type="text" id="market-search" value="${filterSearch}" placeholder="Search waste type, location, or crop..." oninput="window.AgriCycle.updateMarketFilters()" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm">
              <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute left-3 top-3.5"></i>
            </div>
            <div class="sm:col-span-3">
              <select id="market-type" onchange="window.AgriCycle.updateMarketFilters()" class="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm">
                <option value="">All Waste Types</option>
                ${Object.keys(WASTE_CATEGORIES).map(k => `<option value="${k}" ${filterType === k ? 'selected' : ''}>${k}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-3">
              <select id="market-sort" onchange="window.AgriCycle.updateMarketFilters()" class="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm">
                <option value="nearest">Sort by: Nearest Distance</option>
                <option value="price_low">Sort by: Lowest Price</option>
                <option value="quantity_high">Sort by: Highest Quantity</option>
                <option value="newest">Sort by: Recently Added</option>
              </select>
            </div>
          </div>

          <!-- Quick Filter Pills -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <button onclick="window.AgriCycle.setFilterType('')" class="px-2.5 py-1 rounded-full text-xs font-semibold ${!filterType ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">All</button>
            ${Object.keys(WASTE_CATEGORIES).slice(0, 6).map(t => `
              <button onclick="window.AgriCycle.setFilterType('${t}')" class="px-2.5 py-1 rounded-full text-xs font-semibold ${filterType === t ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                ${t}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Listing Cards Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${items.map(l => {
            const trolleyEst = (l.quantity / 3.5).toFixed(1);
            return `
            <div class="glass-card rounded-3xl overflow-hidden bg-white border border-brand-200 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <div class="relative aspect-[16/10] bg-gray-100">
                  <img src="${l.imageUrl}" alt="${l.wasteType}" class="w-full h-full object-cover">
                  <div class="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span class="badge badge-available">Available</span>
                    <span class="badge bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                      ✓ Mandi Fair Zone
                    </span>
                    <span class="badge bg-white/90 text-brand-900 font-bold backdrop-blur-sm">
                      <i data-lucide="sparkles" class="w-3 h-3 text-harvest inline mr-0.5"></i> ${Math.round(l.aiConfidence * 100)}% Match
                    </span>
                  </div>
                  <div class="absolute bottom-3 right-3 bg-brand-900/90 text-white px-3 py-1 rounded-xl text-sm font-extrabold backdrop-blur-sm">
                    ${formatMoney(l.price)} <span class="text-xs font-normal text-white/80">/ ${l.unit}</span>
                  </div>
                </div>

                <div class="p-5 space-y-2">
                  <div class="flex items-center justify-between">
                    <h3 class="font-extrabold text-brand-900 text-xl">${l.wasteType}</h3>
                    <div class="text-right">
                      <span class="text-xs font-bold text-gray-800 block">${l.quantity} ${l.unit}</span>
                      <span class="text-[10px] font-bold text-sprout block">🚜 ~${trolleyEst} Trolleys</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs text-gray-500">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                    <span>${l.city}, ${l.state}</span>
                    <span class="text-gray-300">·</span>
                    <span class="text-sprout font-bold">${l.distanceKm || '12'} km away</span>
                  </div>

                  <p class="text-xs text-gray-600 line-clamp-2">${l.description}</p>

                  <div class="pt-2 flex flex-wrap gap-1">
                    ${(l.uses || []).slice(0, 3).map(u => `
                      <span class="px-2 py-0.5 rounded-full bg-brand-50 text-brand-900 text-[10px] font-semibold">${u}</span>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2">
                <button onclick="window.AgriCycle.openOfferModal(${l.id})" class="btn-primary flex-1 !py-2 text-xs font-bold">
                  Make an Offer
                </button>
                <button onclick="window.AgriCycle.instantBuy(${l.id})" class="btn-harvest flex-1 !py-2 text-xs font-bold">
                  Buy Now &rarr;
                </button>
                <button onclick="window.AgriCycle.shareListingWhatsapp(${l.id})" class="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition" title="Share Deal Card on WhatsApp">
                  <i data-lucide="share-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 16. Industry Dashboard (/industry/dashboard)
  function renderIndustryDashboard() {
    const u = state.currentUser;
    const myOrders = state.orders.filter(o => o.buyerId === u.id);
    const myOffers = state.offers.filter(o => o.buyerId === u.id);
    const completed = myOrders.filter(o => o.status === 'completed');
    const totalTonsSourced = completed.reduce((sum, o) => sum + o.quantity, 0);
    const totalSpent = completed.reduce((sum, o) => sum + o.totalAmount, 0);

    return `
      ${renderNavbar()}
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-8 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Industry Procurement</span>
          <h1 class="text-3xl font-extrabold text-brand-900">${u.companyName || u.name}</h1>
          <p class="text-xs sm:text-sm text-gray-600">Secure circular agricultural raw materials directly from verified local farmers.</p>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Active Purchases</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${myOrders.filter(o => o.status !== 'completed').length}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Pending Offers</span>
            <strong class="text-2xl font-extrabold text-harvest block mt-1">${myOffers.filter(o => o.status === 'pending').length}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Completed Pickups</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${completed.length}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Biomass Sourced</span>
            <strong class="text-2xl font-extrabold text-sprout block mt-1">${totalTonsSourced} Tons</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200 col-span-2 lg:col-span-1">
            <span class="text-xs text-gray-500 font-medium block">Procurement Spend</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${formatMoney(totalSpent)}</strong>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 class="font-extrabold text-brand-900 text-lg">Active Supply Orders</h3>
              <a href="#/industry/orders" class="text-xs font-bold text-sprout hover:underline">Track Pickups &rarr;</a>
            </div>

            <div class="divide-y divide-gray-100">
              ${myOrders.map(o => `
                <div class="py-3 flex items-center justify-between gap-3">
                  <div>
                    <strong class="text-sm font-bold text-brand-900 block">${o.listingTitle} (${o.orderNumber})</strong>
                    <span class="text-xs text-gray-500">${o.quantity} ${o.unit} from ${o.farmerName} · Pickup: ${formatDate(o.pickupDate)}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-extrabold text-brand-900 block">${formatMoney(o.totalAmount)}</span>
                    <span class="badge badge-${o.status}">${o.status.replace('_', ' ')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
            <h3 class="font-extrabold text-brand-900 text-lg">AI Sourcing Insights</h3>
            <div class="space-y-3 text-xs">
              <div class="p-3 bg-brand-50 rounded-xl border border-brand-100">
                <strong class="text-brand-900 font-bold block mb-1">Local Logistics Saving</strong>
                <p class="text-gray-600">Procuring Rice Husk from Ramesh Patel (8.5 km away) saves ~₹450/ton in truck freight compared to Bellary.</p>
              </div>
              <div class="p-3 bg-brand-50 rounded-xl border border-brand-100">
                <strong class="text-brand-900 font-bold block mb-1">Seasonal Price Trend</strong>
                <p class="text-gray-600">Paddy straw supply peaking this week. Ideal window to book 40 tons at ₹2,100/ton.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 17. Admin Portal (/admin/*)
  function renderAdmin() {
    const totalUsers = state.users.length;
    const farmers = state.users.filter(u => u.role === 'farmer').length;
    const industries = state.users.filter(u => u.role === 'industry').length;
    const activeListings = state.listings.filter(l => l.status === 'available').length;
    const totalTons = state.orders.reduce((sum, o) => sum + o.quantity, 0);

    return `
      ${renderNavbar()}
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 space-y-8 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Platform Administration</span>
          <h1 class="text-3xl font-extrabold text-brand-900">AgriCycle Operations Command</h1>
          <p class="text-xs sm:text-sm text-gray-600">Monitor ecosystem health, user verification badges, and waste diversion totals.</p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Total Participants</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${totalUsers}</strong>
            <span class="text-[10px] text-gray-500 mt-1 block">${farmers} Farmers · ${industries} Mills</span>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Active Listings</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${activeListings}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Platform Orders</span>
            <strong class="text-2xl font-extrabold text-brand-900 block mt-1">${state.orders.length}</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200">
            <span class="text-xs text-gray-500 font-medium block">Waste Reused</span>
            <strong class="text-2xl font-extrabold text-sprout block mt-1">${totalTons} Tons</strong>
          </div>
          <div class="glass-card p-4 rounded-2xl bg-white border border-brand-200 col-span-2 lg:col-span-1">
            <span class="text-xs text-gray-500 font-medium block">AI Mode</span>
            <strong class="text-xl font-extrabold text-brand-900 block mt-1">Smart Demo AI</strong>
            <span class="text-[10px] text-sprout font-bold block">Zero Crashes Guaranteed</span>
          </div>
        </div>

        <!-- User Management Table with Verification Badge Toggles -->
        <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-brand-900 text-lg">Platform Participants</h3>
            <span class="text-xs text-gray-500">Toggle verification badge to establish market trust</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 border-b border-gray-200 text-gray-500">
                <tr>
                  <th class="p-3">Name / Entity</th>
                  <th class="p-3">Role</th>
                  <th class="p-3">Location</th>
                  <th class="p-3">Email & Phone</th>
                  <th class="p-3">Verification Badge</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${state.users.map(user => `
                  <tr>
                    <td class="p-3">
                      <strong class="font-bold text-brand-900 block">${user.companyName || user.name}</strong>
                      <span class="text-[10px] text-gray-500">${user.role === 'farmer' ? `${user.farmSize || 10} Acres` : user.industryType || 'Mill'}</span>
                    </td>
                    <td class="p-3 capitalize font-semibold">${user.role}</td>
                    <td class="p-3">${user.city}, ${user.state}</td>
                    <td class="p-3">${user.email}<br><span class="text-gray-400">${user.phone || ''}</span></td>
                    <td class="p-3">
                      <span class="badge ${user.verified ? 'badge-verified' : 'bg-gray-100 text-gray-500'}">
                        ${user.verified ? '✓ Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button onclick="window.AgriCycle.toggleUserVerification(${user.id})" class="text-xs font-bold ${user.verified ? 'text-amber-600 hover:text-amber-800' : 'text-sprout hover:underline'}">
                        ${user.verified ? 'Revoke Badge' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 18. Informational Pages (/how-it-works, /about)
  function renderHowItWorks() {
    return `
      ${renderNavbar()}
      <div class="max-w-4xl mx-auto px-4 md:px-8 py-12 flex-1 space-y-8 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">The Lifecycle</span>
          <h1 class="text-4xl font-extrabold text-brand-900">How AgriCycle Works</h1>
          <p class="text-gray-600 mt-2">A transparent marketplace from field stubble to renewable industrial product.</p>
        </div>

        <div class="grid gap-6">
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 flex items-start gap-4">
            <span class="w-12 h-12 rounded-2xl bg-harvest/20 text-brand-900 font-bold flex items-center justify-center shrink-0 text-xl">1</span>
            <div>
              <h3 class="text-lg font-bold text-brand-900">Upload & Computer Vision Identification</h3>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed">The farmer snaps a photo of their leftover straw or husk. Our neural network classifies the material type, estimates moisture, and suggests potential commercial applications.</p>
            </div>
          </div>
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 flex items-start gap-4">
            <span class="w-12 h-12 rounded-2xl bg-sprout/20 text-sprout font-bold flex items-center justify-center shrink-0 text-xl">2</span>
            <div>
              <h3 class="text-lg font-bold text-brand-900">Fair Regional Pricing Intelligence</h3>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed">Rather than being exploited by middlemen, the farmer receives local benchmark price guidance based on energy density and demand within their district.</p>
            </div>
          </div>
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 flex items-start gap-4">
            <span class="w-12 h-12 rounded-2xl bg-brand-100 text-brand-900 font-bold flex items-center justify-center shrink-0 text-xl">3</span>
            <div>
              <h3 class="text-lg font-bold text-brand-900">Direct Contract & Pickup Coordination</h3>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed">Buyers submit offers. The farmer reviews and confirms pickup slots. The order tracking stepper keeps driver dispatch and weighbridge weigh-ins accountable.</p>
            </div>
          </div>
          <div class="glass-card p-6 rounded-3xl bg-white border border-brand-200 flex items-start gap-4">
            <span class="w-12 h-12 rounded-2xl bg-harvest/20 text-brand-900 font-bold flex items-center justify-center shrink-0 text-xl">4</span>
            <div>
              <h3 class="text-lg font-bold text-brand-900">Fast Settlement & Circular Second Harvest</h3>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed">Funds are settled directly to the farmer's bank account while the industrial buyer gets certified carbon credits for avoiding open-air crop burning.</p>
            </div>
          </div>
        </div>

        <div class="text-center pt-4">
          <a href="#/register" class="btn-primary !py-3 !px-8 text-sm font-bold">Join the Movement &rarr;</a>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  function renderAbout() {
    return `
      ${renderNavbar()}
      <div class="max-w-4xl mx-auto px-4 md:px-8 py-12 flex-1 space-y-8 text-left">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sprout">Our Mission</span>
          <h1 class="text-4xl font-extrabold text-brand-900">A Circular Harvest for India</h1>
          <p class="text-gray-600 mt-2">Solving the crop burning dilemma through economic empowerment.</p>
        </div>

        <div class="glass-card p-8 rounded-3xl bg-white border border-brand-200 space-y-4 leading-relaxed text-sm text-gray-700">
          <p>
            Every year, over <strong>100 million tons</strong> of agricultural residues are incinerated in fields across India due to lack of market linkage and high transportation costs. This generates thick winter smog, releases harmful pollutants, and wastes invaluable organic matter.
          </p>
          <p>
            <strong>AgriCycle</strong> builds the digital highway that turns stubble into raw material. Bioenergy plants, paper mills, packaging manufacturers, and biochar converters need tons of biomass every single day. By matchmaking nearby producers with industrial users, we eliminate needless transportation overhead and put direct earnings into the hands of our farmers.
          </p>
        </div>
      </div>
      ${renderFooter()}
    `;
  }

  // 19. Modals (Make Offer, Counter Offer, Pickup Scheduling, Rating)
  function openOfferModal(listingId) {
    const listing = state.listings.find(l => l.id === listingId);
    if (!listing) return;

    showModal(`
      <div class="space-y-4 text-left">
        <h3 class="text-xl font-extrabold text-brand-900">Make an Offer for ${listing.wasteType}</h3>
        <p class="text-xs text-gray-500">Listing: ${listing.quantity} ${listing.unit} in ${listing.city} · Listed by ${listing.farmerName}</p>
        
        <form onsubmit="window.AgriCycle.submitOffer(event, ${listing.id})" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Quantity (${listing.unit})</label>
              <input type="number" id="offer-qty" required value="${listing.quantity}" max="${listing.quantity}" min="0.1" step="0.5" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Offer Price (₹/${listing.unit})</label>
              <input type="number" id="offer-price" required value="${listing.price}" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Proposed Pickup Date</label>
            <input type="date" id="offer-date" required value="${listing.availableDate || '2026-10-16'}" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Message to Farmer</label>
            <textarea id="offer-msg" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">We are ready to lift this lot with our own transport lorry on the requested date.</textarea>
          </div>
          <button type="submit" class="btn-primary w-full !py-2.5 font-bold text-sm">
            Send Official Offer to Farmer &rarr;
          </button>
        </form>
      </div>
    `);
  }

  function openCounterOfferModal(offerId) {
    const offer = state.offers.find(o => o.id === offerId);
    if (!offer) return;

    showModal(`
      <div class="space-y-4 text-left">
        <h3 class="text-xl font-extrabold text-brand-900">Counter Offer</h3>
        <p class="text-xs text-gray-500">Proposed buyer rate: ${formatMoney(offer.price)}/${offer.unit} for ${offer.quantity} ${offer.unit}.</p>
        
        <form onsubmit="window.AgriCycle.submitCounterOffer(event, ${offer.id})" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Your Counter Price (₹/${offer.unit})</label>
            <input type="number" id="counter-price" required value="${offer.price + 200}" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Counter Message / Explanation</label>
            <textarea id="counter-msg" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">Residue has low moisture (&lt;8%) and is already baled and ready for fast loading.</textarea>
          </div>
          <button type="submit" class="btn-primary w-full !py-2.5 font-bold text-sm">
            Send Counter Offer to Buyer
          </button>
        </form>
      </div>
    `);
  }

  function openPickupModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    showModal(`
      <div class="space-y-4 text-left">
        <h3 class="text-xl font-extrabold text-brand-900">Schedule Pickup Logistics</h3>
        <p class="text-xs text-gray-500">Order ${order.orderNumber} · ${order.listingTitle} (${order.quantity} ${order.unit})</p>
        
        <form onsubmit="window.AgriCycle.submitPickupSchedule(event, ${order.id})" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Pickup Date</label>
              <input type="date" id="pickup-date" required value="${order.pickupDate || '2026-10-14'}" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Time Slot</label>
              <input type="text" id="pickup-time" required value="09:30 AM" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Assigned Driver & Vehicle No.</label>
            <input type="text" id="pickup-driver" required value="Venkat Swamy (Lorry AP-02-TX-8821)" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Pickup Gate Location</label>
            <input type="text" id="pickup-address" required value="${order.pickupAddress || 'Farm Gate, Anantapur'}" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm">
          </div>
          <button type="submit" class="btn-primary w-full !py-2.5 font-bold text-sm">
            Confirm & Notify Farmer
          </button>
        </form>
      </div>
    `);
  }

  function openReviewModal(orderId) {
    showModal(`
      <div class="space-y-4 text-left">
        <h3 class="text-xl font-extrabold text-brand-900">Rate Transaction & Leave Review</h3>
        <p class="text-xs text-gray-500">Your feedback builds ecosystem trust and circular credibility.</p>
        
        <form onsubmit="event.preventDefault(); showToast('Thank you! Rating submitted.', 'success'); closeModal();" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Star Rating</label>
            <select class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent Quality & Fast Loading</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars - Good Trade</option>
              <option value="3">⭐⭐⭐ 3 Stars - Average</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Review Comments</label>
            <textarea rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" placeholder="Residue was dry, clean and as described. Smooth weighbridge verification.">Dry high quality residue. Accurate weighbridge measurement and smooth truck loading.</textarea>
          </div>
          <button type="submit" class="btn-primary w-full !py-2.5 font-bold text-sm">
            Submit Verified Review
          </button>
        </form>
      </div>
    `);
  }

  // 20. Main Render Function
  function renderApp() {
    const route = getCurrentRoute();
    const appEl = document.getElementById('app');
    if (!appEl) return;

    let content = '';
    if (route === '/' || route === '') {
      content = renderLanding();
    } else if (route === '/login') {
      content = renderLogin();
    } else if (route.startsWith('/register')) {
      content = renderRegister();
    } else if (route === '/forgot-password') {
      content = renderForgotPassword();
    } else if (route.startsWith('/marketplace')) {
      content = renderMarketplace();
    } else if (route === '/how-it-works') {
      content = renderHowItWorks();
    } else if (route === '/about') {
      content = renderAbout();
    } else if (route === '/farmer/dashboard') {
      content = renderFarmerDashboard();
    } else if (route === '/farmer/listings/new') {
      content = renderNewListing();
    } else if (route === '/farmer/listings') {
      content = renderFarmerListings();
    } else if (route === '/farmer/offers') {
      content = renderFarmerOffers();
    } else if (route === '/farmer/orders') {
      content = renderOrders('farmer');
    } else if (route === '/farmer/earnings') {
      content = renderFarmerEarnings();
    } else if (route === '/farmer/impact') {
      content = renderFarmerImpact();
    } else if (route === '/farmer/buyers') {
      content = renderNearbyBuyers();
    } else if (route === '/farmer/notifications') {
      content = renderFarmerOffers(); // Notifications list
    } else if (route === '/industry/dashboard') {
      content = renderIndustryDashboard();
    } else if (route.startsWith('/industry/marketplace')) {
      content = renderMarketplace();
    } else if (route === '/industry/offers') {
      content = renderFarmerOffers();
    } else if (route === '/industry/orders') {
      content = renderOrders('industry');
    } else if (route === '/industry/suppliers') {
      content = renderNearbyBuyers();
    } else if (route === '/industry/analytics') {
      content = renderFarmerImpact();
    } else if (route.startsWith('/admin')) {
      content = renderAdmin();
    } else {
      content = renderLanding();
    }

    appEl.innerHTML = content;
    lucide.createIcons();
    updateJudgeWalkthroughBar();
  }

  // 21. Hackathon Judge Mode Controller
  const JUDGE_STEPS = [
    { title: "1. Farmer Login (Ramesh Patel)", route: "#/farmer/dashboard", user: SEED_USERS[0] },
    { title: "2. AI Waste Scanner & Price Predictor", route: "#/farmer/listings/new", user: SEED_USERS[0] },
    { title: "3. Published in Marketplace", route: "#/marketplace", user: SEED_USERS[0] },
    { title: "4. Industry Login (Green BioEnergy)", route: "#/industry/dashboard", user: SEED_USERS[1] },
    { title: "5. Search & Make Offer", route: "#/industry/marketplace", user: SEED_USERS[1] },
    { title: "6. Farmer Accepts Offer", route: "#/farmer/offers", user: SEED_USERS[0] },
    { title: "7. Order Stepper & Pickup Logistics", route: "#/farmer/orders", user: SEED_USERS[0] },
    { title: "8. Farmer Earnings & ESG Climate Impact", route: "#/farmer/earnings", user: SEED_USERS[0] }
  ];

  function updateJudgeWalkthroughBar() {
    const textEl = document.getElementById('judge-step-text');
    if (!textEl) return;
    const step = state.judgeStep || 1;
    const current = JUDGE_STEPS[step - 1];
    textEl.textContent = `Step ${step} of 8: ${current.title}`;
  }

  function advanceJudgeStep() {
    let nextStep = (state.judgeStep || 1) + 1;
    if (nextStep > 8) nextStep = 1;
    state.judgeStep = nextStep;
    const stepObj = JUDGE_STEPS[nextStep - 1];
    state.currentUser = stepObj.user;
    saveState();
    showToast(`Judge Mode: ${stepObj.title}`, 'info');
    navigate(stepObj.route);
  }

  function prevJudgeStep() {
    let prevStep = (state.judgeStep || 1) - 1;
    if (prevStep < 1) prevStep = 8;
    state.judgeStep = prevStep;
    const stepObj = JUDGE_STEPS[prevStep - 1];
    state.currentUser = stepObj.user;
    saveState();
    navigate(stepObj.route);
  }

  // 22. Public API and Event Handlers
  window.AgriCycle = {
    quickLogin(role) {
      const u = state.users.find(x => x.role === role) || state.users[0];
      state.currentUser = u;
      saveState();
      showToast(`Logged in as ${u.name} (${u.role.toUpperCase()})`);
      navigate(`/${u.role}/dashboard`);
    },

    switchRole() {
      const currentRole = state.currentUser?.role;
      let targetRole = 'farmer';
      if (currentRole === 'farmer') targetRole = 'industry';
      else if (currentRole === 'industry') targetRole = 'admin';
      else targetRole = 'farmer';

      const target = state.users.find(u => u.role === targetRole);
      state.currentUser = target;
      saveState();
      showToast(`Switched account to ${target.name} (${target.role.toUpperCase()})`);
      navigate(`/${target.role}/dashboard`);
    },

    logout() {
      state.currentUser = null;
      saveState();
      showToast('Logged out successfully');
      navigate('#/');
    },

    handleLoginForm(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        state.currentUser = user;
        saveState();
        showToast(`Welcome back, ${user.name}!`);
        navigate(`/${user.role}/dashboard`);
      } else {
        showToast('Invalid credentials. Use demo button or check email.', 'error');
      }
    },

    setRegRole(role) {
      document.getElementById('reg-role').value = role;
      document.getElementById('farmer-fields').className = role === 'farmer' ? '' : 'hidden';
      document.getElementById('industry-fields').className = role === 'industry' ? 'space-y-3' : 'hidden';
      document.getElementById('reg-role-farmer').className = `py-2 rounded-xl text-xs font-bold transition ${role === 'farmer' ? 'bg-brand-900 text-white shadow' : 'text-gray-600'}`;
      document.getElementById('reg-role-industry').className = `py-2 rounded-xl text-xs font-bold transition ${role === 'industry' ? 'bg-brand-900 text-white shadow' : 'text-gray-600'}`;
    },

    handleRegisterForm(e) {
      e.preventDefault();
      const role = document.getElementById('reg-role').value;
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const city = document.getElementById('reg-city').value.trim();
      const stateName = document.getElementById('reg-state').value.trim();

      const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        role,
        city,
        state: stateName,
        farmSize: Number(document.getElementById('reg-farmsize')?.value) || 10,
        companyName: document.getElementById('reg-company')?.value || name,
        industryType: document.getElementById('reg-industry-type')?.value || 'Biomass Consumer',
        verified: false,
        createdAt: new Date().toISOString()
      };

      state.users.push(newUser);
      state.currentUser = newUser;
      saveState();
      showToast('Account registered successfully! Welcome to AgriCycle.');
      navigate(`/${role}/dashboard`);
    },

    pickSample(type) {
      const cat = WASTE_CATEGORIES[type];
      if (!cat) return;
      document.getElementById('preview-image').src = cat.image;
      document.getElementById('listing-type').value = type;
      window.AgriCycle.runAiScanner(type);
    },

    handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        document.getElementById('preview-image').src = evt.target.result;
        // Run AI Scanner simulation on uploaded file
        window.AgriCycle.runAiScanner('Rice Husk');
      };
      reader.readAsDataURL(file);
    },

    runAiScanner(forcedType) {
      const laser = document.getElementById('scanner-laser');
      if (laser) laser.classList.remove('hidden');

      showToast('AI Vision analyzing uploaded crop residue...', 'info');

      setTimeout(() => {
        if (laser) laser.classList.add('hidden');
        const cat = WASTE_CATEGORIES[forcedType] || WASTE_CATEGORIES['Rice Husk'];

        document.getElementById('ai-waste-name').textContent = cat.name;
        document.getElementById('ai-confidence').textContent = '96% Confidence';
        document.getElementById('ai-uses').textContent = 'Possible uses: ' + cat.uses.join(', ');
        document.getElementById('listing-type').value = cat.name;

        window.AgriCycle.updateAiPriceEstimate();
        showToast(`AI Identified: ${cat.name} (96% Confidence)`);
      }, 1200);
    },

    setLang(lang) {
      state.lang = lang;
      saveState();
      showToast(`Language set to ${lang === 'te' ? 'తెలుగు (Telugu)' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}`);
      renderApp();
    },

    readCurrentPage() {
      let text = "";
      if (state.lang === 'te') {
        text = "వ్యవసాయ వ్యర్థాల మార్కెట్‌ప్లేస్ అగ్రీసైకిల్ కు స్వాగతం. రైతులు గడ్డి, పొట్టు, పిప్పి నేరుగా పరిశ్రమలకు 0% కమీషన్‌తో అమ్మవచ్చు. సరసమైన ధర లభిస్తుంది.";
      } else if (state.lang === 'hi') {
        text = "कृषि अपशिष्ट बाज़ार एग्रीसाइकिल में आपका स्वागत है। किसान पराली, भूसा, खोई सीधे उद्योगों को 0% कमीशन पर बेच सकते हैं।";
      } else {
        text = "Welcome to AgriCycle Agricultural Waste Marketplace. Turn crop residue like straw, husks, and bagasse into direct farmer income with zero commission.";
      }
      toggleVoiceSpeech(text);
    },

    speakFarmerSummary() {
      const u = state.currentUser;
      const completed = state.orders.filter(o => o.farmerId === u.id && o.status === 'completed');
      const earnings = completed.reduce((sum, o) => sum + o.totalAmount, 0);
      const pendingOffers = state.offers.filter(o => o.farmerId === u.id && o.status === 'pending').length;
      let text = "";
      if (state.lang === 'te') {
        text = `నమస్కారం ${u.name} గారు. మీ మొత్తం ఆదాయం ${earnings.toLocaleString('en-IN')} రూపాయలు. మీ వద్ద ${pendingOffers} కొత్త కొనుగోలు ఆఫర్లు పరిశీలనకు సిద్ధంగా ఉన్నాయి.`;
      } else if (state.lang === 'hi') {
        text = `नमस्ते ${u.name} जी। आपकी कुल कमाई ${earnings.toLocaleString('en-IN')} रुपये है। आपके पास ${pendingOffers} नए खरीदार प्रस्ताव हैं।`;
      } else {
        text = `Hello ${u.name}. Your total lifetime earnings are ₹${earnings.toLocaleString('en-IN')}. You have ${pendingOffers} new pending buyer offers.`;
      }
      toggleVoiceSpeech(text);
    },

    speakPriceAdvice() {
      const type = document.getElementById('listing-type')?.value || 'Rice Husk';
      const bounds = getPriceLimits(type);
      let text = "";
      if (state.lang === 'te') {
        text = `${type} కు సిఫార్సు చేసిన మండి కనీస ధర టన్నుకు ${bounds.min} రూపాయలు, గరిష్ట పరిమితి ${bounds.max} రూపాయలు. సరసమైన సిఫార్సు ధర ${bounds.fairRecommended} రూపాయలు.`;
      } else if (state.lang === 'hi') {
        text = `${type} के लिए अनुशंसित मंडी न्यूनतम मूल्य ${bounds.min} रुपये प्रति टन और अधिकतम सीमा ${bounds.max} रुपये है। उचित मूल्य ${bounds.fairRecommended} रुपये है।`;
      } else {
        text = `Fair Mandi guidance for ${type}: Minimum floor is ₹${bounds.min} per ton. Maximum industry cap is ₹${bounds.max} per ton. Recommended fair price is ₹${bounds.fairRecommended} per ton.`;
      }
      toggleVoiceSpeech(text);
    },

    setTractorLoad(trolleyCount) {
      const tons = Number((trolleyCount * 3.5).toFixed(1));
      const qtyInput = document.getElementById('listing-quantity');
      if (qtyInput) {
        qtyInput.value = tons;
        window.AgriCycle.updateAiPriceEstimate();
        window.AgriCycle.checkListingPriceInput();
        showToast(`Selected: ${trolleyCount >= 3.4 ? '1 Lorry Load' : trolleyCount + ' Tractor Trolley(s)'} (${tons} Tons)`);
      }
    },

    checkListingPriceInput() {
      const type = document.getElementById('listing-type')?.value || 'Rice Husk';
      const priceVal = Number(document.getElementById('listing-price')?.value || 0);
      const qtyVal = Number(document.getElementById('listing-quantity')?.value || 1);
      const bounds = getPriceLimits(type);
      const safety = checkPriceSafety(type, priceVal);

      const badge = document.getElementById('mandi-guard-badge');
      const msg = document.getElementById('mandi-guard-msg');
      const box = document.getElementById('mandi-price-guard-box');
      const floor = document.getElementById('mandi-min-floor');
      const cap = document.getElementById('mandi-max-cap');
      const payout = document.getElementById('farmer-net-payout');

      if (floor) floor.textContent = `Min Mandi Floor: ₹${bounds.min.toLocaleString('en-IN')}`;
      if (cap) cap.textContent = `Industry Cap: ₹${bounds.max.toLocaleString('en-IN')}`;
      if (payout) payout.textContent = formatMoney(priceVal * qtyVal);

      if (badge && safety) {
        badge.textContent = safety.badge || '✓ Mandi Guard';
        if (safety.status === 'safe') {
          badge.className = 'badge text-emerald-800 bg-white border border-emerald-300 font-bold';
          if (box) box.className = 'p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs space-y-1';
        } else if (safety.status === 'low') {
          badge.className = 'badge text-amber-800 bg-white border border-amber-300 font-bold';
          if (box) box.className = 'p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs space-y-1';
        } else {
          badge.className = 'badge text-red-800 bg-white border border-red-300 font-bold';
          if (box) box.className = 'p-3 rounded-2xl bg-red-50 border border-red-300 text-xs space-y-1';
        }
      }
      if (msg && safety) {
        msg.textContent = safety.message;
      }
    },

    shareListingWhatsapp(id) {
      const l = state.listings.find(x => x.id === id);
      if (!l) return;
      shareOnWhatsapp(l.wasteType, `${l.quantity} ${l.unit}`, l.price, `${l.city}, ${l.state}`);
    },

    handleTypeChange() {
      const selected = document.getElementById('listing-type').value;
      const cat = WASTE_CATEGORIES[selected];
      if (cat) {
        document.getElementById('preview-image').src = cat.image;
        document.getElementById('ai-waste-name').textContent = cat.name;
        document.getElementById('ai-uses').textContent = 'Possible uses: ' + cat.uses.join(', ');
        window.AgriCycle.updateAiPriceEstimate();
        window.AgriCycle.checkListingPriceInput();
      }
    },

    updateAiPriceEstimate() {
      const type = document.getElementById('listing-type')?.value || 'Rice Husk';
      const cat = WASTE_CATEGORIES[type] || WASTE_CATEGORIES['Rice Husk'];
      const bounds = getPriceLimits(type);
      const priceTag = document.getElementById('ai-price-tag');
      const marketRange = document.getElementById('ai-market-range');
      if (priceTag) priceTag.textContent = formatMoney(bounds.fairRecommended || cat.avgPrice) + ' / ton';
      if (marketRange) marketRange.textContent = `Current Market Range: ₹${bounds.min.toLocaleString('en-IN')} – ₹${bounds.max.toLocaleString('en-IN')}`;
      window.AgriCycle.checkListingPriceInput();
    },

    applySuggestedPrice() {
      const type = document.getElementById('listing-type').value;
      const bounds = getPriceLimits(type);
      const fairPrice = bounds.fairRecommended || 3000;
      document.getElementById('listing-price').value = fairPrice;
      window.AgriCycle.checkListingPriceInput();
      showToast(`Applied fair mandi price: ${formatMoney(fairPrice)}/ton`);
    },

    handlePublishListing(e) {
      e.preventDefault();
      const u = state.currentUser;
      const wasteType = document.getElementById('listing-type').value;
      const quantity = Number(document.getElementById('listing-quantity').value);
      const unit = document.getElementById('listing-unit').value;
      const price = Number(document.getElementById('listing-price').value);
      const location = document.getElementById('listing-location').value;
      const availableDate = document.getElementById('listing-date').value;
      const description = document.getElementById('listing-desc').value;
      const imageUrl = document.getElementById('preview-image').src;
      const cat = WASTE_CATEGORIES[wasteType] || WASTE_CATEGORIES['Rice Husk'];

      const newListing = {
        id: Date.now(),
        farmerId: u.id,
        farmerName: u.name,
        farmerVerified: u.verified,
        wasteType,
        quantity,
        unit,
        price,
        city: u.city || 'Anantapur',
        state: u.state || 'Andhra Pradesh',
        location,
        distanceKm: 9.0,
        availableDate,
        description,
        imageUrl,
        aiConfidence: 0.95,
        status: 'available',
        uses: cat.uses,
        createdAt: new Date().toISOString()
      };

      const safety = checkPriceSafety(wasteType, price);
      if (safety.status === 'low') {
        showToast(`Note: ₹${price.toLocaleString('en-IN')} is below typical mandi harvesting floor (Min: ₹${getPriceLimits(wasteType).min}).`, 'info');
      } else if (safety.status === 'high') {
        showToast(`Note: ₹${price.toLocaleString('en-IN')} is above standard mill procurement ceiling (Max: ₹${getPriceLimits(wasteType).max}).`, 'info');
      }

      state.listings.unshift(newListing);
      saveState();
      showToast(`Your ${wasteType} listing (${(quantity/3.5).toFixed(1)} Trolleys) is now LIVE!`);
      navigate('#/marketplace');
    },

    toggleListingStatus(id) {
      const l = state.listings.find(x => x.id === id);
      if (l) {
        l.status = l.status === 'available' ? 'sold' : 'available';
        saveState();
        showToast(`Listing marked as ${l.status}`);
        renderApp();
      }
    },

    deleteListing(id) {
      if (confirm('Are you sure you want to remove this listing?')) {
        state.listings = state.listings.filter(x => x.id !== id);
        saveState();
        showToast('Listing removed');
        renderApp();
      }
    },

    updateMarketFilters() {
      const search = document.getElementById('market-search')?.value || '';
      const type = document.getElementById('market-type')?.value || '';
      const sort = document.getElementById('market-sort')?.value || 'nearest';
      let path = '#/marketplace?';
      if (search) path += `search=${encodeURIComponent(search)}&`;
      if (type) path += `type=${encodeURIComponent(type)}&`;
      if (sort) path += `sort=${encodeURIComponent(sort)}`;
      navigate(path);
    },

    setFilterType(t) {
      if (t) navigate(`#/marketplace?type=${encodeURIComponent(t)}`);
      else navigate('#/marketplace');
    },

    openOfferModal(id) {
      if (!state.currentUser) {
        showToast('Please sign in as Industry to make offers', 'info');
        navigate('#/login');
        return;
      }
      openOfferModal(id);
    },

    submitOffer(e, listingId) {
      e.preventDefault();
      const listing = state.listings.find(l => l.id === listingId);
      const qty = Number(document.getElementById('offer-qty').value);
      const price = Number(document.getElementById('offer-price').value);
      const date = document.getElementById('offer-date').value;
      const msg = document.getElementById('offer-msg').value;

      const newOffer = {
        id: Date.now(),
        listingId,
        listingTitle: listing.wasteType,
        farmerId: listing.farmerId,
        buyerId: state.currentUser.id,
        buyerName: state.currentUser.companyName || state.currentUser.name,
        buyerVerified: state.currentUser.verified,
        quantity: qty,
        unit: listing.unit,
        price,
        pickupDate: date,
        message: msg,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      state.offers.unshift(newOffer);
      
      // Notify the farmer
      state.notifications.unshift({
        id: Date.now() + 1,
        userId: listing.farmerId,
        title: 'New Offer Received 🔥',
        message: `${newOffer.buyerName} offered ${formatMoney(price)}/${listing.unit} for ${qty} ${listing.unit} of ${listing.wasteType}.`,
        read: false,
        type: 'offer',
        createdAt: new Date().toISOString()
      });

      saveState();
      closeModal();
      showToast('Offer submitted to farmer! They will review shortly.');
      navigate('#/industry/offers');
    },

    instantBuy(listingId) {
      if (!state.currentUser) {
        showToast('Please sign in to place orders', 'info');
        navigate('#/login');
        return;
      }
      const l = state.listings.find(x => x.id === listingId);
      if (!l) return;

      const orderNumber = 'AG-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: Date.now(),
        orderNumber,
        listingId: l.id,
        listingTitle: l.wasteType,
        farmerId: l.farmerId,
        farmerName: l.farmerName,
        buyerId: state.currentUser.id,
        buyerName: state.currentUser.companyName || state.currentUser.name,
        quantity: l.quantity,
        unit: l.unit,
        ratePerUnit: l.price,
        totalAmount: l.price * l.quantity,
        status: 'confirmed',
        pickupDate: l.availableDate || '2026-10-18',
        pickupAddress: l.location,
        createdAt: new Date().toISOString()
      };

      state.orders.unshift(newOrder);
      l.status = 'reserved';
      saveState();
      showToast(`Instant Order ${orderNumber} placed successfully!`);
      navigate(`/${state.currentUser.role}/orders`);
    },

    acceptOffer(offerId) {
      const o = state.offers.find(x => x.id === offerId);
      if (!o) return;
      o.status = 'accepted';

      // Create confirmed order
      const orderNumber = 'AG-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: Date.now(),
        orderNumber,
        listingId: o.listingId,
        listingTitle: o.listingTitle,
        farmerId: o.farmerId,
        farmerName: state.currentUser.name,
        buyerId: o.buyerId,
        buyerName: o.buyerName,
        quantity: o.quantity,
        unit: o.unit,
        ratePerUnit: o.price,
        totalAmount: o.price * o.quantity,
        status: 'confirmed',
        pickupDate: o.pickupDate,
        pickupAddress: 'Farmer Gate, Kalyandurg Road',
        createdAt: new Date().toISOString()
      };

      state.orders.unshift(newOrder);
      saveState();
      showToast(`Offer accepted! Order ${orderNumber} created.`);
      navigate('#/farmer/orders');
    },

    rejectOffer(offerId) {
      const o = state.offers.find(x => x.id === offerId);
      if (o) {
        o.status = 'rejected';
        saveState();
        showToast('Offer declined');
        renderApp();
      }
    },

    openCounterOfferModal(id) {
      openCounterOfferModal(id);
    },

    submitCounterOffer(e, offerId) {
      e.preventDefault();
      const o = state.offers.find(x => x.id === offerId);
      if (!o) return;
      o.status = 'countered';
      o.counterPrice = Number(document.getElementById('counter-price').value);
      o.counterMessage = document.getElementById('counter-msg').value;
      saveState();
      closeModal();
      showToast(`Counter offer of ${formatMoney(o.counterPrice)} sent to buyer!`);
      renderApp();
    },

    openPickupModal(id) {
      openPickupModal(id);
    },

    submitPickupSchedule(e, orderId) {
      e.preventDefault();
      const o = state.orders.find(x => x.id === orderId);
      if (!o) return;
      o.status = 'pickup_scheduled';
      o.pickupDate = document.getElementById('pickup-date').value;
      o.pickupTime = document.getElementById('pickup-time').value;
      o.driverName = document.getElementById('pickup-driver').value;
      o.pickupAddress = document.getElementById('pickup-address').value;
      saveState();
      closeModal();
      showToast('Pickup logistics scheduled successfully!');
      renderApp();
    },

    advanceOrderStep(orderId, newStatus) {
      const o = state.orders.find(x => x.id === orderId);
      if (o) {
        o.status = newStatus;
        saveState();
        showToast(`Order status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);
        renderApp();
      }
    },

    openReviewModal(id) {
      openReviewModal(id);
    },

    toggleUserVerification(userId) {
      const u = state.users.find(x => x.id === userId);
      if (u) {
        u.verified = !u.verified;
        saveState();
        showToast(`Verification status for ${u.name} set to ${u.verified ? 'VERIFIED' : 'UNVERIFIED'}`);
        renderApp();
      }
    }
  };

  // 23. Initialize Judge Bar Controls
  document.getElementById('btn-judge-next')?.addEventListener('click', advanceJudgeStep);
  document.getElementById('btn-judge-prev')?.addEventListener('click', prevJudgeStep);
  document.getElementById('btn-judge-reset')?.addEventListener('click', resetState);
  document.getElementById('btn-judge-toggle')?.addEventListener('click', () => {
    document.getElementById('judge-walkthrough')?.classList.toggle('hidden');
  });

  // 24. Start Application
  renderApp();
})();
