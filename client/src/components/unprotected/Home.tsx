import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

// ── Navbar ─────────────────────────────────────────────────────────────────
const Navbar: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Doctors", href: "#for-doctors" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-600)] text-white shadow-md shadow-[rgba(2,132,199,0.28)]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2.5L17.5 6.25v7.5L10 17.5 2.5 13.75V6.25L10 2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 7v6M7 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">
            Clinic<span className="text-[var(--color-primary-600)]">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-[var(--color-primary-600)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(2,132,199,0.25)] transition hover:bg-[var(--color-primary-700)] hover:shadow-md hover:shadow-[rgba(2,132,199,0.3)]"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 md:hidden"
        >
          <span className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 rounded-full bg-slate-700 transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <ul className="space-y-1">
            {navItems.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--color-primary-700)]"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Hero ───────────────────────────────────────────────────────────────────
const Hero: FC = () => (
  <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28 lg:py-36">
    {/* Background glow effects */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/3 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[var(--color-primary-600)]/15 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--color-primary-500)]/10 blur-[80px]" />
    </div>

    <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
      {/* Floating live queue mockup positioned gracefully on upper right (desktop/tablet) */}
      <div className="pointer-events-none mb-6 flex justify-center lg:absolute lg:-top-6 lg:right-6 lg:mb-0 lg:block">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-primary-300)]/20 bg-slate-900/85 px-4 py-3 shadow-[0_16px_36px_rgba(2,132,199,0.22)] backdrop-blur-md transition-all duration-300">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-600)] text-white shadow-md shadow-[rgba(2,132,199,0.35)]">
            <span className="text-sm font-bold tracking-tight">#3</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary-400)] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-primary-500)]" />
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white">You're #3 in queue</p>
              <span className="rounded-full bg-[var(--color-primary-500)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary-300)] border border-[var(--color-primary-400)]/30">
                Live Status
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Dr. Sharma · Est. wait ~6 mins</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-400)] animate-pulse" />
          Smart Queue Management · Real-Time Updates
        </div>

        {/* Heading: H1 56-64px with Playfair Display SemiBold Italic accent on "zero waiting" */}
        <h1 className="mt-8 text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-bold tracking-tight text-white leading-[1.12]">
          Your health care,{" "}
          <span className="relative inline-block">
            {/* Subtle radial glow in primary-500 behind "zero waiting" */}
            <span
              className="absolute -inset-x-8 -inset-y-3 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.3)_0%,transparent_70%)] blur-lg pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="italic font-semibold bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              zero waiting
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Book verified doctors, track your queue position in real time, and walk in exactly when it's
          your turn — no more crowded waiting rooms.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-7 text-sm font-bold text-white shadow-lg shadow-[rgba(2,132,199,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-700)] hover:shadow-xl hover:shadow-[rgba(2,132,199,0.35)]"
          >
            Get started — it's free
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/25"
          >
            See how it works
          </a>
        </div>

        {/* Reassurance */}
        <p className="mt-8 text-xs text-slate-500">
          Built for clinics of every size · No credit card required
        </p>
      </div>
    </div>
  </section>
);

