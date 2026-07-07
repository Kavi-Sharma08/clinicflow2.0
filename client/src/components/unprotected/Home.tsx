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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2.5L17.5 6.25v7.5L10 17.5 2.5 13.75V6.25L10 2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 7v6M7 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">
            Clinic<span className="text-blue-600">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
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
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
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
    {/* Background elements */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[80px]" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-[60px]" />
    </div>

    <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Smart Queue Management · Real-Time Updates
      </div>

      {/* Heading */}
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Your health care,{" "}
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          zero waiting
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
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
        >
          Get started — it's free
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
        >
          See how it works
        </a>
      </div>

      {/* Social proof */}
      <p className="mt-8 text-xs text-slate-500">
        Trusted by clinics across India · No credit card required
      </p>
    </div>
  </section>
);

// ── Stats ──────────────────────────────────────────────────────────────────
const Stats: FC = () => {
  const items = [
    { value: "50,000+", label: "Appointments managed" },
    { value: "1,200+", label: "Verified doctors" },
    { value: "98%", label: "Queue accuracy" },
    { value: "< 2 min", label: "Average booking time" },
  ];

  return (
    <section className="border-b border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Features ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M12 6v6l4 2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Live queue tracking",
    description:
      "Know your exact position in the queue in real time. Walk in when it's your turn, not a moment before.",
    color: "bg-blue-50",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Verified doctors only",
    description:
      "Every doctor on ClinicFlow goes through credential verification by our admin team before accepting patients.",
    color: "bg-emerald-50",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Flexible scheduling",
    description:
      "Doctors set weekly availability windows. You pick the slot that works — no back-and-forth calls.",
    color: "bg-violet-50",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Instant notifications",
    description:
      "Get real-time alerts when your appointment status changes, your queue moves, or a slot opens up.",
    color: "bg-amber-50",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Complete medical profile",
    description:
      "Store allergies, chronic conditions, and emergency contacts — ready for every consultation.",
    color: "bg-cyan-50",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Admin control center",
    description:
      "Clinic admins get a full dashboard to track appointments, verify doctors, and monitor live queue activity.",
    color: "bg-pink-50",
  },
];

const Features: FC = () => (
  <section id="features" className="bg-white py-20 sm:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">Everything you need</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          The complete clinic operating system
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500">
          From patient booking to doctor verification, every workflow is handled in one unified platform.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon, title, description, color }) => (
          <div
            key={title}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              {icon}
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── How It Works ───────────────────────────────────────────────────────────
const HowItWorks: FC = () => {
  const patientSteps = [
    { step: "1", title: "Create your account", description: "Sign up as a patient in under 2 minutes. Email verification keeps your account secure." },
    { step: "2", title: "Find a verified doctor", description: "Browse specializations, check real-time availability, and choose a slot that works for you." },
    { step: "3", title: "Book your queue slot", description: "Reserve your position instantly. You'll get a queue number and real-time updates as it progresses." },
    { step: "4", title: "Walk in when it's your turn", description: "Skip the waiting room scramble. Arrive when you're actually about to be seen." },
  ];

  return (
    <section id="how-it-works" className="bg-[#f4f6fa] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">Simple process</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From signup to consultation in 4 steps
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {patientSteps.map(({ step, title, description }) => (
            <div key={step} className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25">
                {step}
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
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
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-400">For doctors</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Run your clinic with confidence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Join ClinicFlow as a verified practitioner. Set your weekly availability, manage your patient
            queue, and keep detailed appointment records — all from one clean dashboard.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Professional credential verification",
              "Flexible weekly availability scheduling",
              "Live appointment queue management",
              "Patient history and notes",
              "Real-time queue status updates",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5l2 2 4-4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/signup"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Register as a doctor
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Doctor dashboard preview</p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Today's appointments", value: "12", color: "text-blue-400" },
              { label: "Completed consultations", value: "8", color: "text-emerald-400" },
              { label: "Queue position", value: "#4", color: "text-amber-400" },
              { label: "Active availability slots", value: "5", color: "text-violet-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── CTA ────────────────────────────────────────────────────────────────────
const CTA: FC = () => (
  <section className="bg-blue-600 py-16">
    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Ready to modernize your clinic experience?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base text-blue-100">
        Join thousands of patients and doctors who are already using ClinicFlow to eliminate waiting room chaos.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          to="/signup"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-bold text-blue-600 shadow-lg transition hover:-translate-y-0.5"
        >
          Create free account
        </Link>
        <Link
          to="/login"
          className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-white/30 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Sign in
        </Link>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.5L17.5 6.25v7.5L10 17.5 2.5 13.75V6.25L10 2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 7v6M7 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-slate-900">
                Clinic<span className="text-blue-600">Flow</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
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
                      className="text-sm text-slate-500 transition hover:text-blue-600"
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
    <Stats />
    <Features />
    <HowItWorks />
    <ForDoctors />
    <CTA />
    <Footer />
  </>
);

export default Home;