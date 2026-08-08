import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  MapPin,
  Palette,
  QrCode,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Nostia Orgs — the B2B surface.
//
// Two rules this page follows deliberately:
//
//  1. NO INVENTED PROOF. No customer logos, no testimonials, no "trusted by"
//     counts. Nothing here has a first paying organization yet, and fabricated
//     social proof on a B2B page is the kind of thing a buyer checks.
//  2. NO PRICE. Tiers exist in config, but no price has been agreed with a real
//     buyer, so quoting one here would be a number we invented. "Talk to us"
//     is the honest CTA until that changes.
//
// Copy is grounded in nostia-pivot/BUSINESS_MODEL.md §2 (what the organization
// actually buys) and §8 (the six metrics).
// ─────────────────────────────────────────────────────────────

const SALES = "mailto:sales@nostia.io?subject=Nostia%20Orgs";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const viewport = { once: true, margin: "-80px" };

const capabilities = [
  {
    icon: MapPin,
    title: "Authoring",
    text: "Build a multi-stop route anchored to real places — per-stop text, a verification criterion, a reference photo, and a geofence. Authored on mobile, standing at the stop you are anchoring.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    text: "A geofence dwell plus photo judging proves someone was physically at the stop. Attendance you can defend to a funder, rather than a tap that says they were there.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Six metrics and a per-stop funnel, scoped to the version people actually walked. Small groups are suppressed so a figure can never identify a person.",
  },
  {
    icon: QrCode,
    title: "Distribution",
    text: "Invite codes and printable QR that survive an App Store install — the code is still there after someone downloads the app, so a poster works on a stranger.",
  },
  {
    icon: Palette,
    title: "Branding",
    text: "Your accent colour and logo on the adventure, so a sponsored walk reads as yours.",
  },
];

const metrics = [
  ["Views", "how many people looked"],
  ["Starts", "how many began walking"],
  ["Verified completion rate", "who actually finished, with the denominator"],
  ["Group rate", "how much of it was walked together"],
  ["Corroborated runs", "completions confirmed by a second device"],
  ["Median rating", "what they thought of it"],
];

const steps = [
  { n: "01", title: "Author the route", text: "Walk it once on mobile, anchoring each stop where it belongs." },
  { n: "02", title: "Publish and print", text: "Publish into the Nostia app and print the QR for your posters, desks and trailheads." },
  { n: "03", title: "Read the funnel", text: "Watch where people walked and where they dropped off, stop by stop." },
];

function SignInButton({ className = "" }) {
  // Plain <a>: /console/ is a static app outside this React router.
  return (
    <a
      href="/console/"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition ${className}`}
    >
      Sign in to Nostia Orgs
      <ArrowRight className="w-4 h-4" />
    </a>
  );
}

export default function Organizations() {
  return (
    <main className="w-full max-w-6xl">
      {/* ── Hero ── */}
      <section className="relative text-center pt-6 sm:pt-16 pb-16 sm:pb-24">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[40rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 rounded-full px-4 py-1.5 text-xs sm:text-sm text-emerald-300 mb-8"
          >
            <Building2 className="w-4 h-4" />
            Nostia Orgs
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Your place,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              walked and measured
            </span>
            .
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            A subscription for museums, campuses, tourism boards and downtown
            districts. Author a walking adventure, publish it to the Nostia app,
            distribute it on paper, and find out what actually happened.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton />
            <a
              href={SALES}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/40 transition"
            >
              Talk to us
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="text-white/40 text-sm mt-8">
            Organization accounts are set up with you directly — there is no self-serve signup.
          </motion.p>
        </motion.div>
      </section>

      {/* ── What you get ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-8 sm:mt-16"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-4">
          What you get
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          Five things, in the order they create value.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-left">
          {capabilities.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className={`group relative border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 overflow-hidden hover:border-emerald-400/30 transition-colors ${
                i === capabilities.length - 1 ? "md:col-span-2" : ""
              }`}
            >
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/10 blur-3xl transition-colors duration-500" />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-white/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── How it works ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-14">
          How it works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map(({ n, title, text }) => (
            <motion.div
              key={n}
              variants={fadeUp}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8"
            >
              <span className="text-emerald-300/70 text-sm font-mono tracking-widest">{n}</span>
              <h3 className="font-semibold text-lg mt-3 mb-2">{title}</h3>
              <p className="text-white/60 text-sm sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── The numbers ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-4">
          What you can{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            actually see
          </span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          Every rate arrives with its denominator, and aggregates over a handful
          of people are withheld until enough walkers have taken part. Nostia
          never shows an organization who walked an adventure.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map(([label, detail]) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="border border-white/10 bg-white/5 rounded-xl p-5"
            >
              <h3 className="font-semibold text-sm mb-1">{label}</h3>
              <p className="text-white/50 text-sm">{detail}</p>
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
          className="relative overflow-hidden border border-emerald-400/25 rounded-3xl px-6 py-14 sm:px-12 sm:py-20 text-center"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Already an organization on Nostia?</h2>
            <p className="text-white/60 max-w-xl mx-auto mb-10">
              Billing and analytics live in the console. Authoring happens in the
              Nostia mobile app, where you can stand at the stop you are anchoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignInButton />
              <a
                href={SALES}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/40 transition"
              >
                Talk to us about an account
              </a>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