// ── Capability Strip ───────────────────────────────────────────────────────
const CapabilityStrip: FC = () => {
  const capabilities = [
    {
      label: "Real-time",
      description: "Queue updates as they happen",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Verified",
      description: "Every doctor manually credential-checked",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      label: "Zero calls",
      description: "Book without back-and-forth",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Live",
      description: "Track your exact position",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-b border-slate-200/80 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 divide-y divide-[var(--color-primary-200)] sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
          {capabilities.map(({ label, description, icon }) => (
            <div key={label} className="flex flex-col items-center py-6 px-4 text-center first:pt-0 last:pb-0 sm:py-2">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
                {icon}
              </div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{label}</p>
              <p className="mt-1.5 text-sm font-medium text-[#475569]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Features ───────────────────────────────────────────────────────────────
const Features: FC = () => {
  const otherFeatures = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      title: "Verified doctors only",
      description:
        "Every doctor on ClinicFlow undergoes rigorous credential verification by our medical admin team before taking appointments.",
      bgTint: "bg-[var(--color-primary-50)]",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      title: "Flexible scheduling",
      description:
        "Doctors set weekly availability windows. Patients pick slots that fit their schedule with zero back-and-forth phone calls.",
      bgTint: "bg-[var(--color-primary-100)]",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      title: "Instant notifications",
      description:
        "Receive real-time alerts when your appointment status changes, your queue moves forward, or a priority slot opens up.",
      bgTint: "bg-[var(--color-primary-50)]",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      title: "Complete medical profile",
      description:
        "Securely store allergies, chronic conditions, and emergency contacts — instantly available for each doctor consultation.",
      bgTint: "bg-[var(--color-primary-100)]",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: "Admin control center",
      description:
        "Clinic administrators get a comprehensive dashboard to track appointments, verify practitioners, and oversee live queue operations.",
      bgTint: "bg-[var(--color-primary-50)]",
    },
  ];

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Asymmetric Section Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary-600)]">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl sm:text-[36px] lg:text-[40px] font-bold tracking-tight text-slate-900 leading-tight">
              The complete clinic operating system
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[#475569]">
            From real-time patient queuing to credential verification, every healthcare workflow is
            orchestrated in one intuitive, unified platform.
          </p>
        </div>

        {/* Features Grid with Featured 2-Column Card */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Featured 2-Column Live Queue Tracking */}
          <div className="group rounded-2xl border border-[var(--color-primary-200)] bg-gradient-to-br from-white via-[var(--color-primary-50)]/40 to-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 lg:col-span-2">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-100)] text-[var(--color-primary-600)] shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="mt-5 flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-[22px] font-semibold text-[#0f172a]">
                    Live queue tracking
                  </h3>
                  <span className="rounded-full bg-[var(--color-primary-600)] px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    Core Feature
                  </span>
                </div>
                <p className="mt-2.5 text-base leading-relaxed text-[#475569]">
                  Know your exact position in the queue in real time. Walk in when it's your turn,
                  not a moment before. Say goodbye to packed waiting rooms and wasted hours.
                </p>
                <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5 text-[var(--color-primary-700)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />
                    Real-time WebSocket sync
                  </span>
                  <span className="flex items-center gap-1.5 text-[var(--color-primary-700)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />
                    SMS & browser alerts
                  </span>
                  <span className="flex items-center gap-1.5 text-[var(--color-primary-700)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />
                    Turn-by-turn wait times
                  </span>
                </div>
              </div>

              {/* Live-looking visual element */}
              <div className="shrink-0 w-full md:w-64 rounded-xl border border-[var(--color-primary-200)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Status</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary-600)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-primary-500)] animate-ping" />
                    Now Calling
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Current Token</p>
                    <p className="text-2xl font-extrabold text-[var(--color-primary-600)]">#14</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Your Token</p>
                    <p className="text-2xl font-extrabold text-slate-900">#16</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Queue progress</span>
                    <span className="font-semibold text-[var(--color-primary-600)]">2 ahead</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-primary-600)]" style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining 5 Cards */}
          {otherFeatures.map(({ icon, title, description, bgTint }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-primary-200)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgTint} shadow-sm`}>
                {icon}
              </div>
              <h3 className="mt-4 text-[19px] font-semibold text-[#0f172a]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── How It Works ───────────────────────────────────────────────────────────
const HowItWorks: FC = () => {
  const patientSteps = [
    {
      step: "1",
      title: "Create your account",
      description:
        "Sign up as a patient in under 2 minutes. Email verification keeps your medical profile secure.",
    },
    {
      step: "2",
      title: "Find a verified doctor",
      description:
        "Browse specializations, review real-time clinic availability, and select a slot that fits your routine.",
    },
    {
      step: "3",
      title: "Book your queue slot",
      description:
        "Reserve your spot instantly. Receive a live token and track queue movements directly on your device.",
    },
    {
      step: "4",
      title: "Walk in when it's time",
      description:
        "Skip the crowded waiting room scramble. Arrive right when your doctor is ready to see you.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#f8fafc] py-20 sm:py-24 border-y border-slate-200/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Asymmetric Left-Aligned Header */}
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary-600)]">
            Simple process
          </p>
          <h2 className="mt-3 text-3xl sm:text-[36px] lg:text-[40px] font-bold tracking-tight text-slate-900 leading-tight">
            From signup to consultation in 4 steps
          </h2>
          <p className="mt-3 text-base text-[#475569]">
            A seamless patient journey designed to put your time and convenience first.
          </p>
        </div>

        {/* Steps with Horizontal Progression Connector Line */}
        <div className="relative mt-16">
          {/* Connecting line running through the 4 numbered circles */}
          <div
            className="pointer-events-none absolute top-6 left-8 right-8 hidden h-0.5 border-t-2 border-dashed border-[var(--color-primary-300)]/70 lg:block z-0"
            aria-hidden="true"
          />

          <div className="relative z-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {patientSteps.map(({ step, title, description }) => (
              <div
                key={step}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-primary-300)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-600)] text-base font-bold text-white shadow-md shadow-[rgba(2,132,199,0.25)] ring-4 ring-white">
                  {step}
                </div>
                <h3 className="mt-5 text-[19px] font-semibold text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── For Doctors ────────────────────────────────────────────────────────────
const ForDoctors: FC = () => (
  <section id="for-doctors" className="bg-slate-950 py-20 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Left Column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary-400)]">
            For doctors
          </p>
          {/* H2 36-40px with Playfair Display accent on "with confidence" */}
          <h2 className="mt-3 text-3xl sm:text-[36px] lg:text-[40px] font-bold tracking-tight text-white leading-tight">
            Run your clinic{" "}
            <span
              className="italic font-semibold bg-gradient-to-r from-[var(--color-primary-300)] to-[var(--color-primary-400)] bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              with confidence
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Join ClinicFlow as a verified practitioner. Set your weekly availability, manage your patient
            queue, and keep detailed appointment records — all from one clean dashboard.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              "Professional credential verification",
              "Flexible weekly availability scheduling",
              "Live appointment queue management",
              "Patient history and notes",
              "Real-time queue status updates",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/signup"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 hover:text-[var(--color-primary-700)]"
          >
            Register as a doctor
          </Link>
        </div>

        {/* Right Column: Redesigned Elevated Doctor Dashboard Preview UI */}
        <div className="relative">
          {/* Soft primary glow behind panel */}
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-[var(--color-primary-600)]/15 blur-2xl"
            aria-hidden="true"
          />

          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,132,199,0.18)] backdrop-blur-xl lg:p-8">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-600)] text-xs font-bold text-white">
                  DR
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dr. Sarah Jenkins</p>
                  <p className="text-[11px] text-slate-400">Cardiology Clinic · Active Session</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-500)]/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary-400)] border border-[var(--color-primary-500)]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-400)] animate-pulse" />
                Live Dashboard
              </span>
            </div>

            {/* Stat Rows as Rounded Cards/Pills */}
            <div className="mt-5 space-y-3.5">
              {/* Stat 1 */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[var(--color-primary-400)]" />
                  <span className="text-sm font-medium text-slate-300">Today's appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">12</span>
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                    Scheduled
                  </span>
                </div>
              </div>

              {/* Stat 2: With colored progress bar for Completed consultations (8/12) */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition hover:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Completed consultations</span>
                  <span className="text-sm font-bold text-white">
                    8 <span className="text-xs font-normal text-slate-400">/ 12</span>
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary-600)] transition-all duration-500"
                    style={{ width: "66.7%" }}
                  />
                </div>
              </div>

              {/* Stat 3: With pulsing live-status dot next to Queue position #4 */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary-400)] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-primary-500)]" />
                  </span>
                  <span className="text-sm font-medium text-slate-300">Queue position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Currently serving</span>
                  <span className="rounded-lg bg-[var(--color-primary-600)]/20 border border-[var(--color-primary-500)]/30 px-2.5 py-1 text-sm font-bold text-[var(--color-primary-300)]">
                    #4
                  </span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[var(--color-primary-300)]" />
                  <span className="text-sm font-medium text-slate-300">Active availability slots</span>
                </div>
                <span className="text-base font-bold text-[var(--color-primary-300)]">5 slots open</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── CTA ────────────────────────────────────────────────────────────────────
const CTA: FC = () => (
  <section className="bg-[#0f172a] py-20 border-t border-slate-800">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        {/* Left: Text & CTA Buttons */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/10 px-3.5 py-1 text-xs font-semibold text-[var(--color-primary-400)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-400)]" />
            Modernize Your Practice
          </div>
          <h2 className="mt-4 text-3xl sm:text-[38px] lg:text-[42px] font-bold tracking-tight text-white leading-tight">
            Ready to modernize your clinic experience?
          </h2>
          <p className="mt-4 max-w-xl text-base text-slate-300 leading-relaxed">
            Start running your clinic the modern way — no waiting rooms, no back-and-forth calls, no chaos.
          </p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-7 text-sm font-bold text-white shadow-lg shadow-[rgba(2,132,199,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-700)]"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-7 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Right: Decorative Visual with Abstract Queue Graphic & Overlapping Primary Rings */}
        <div className="relative flex justify-center lg:col-span-5">
          {/* Overlapping soft glowing primary circles */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-[var(--color-primary-700)]/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-[var(--color-primary-500)]/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
            {/* Visual concentric rings accent */}
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[var(--color-primary-700)]/40 animate-[spin_18s_linear_infinite]" />
              <div className="absolute inset-3 rounded-full border border-[var(--color-primary-500)]/40" />
              <div className="absolute inset-6 rounded-full bg-[var(--color-primary-600)]/15" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-600)] text-white shadow-lg shadow-[rgba(2,132,199,0.4)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>

            {/* Simulated Live Token Card */}
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Digital Queue Token</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary-400)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-400)] animate-ping" />
                  Active
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black tracking-tight text-white">#42</p>
                <p className="text-xs font-semibold text-[var(--color-primary-300)]">Next in line</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-400">
                <span>Room 3B · Cardiology</span>
                <span>Est: 2 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Footer ──────────────────────────────────────────────────────────────────
const Footer: FC = () => {
  const links: Record<string, { label: string; href: string }[]> = {
    "For Patients": [
      { label: "Book Appointment", href: "/signup" },
      { label: "Track Queue", href: "/login" },
      { label: "Find Doctors", href: "/signup" },
      { label: "My Profile", href: "/login" },
    ],
    "For Doctors": [
      { label: "Doctor Login", href: "/login" },
      { label: "Register", href: "/signup" },
      { label: "Manage Queue", href: "/login" },
      { label: "Availability", href: "/login" },
    ],
    Company: [
      { label: "About ClinicFlow", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Contact", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-slate-200 bg-white pt-12 pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-600)] text-white shadow-sm shadow-[rgba(2,132,199,0.2)]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.5L17.5 6.25v7.5L10 17.5 2.5 13.75V6.25L10 2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 7v6M7 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-slate-900">
                Clinic<span className="text-[var(--color-primary-600)]">Flow</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              The modern clinic operating system. Real-time queues, verified doctors, and seamless patient journeys.
            </p>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h5 className="text-[13px] font-bold text-slate-900">{heading}</h5>
              <ul className="mt-3 space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-[#475569] transition hover:text-[var(--color-primary-600)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">© 2026 ClinicFlow. All rights reserved.</p>
          <p className="text-xs text-slate-400">Built for better healthcare experiences.</p>
        </div>
      </div>
    </footer>
  );
};

// ── Home Page ──────────────────────────────────────────────────────────────
const Home: FC = () => (
  <>
    <Navbar />
    <Hero />
    <CapabilityStrip />
    <Features />
    <HowItWorks />
    <ForDoctors />
    <CTA />
    <Footer />
  </>
);

export default Home;