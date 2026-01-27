import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import logo from "./nostia-transparent.png";
import Home from "./pages/Home";
import About from "./pages/About";
import Newsletter from "./pages/Newsletter";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0e0e0f] text-white flex flex-col items-center px-6 py-20 font-sans">
        <header className="w-full max-w-5xl flex justify-between items-center mb-24">
          <Link to="/home">
            <img src={logo} alt="Nostia" className="h-16 cursor-pointer" />
          </Link>

          <nav className="flex gap-6 items-center">
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
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/newsletter" element={<Newsletter />} />
        </Routes>

        <footer className="mt-32 text-white/40 text-sm">
          © {new Date().getFullYear()} Nostia. All Rights Reserved.
        </footer>
      </div>
    </Router>
  );
}
