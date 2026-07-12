import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import { Menu, X, Mail } from "lucide-react";
import logo from "./nostia-transparent.png";
import Home from "./pages/Home";
import About from "./pages/About";
import Newsletter from "./pages/Newsletter";
import Terms from "./pages/Terms";
import OlafWoodall from "./pages/OlafWoodall";

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/newsletter", label: "Newsletter" },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50 bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400"
    />
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { pathname } = useLocation();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "bg-[#0e0e0f]/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16 sm:h-20">
        <Link to="/home" className="shrink-0" onClick={closeMenu}>
          <img src={logo} alt="Nostia" className="h-9 sm:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-7 items-center">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm transition ${
                pathname === to ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
          <a href="/support" className="text-sm text-white/60 hover:text-white transition">
            Support
          </a>
          <a
            href="/Nostia-deck.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 hover:border-white/40 transition"
          >
            Investor Deck
          </a>
        </nav>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden text-white/80 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#0e0e0f]/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-white/80 hover:text-white transition py-2"
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              ))}
              <a href="/support" className="text-white/80 hover:text-white transition py-2">
                Support
              </a>
              <Link to="/terms" className="text-white/80 hover:text-white transition py-2" onClick={closeMenu}>
                Terms of Service
              </Link>
              <a
                href="/Nostia-deck.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition w-fit mt-2"
                onClick={closeMenu}
              >
                Investor Deck
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function Footer() {
  return (
    <footer className="w-full border-t border-white/10 mt-20 sm:mt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <img src={logo} alt="Nostia" className="h-10 w-auto mb-4" />
          <p className="text-white/50 text-sm max-w-xs">
            Where the trip leaves the group chat. One app for payments, trips,
            events, and the people you actually want to see.
          </p>
          <a
            href="mailto:nostiaexecutive@nostia.io"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mt-4 transition"
          >
            <Mail className="w-4 h-4" />
            nostiaexecutive@nostia.io
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Explore</h4>
          <ul className="space-y-2 text-sm">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-white/50 hover:text-white transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/support" className="text-white/50 hover:text-white transition">
                Support
              </a>
            </li>
            <li>
              <Link to="/terms" className="text-white/50 hover:text-white transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <a
                href="/Nostia-deck.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition"
              >
                Investor Deck (PDF)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <p className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-white/40 text-sm text-center sm:text-left">
          © {new Date().getFullYear()} Nostia. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#0e0e0f] text-white font-sans flex flex-col overflow-x-clip">
        <ScrollProgress />
        <Header />

        <div className="flex-1 w-full flex flex-col items-center px-4 sm:px-6 pt-24 sm:pt-32">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/olaf-woodall" element={<OlafWoodall />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}
