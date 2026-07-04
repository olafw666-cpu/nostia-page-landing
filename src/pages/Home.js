import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Apple,
  CalendarX,
  Camera,
  Check,
  Compass,
  LifeBuoy,
  MapPin,
  Puzzle,
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
    icon: Users,
    title: "Friend & Stay Coordination",
    text: "Add friends, coordinate stays, and plan visits in an organized, meaningful way. Mark your home as open to hosting.",
  },
  {
    icon: Vault,
    title: "Trip Planning & Vault",
    text: "Create shared itineraries, assign a trip leader, and pool group funds securely in the Nostia Trip Vault.",
  },
  {
    icon: Compass,
    title: "Events & Discovery",
    text: "Host and discover events, and find others nearby looking for travel companions or local adventures.",
  },
  {
    icon: Camera,
    title: "Social Experience",
    text: "A built-in social layer — share moments in an authentic style reminiscent of early Instagram.",
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
            One app for your entire social life — payments, trips, events, and
            the people you actually want to see.
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
