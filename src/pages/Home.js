import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Apple,
  ArrowRight,
  BarChart3,
  CalendarX,
  Camera,
  Check,
  Compass,
  Footprints,
  LifeBuoy,
  MapPin,
  Puzzle,
  Sparkles,
  Users,
  Vault,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// App Store link — while null, the button renders as a
// "Coming soon" placeholder.
// ─────────────────────────────────────────────────────────────
const APP_STORE_URL = "https://apps.apple.com/us/app/nostia/id6762099952";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const viewport = { once: true, margin: "-80px" };

function AppStoreButton() {
  const live = Boolean(APP_STORE_URL);
  const content = (
    <>
      <Apple className="w-7 h-7 fill-current" aria-hidden="true" />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-widest opacity-60">
          {live ? "Download on the" : "Coming soon to the"}
        </span>
        <span className="block text-base font-semibold -mt-0.5">App Store</span>
      </span>
    </>
  );

  const baseClass =
    "inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-medium";

  if (live) {
    return (
      <motion.a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className={`${baseClass} shadow-lg shadow-white/10`}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <span aria-disabled="true" className={`${baseClass} opacity-80 cursor-default select-none`}>
      {content}
    </span>
  );
}

const problems = [
  {
    icon: Puzzle,
    title: "Fragmented tools",
    text: "Venmo for splitting costs, WhatsApp for the group chat, Maps for planning, Eventbrite for events — none of them talk to each other.",
  },
  {
    icon: CalendarX,
    title: '"Someday" trips never happen',
    text: "Group chats are full of unacted plans. Nothing takes a conversation from idea to a booked, funded trip.",
  },
  {
    icon: MapPin,
    title: "Friends are everywhere; visits aren't",
    text: "You have friends in fascinating places you genuinely want to see — but no easy way to organize stays or coordinate timing.",
  },
];

const features = [
  {
    icon: Footprints,
    title: "Daily Adventures",
    text: "One measured challenge every 24 hours. Your phone's pedometer confirms it — there is no button that says you went. Easy, Medium and Advanced tiers earn points toward profile themes.",
  },
  {
    icon: Vault,
    title: "Trip Planning & Vault",
    text: "Shared itineraries, a trip leader, and group funds pooled securely in the Nostia Trip Vault. Split expenses and settle by card.",
  },
  {
    icon: Users,
    title: "Friends & Stays",
    text: "Add friends, mark your home open to hosting, and coordinate visits in an organized, meaningful way.",
  },
  {
    icon: Compass,
    title: "Events & Discovery",
    text: "Host and discover events nearby, and find others looking for travel companions or local adventures.",
  },
  {
    icon: Camera,
    title: "Feed & Messages",
    text: "Share moments in an authentic style reminiscent of early Instagram, and talk to the people in them.",
  },
  {
    icon: Sparkles,
    title: "AI Trip Assistant",
    text: "Turn a rough idea into a real itinerary, with the tedious half of the planning already done.",
  },
];

const milestones = [
  { label: "Beta / MVP complete", detail: "The core app is built and ready", status: "done" },
  { label: "Closed beta", detail: "Invite-only user testing complete", status: "done" },
  { label: "Public launch", detail: "Live on the App Store, rolling out city by city", status: "now" },
];

export default function Home() {
  const { scrollY } = useScroll();
  const orb1Y = useTransform(scrollY, [0, 800], [0, 160]);
  const orb2Y = useTransform(scrollY, [0, 800], [0, -100]);

  return (
    <main className="w-full max-w-6xl">
      {/* ── Hero ── */}
      <section className="relative text-center pt-6 sm:pt-16 pb-20 sm:pb-28">
        {/* ambient glow + dot grid, drifting with scroll */}
        <motion.div
          style={{ y: orb1Y }}
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <motion.div
          style={{ y: orb2Y }}
          className="pointer-events-none absolute -top-10 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[length:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-1.5 text-xs sm:text-sm text-white/70 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
            </span>
            Launching now — rolling out city by city
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Where the trip leaves
            <br />
            the{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              group chat
            </span>
            .
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto mb-10"
          >
            One app for your entire social life — adventures, trips, payments,
            events, and the people you actually want to see.
          </motion.p>

          <motion.div variants={fadeUp} className="flex justify-center">
            <AppStoreButton />
          </motion.div>

          <motion.p variants={fadeUp} className="text-white/40 text-sm mt-8">
            Replaces the Venmo + WhatsApp + Maps + Eventbrite shuffle.
          </motion.p>
        </motion.div>
      </section>

      {/* ── The Problem ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="text-center mt-8 sm:mt-16"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold mb-4">
          Planning together shouldn't be this hard.
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto mb-10 sm:mb-14">
          People want to connect in real life. Every tool fights them on it.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
          {problems.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/25 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/60 text-sm sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── The Product ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="text-center mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold mb-4">
          One app.{" "}
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Your whole social life.
          </span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto mb-10 sm:mb-14">
          Nostia takes plans from idea to booked, funded trip — and keeps the
          people you care about close along the way.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
          {features.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group relative border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 overflow-hidden hover:border-white/25 transition-colors"
            >
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500/15 blur-3xl transition-colors duration-500" />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-sky-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Meaning ── */}
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewport}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mt-24 sm:mt-36 max-w-3xl mx-auto"
      >
        <p className="text-xl sm:text-3xl font-medium leading-relaxed text-white/90">
          "Nostia" — from the Latin for{" "}
          <span className="bg-gradient-to-r from-sky-400 to-fuchsia-400 bg-clip-text text-transparent font-semibold">
            "ours."
          </span>
        </p>
        <p className="text-white/50 mt-4 text-sm sm:text-base">
          Built on the belief that shared experiences are the foundation of real connection.
        </p>
      </motion.section>

      {/* ── Roadmap ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-14">
          Where we are
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {milestones.map(({ label, detail, status }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className={`border rounded-2xl p-6 ${
                status === "now"
                  ? "border-sky-400/40 bg-sky-400/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {status === "done" ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                ) : status === "now" ? (
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border border-white/20" />
                )}
                <span
                  className={`text-xs uppercase tracking-widest ${
                    status === "done"
                      ? "text-emerald-400"
                      : status === "now"
                      ? "text-sky-400"
                      : "text-white/40"
                  }`}
                >
                  {status === "done" ? "Complete" : status === "now" ? "Happening now" : "Up next"}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{label}</h3>
              <p className="text-white/60 text-sm">{detail}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Nostia Orgs ──
          Deliberately its own band with its own accent colour. This is a
          different product sold to a different buyer, and blending it into the
          consumer sections would make both harder to read. */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden border border-emerald-400/25 bg-emerald-400/[0.04] rounded-3xl px-6 py-12 sm:px-12 sm:py-16"
        >
          <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 rounded-full px-3 py-1 text-xs text-emerald-300 mb-5">
                For organizations
              </span>

              <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                Put your city on{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Nostia Orgs
                </span>
                .
              </h2>

              <p className="text-white/60 mb-8 max-w-lg">
                Museums, campuses, tourism boards and downtown districts build a
                place-anchored walking adventure, publish it into the Nostia app,
                hand it out as a printed QR code, and see exactly where people
                walked — and where they stopped.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Plain <a>, not <Link> — the console is a static app served from
                    /console/ outside the React router, so it needs a real navigation. */}
                <a
                  href="/console/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition"
                >
                  Sign in to Nostia Orgs
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/organizations"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/40 transition"
                >
                  What you get
                </Link>
              </div>
            </div>

            <ul className="space-y-4">
              {[
                { icon: MapPin, text: "Author a multi-stop route, anchored to real places" },
                { icon: Check, text: "Verified arrivals — geofence dwell plus photo, not an honour system" },
                { icon: BarChart3, text: "Per-stop analytics showing exactly where walkers dropped off" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 items-start">
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-300" />
                  </span>
                  <span className="text-white/70 text-sm sm:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Final CTA ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden border border-white/10 rounded-3xl px-6 py-14 sm:px-12 sm:py-20 text-center"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              The doors are opening.
            </h2>
            <p className="text-white/60 max-w-xl mx-auto mb-10">
              Nostia is live on the App Store, rolling out city by city.
              Download it now and be ready when we reach yours.
            </p>

            <div className="flex justify-center">
              <AppStoreButton />
            </div>

            <a
              href="/support"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mt-8 transition"
            >
              <LifeBuoy className="w-4 h-4" />
              Questions? Visit our Support page
            </a>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
