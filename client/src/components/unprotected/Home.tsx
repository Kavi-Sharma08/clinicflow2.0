import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { NavLink } from "../../types/home.types";
import { navLinks } from "../../constants/home";

// ── Navbar ────────────────────────────────────────────────────────
const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-[#D9E6F7] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4 sm:gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3" onClick={closeMenu}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0057A8] rounded-xl grid place-items-center text-base sm:text-lg">🏥</div>
          <span className="font-serif text-lg sm:text-xl text-[#0A1628] font-semibold">
            Clinic<span className="text-[#0057A8]">Flow</span>
          </span>
        </Link>

        {/* Links (desktop) */}
        <ul className="hidden md:flex gap-1 list-none m-0 p-0">
          {navLinks.map(({ label, href }: NavLink) => (
            <li key={label}>
              <a 
                href={href}
                className="text-[#64748B] hover:text-[#0057A8] hover:bg-blue-50 font-medium text-sm px-3 py-2 rounded-lg transition-colors block"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full border-2 border-[#0057A8] text-[#0057A8] font-semibold text-sm hover:bg-[#0057A8] hover:text-white transition-all"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full bg-[#0057A8] text-white font-semibold text-sm hover:bg-[#003f7d] transition-all"
          >
            Book Now
          </Link>
        </div>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          className="flex md:hidden flex-col justify-center gap-1.5 w-9 h-9 p-0 border-none bg-transparent cursor-pointer"
        >
          <span className="block w-6 h-0.5 bg-[#0A1628] rounded-full" />
          <span className="block w-6 h-0.5 bg-[#0A1628] rounded-full" />
          <span className="block w-6 h-0.5 bg-[#0A1628] rounded-full" />
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-4 sm:px-6 py-4 border-t border-[#D9E6F7] bg-white">
          <ul className="flex flex-col gap-1 list-none m-0 p-0">
            {navLinks.map(({ label, href }: NavLink) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={closeMenu}
                  className="text-[#64748B] hover:text-[#0057A8] hover:bg-blue-50 font-medium text-sm px-3 py-2 rounded-lg transition-colors block"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              to="/login"
              onClick={closeMenu}
              className="px-5 py-2 rounded-full border-2 border-[#0057A8] text-[#0057A8] font-semibold text-sm text-center hover:bg-[#0057A8] hover:text-white transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={closeMenu}
              className="px-5 py-2 rounded-full bg-[#0057A8] text-white font-semibold text-sm text-center hover:bg-[#003f7d] transition-all"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Hero ──────────────────────────────────────────────────────────
const Hero: FC = () => (
  <section className="bg-linear-to-br from-[#0057A8] via-[#0072c6] to-[#005fa3] text-white py-16 sm:py-20 lg:py-28 relative overflow-hidden">

    {/* Background blobs */}
    <div className="absolute -top-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 lg:w-125 lg:h-125 rounded-full bg-white/5 pointer-events-none" />
    <div className="absolute -bottom-28 -left-16 w-56 h-56 sm:w-72 sm:h-72 lg:w-87.5 lg:h-87.5 rounded-full bg-cyan-400/10 pointer-events-none" />

    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative z-10">

      {/* Label */}
      <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-xs font-medium mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Smart Queue Management · Real-Time Updates
      </div>

      {/* Heading */}
      <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5 max-w-2xl">
        Your Health,{" "}
        <em className="not-italic text-cyan-300">Zero Waiting</em>,{" "}
        Guaranteed
      </h1>

      {/* Subheading */}
      <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8 sm:mb-10 max-w-lg">
        Book appointments, track your queue position live, and walk in exactly when it's your turn — no crowded waiting rooms.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
        <Link
          to="/signup"
          className="px-7 py-3 rounded-full bg-white text-[#0057A8] font-semibold text-sm hover:-translate-y-0.5 transition-transform"
        >
          Get Started Free
        </Link>
        <a
          href="#how"
          className="px-7 py-3 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform"
        >
          See How It Works
        </a>
      </div>

    </div>
  </section>
);

// ── Footer ────────────────────────────────────────────────────────
const Footer: FC = () => {
  const links: Record<string, string[]> = {
    "For Patients": ["Book Appointment", "Track Queue", "Health Records", "Find Doctors"],
    "For Doctors":  ["Doctor Login", "Manage Queue", "Prescriptions", "Register Clinic"],
    "Company":      ["About Us", "Pricing", "Privacy Policy", "Contact"],
  };

  return (
    <footer className="bg-[#0A1628] text-white/70 pt-12 sm:pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0057A8] rounded-xl grid place-items-center text-lg">🏥</div>
              <span className="font-serif text-xl text-white">
                Clinic<span className="text-cyan-400">Flow</span>
              </span>
            </Link>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h5 className="text-white text-sm font-semibold mb-4">{heading}</h5>
              <ul className="space-y-3 list-none p-0 m-0">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/50 hover:text-cyan-400 text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 sm:pt-7 flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4">
          <p className="text-xs">© 2026 ClinicFlow. All rights reserved.</p>
          <div className="flex gap-3">
            {["𝕏", "in", "f", "📸"].map((s) => (
              <a
                key={s}
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#0057A8] grid place-items-center text-sm transition-colors text-white"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

// ── Home Page ─────────────────────────────────────────────────────
const Home: FC = () => (
  <>
    <Navbar />
    <Hero />
    <Footer />
  </>
);

export default Home;