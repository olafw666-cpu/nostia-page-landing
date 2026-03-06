import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import logo from "./nostia-transparent.png";
import Home from "./pages/Home";
import About from "./pages/About";
import Newsletter from "./pages/Newsletter";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-[#0e0e0f] text-white flex flex-col items-center px-4 sm:px-6 py-10 sm:py-20 font-sans">
        <header className="w-full max-w-5xl flex flex-wrap justify-between items-center mb-12 sm:mb-24">
          <Link to="/home" className="shrink-0">
            <img src={logo} alt="Nostia" className="h-10 sm:h-16 w-auto cursor-pointer" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            className="sm:hidden text-white/80 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-6 items-center">
            <Link to="/home" className="text-white/80 hover:text-white transition">
              Home
            </Link>
            <Link to="/about" className="text-white/80 hover:text-white transition">
              About
            </Link>
            <Link to="/newsletter" className="text-white/80 hover:text-white transition">
              Newsletter
            </Link>
            <a
              href="/Nostia-deck.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 px-4 py-1 rounded hover:bg-white/10 transition"
            >
              Investor Deck (PDF)
            </a>
          </nav>

          {/* Mobile nav */}
          {menuOpen && (
            <nav className="sm:hidden w-full flex flex-col gap-4 mt-4 border-t border-white/10 pt-4">
              <Link to="/home" className="text-white/80 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/about" className="text-white/80 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                About
              </Link>
              <Link to="/newsletter" className="text-white/80 hover:text-white transition" onClick={() => setMenuOpen(false)}>
                Newsletter
              </Link>
              <a
                href="/Nostia-deck.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/30 px-4 py-1 rounded hover:bg-white/10 transition w-fit"
                onClick={() => setMenuOpen(false)}
              >
                Investor Deck (PDF)
              </a>
            </nav>
          )}
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/newsletter" element={<Newsletter />} />
        </Routes>

        <footer className="mt-16 sm:mt-32 text-white/40 text-sm">
          © {new Date().getFullYear()} Nostia. All Rights Reserved.
        </footer>
      </div>
    </Router>
  );
}
