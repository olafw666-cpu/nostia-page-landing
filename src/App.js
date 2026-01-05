import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white flex flex-col items-center px-6 py-20 font-sans">
      <header className="w-full max-w-5xl flex justify-between items-center mb-24">
        <h1 className="text-2xl tracking-tight font-semibold">Nostia</h1>
        <a
          href="/Nostia-deck.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-white/30 px-4 py-1 rounded hover:bg-white/10 transition"
        >
          Investor Deck (PDF)
        </a>
      </header>

      <main className="w-full max-w-5xl text-center">
        <h2 className="text-5xl font-bold mb-6 leading-tight">
          Reconnecting People Through<br />Shared Travel Experiences.
        </h2>
        <p className="text-lg text-white/70 max-w-2xl mx-auto mb-12">
          Nostia helps friends, families, and groups actually follow through on their
          travel plans. From shared trip calendars to collaborative lodging and
          fundraising, Nostia is the social layer that makes group travel possible.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSc1LbKtAVhjAQXQP46onEGRBW5gPPx8EciIUyluoCqdB3IoIQ/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/80 transition"
          >
            Join Early Access
          </a>
          <a
            href="/Nostia-deck.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-white/30 rounded-lg hover:bg-white/10 transition"
          >
            For Investors
          </a>
        </div>
      </main>

      <section className="w-full max-w-5xl mt-32 text-center">
        <h3 className="text-2xl font-semibold mb-4">What We're Building</h3>
        <p className="text-white/60 max-w-2xl mx-auto mb-12">
          Group trips are notoriously difficult to plan. Nostia streamlines
          coordination with shared itineraries, lodging planning, and cost sharing
          — without turning social travel into a transactional marketplace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="border border-white/10 p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Shared Trip Calendars</h4>
            <p className="text-white/60">Coordinate schedules across friends & family.</p>
          </div>

          <div className="border border-white/10 p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Group Lodging Tools</h4>
            <p className="text-white/60">Plan and split stays without friction.</p>
          </div>

          <div className="border border-white/10 p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Collaborative Fundraising</h4>
            <p className="text-white/60">Make big reunions actually financially doable.</p>
          </div>
        </div>
      </section>

      <footer className="mt-32 text-white/40 text-sm">
        © {new Date().getFullYear()} Nostia. All Rights Reserved.
      </footer>
    </div>
  );
}
