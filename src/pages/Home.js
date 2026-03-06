import React from "react";

export default function Home() {
  return (
    <>
      <main className="w-full max-w-5xl text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
          Reconnecting People Through<br />Shared Travel Experiences.
        </h2>
        <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8 sm:mb-12">
          Nostia helps friends, families, and groups actually follow through on their
          travel plans. From shared trip calendars to collaborative lodging and
          fundraising, Nostia is the social layer that makes group travel possible.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <a
            href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=4AlymbMJI0aaTXavpEpnXMRTvEZQ7UpFm0cv0XYdu35UNTNGM05USFgxQUpXTlAySFgxRzdXVlZONC4u"
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

      <section className="w-full max-w-5xl mt-16 sm:mt-32 text-center">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">What We're Building</h3>
        <p className="text-white/60 max-w-2xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base">
          Group trips are notoriously difficult to plan. Nostia streamlines
          coordination with shared itineraries, lodging planning, and cost sharing
          — without turning social travel into a transactional marketplace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 text-left">
          <div className="border border-white/10 p-5 sm:p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Shared Trip Calendars</h4>
            <p className="text-white/60 text-sm sm:text-base">Coordinate schedules across friends & family.</p>
          </div>

          <div className="border border-white/10 p-5 sm:p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Group Lodging Tools</h4>
            <p className="text-white/60 text-sm sm:text-base">Plan and split stays without friction.</p>
          </div>

          <div className="border border-white/10 p-5 sm:p-6 rounded-lg bg-white/5">
            <h4 className="font-semibold mb-2">Collaborative Fundraising</h4>
            <p className="text-white/60 text-sm sm:text-base">Make big reunions actually financially doable.</p>
          </div>
        </div>
      </section>
    </>
  );
}
