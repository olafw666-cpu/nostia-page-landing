import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Accessibility,
  Apple,
  BadgeCheck,
  BookOpen,
  CircuitBoard,
  CreditCard,
  ExternalLink,
  Feather,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Landmark,
  Linkedin,
  Plane,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import portrait from "../olaf-portrait.jpg";

const LINKEDIN_URL = "https://www.linkedin.com/in/olaf-woodall";
const GITHUB_URL = "https://github.com/woodallolaf-wq";
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

function StatusBadge({ status }) {
  if (status === "shipped") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-emerald-400">
        <BadgeCheck className="w-3.5 h-3.5" />
        Shipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-sky-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
      </span>
      In progress
    </span>
  );
}

const heroLinks = [
  { href: LINKEDIN_URL, icon: Linkedin, label: "LinkedIn" },
  { href: GITHUB_URL, icon: Github, label: "GitHub" },
  { href: APP_STORE_URL, icon: Apple, label: "Nostia on the App Store" },
];

const nostiaWork = [
  {
    icon: Smartphone,
    title: "Full stack, built solo",
    text: "Native SwiftUI iOS app, Node.js/Express backend, SQLite persistence, and PM2/Nginx deployment on DigitalOcean with automated daily backups and process supervision.",
  },
  {
    icon: CreditCard,
    title: "Payments end-to-end",
    text: "Stripe Connect v2 with direct charges and Apple Pay via StripePaymentSheet — including a full migration to Connect v2's new account model.",
  },
  {
    icon: Server,
    title: "Platform features",
    text: "Push notifications (APNs), two-factor authentication, the Vault system, following/followers, organizations, activity heatmaps, and App Clips with geofenced GeoJSON triggers.",
  },
  {
    icon: ShieldCheck,
    title: "Through Apple review",
    text: "Resolved App Tracking Transparency (5.1.2) and age-rating (2.3.6) rejections plus an ITMS-90118 routing coverage error to bring the app live.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    text: "Accessibility work across the app targeting ADA / WCAG 2.1 AA compliance.",
  },
  {
    icon: FileText,
    title: "Spec-driven engineering",
    text: "20+ formal engineering specification PDFs — architecture, feature specs, and a security audit checklist spanning 12 domains and 53 checks.",
  },
];

const hardwareProjects = [
  {
    icon: Radio,
    status: "shipped",
    title: "Proximity kill-switch (“Drone Ping”)",
    points: [
      "ESP32-C3 based proximity kill-switch using ESP-NOW peer-to-peer radio — hardware confirmed working.",
      "Diagnosed and fixed a MOSFET drive problem by selecting a logic-level part (IRLZ44N) that fully saturates at a 3.3V gate.",
      "Corrected the power topology so the switch interrupts motor power only, not the main battery rail.",
      "Documented in a set of formal PDFs; code is public on GitHub.",
    ],
  },
  {
    icon: Plane,
    status: "in-progress",
    title: "Impact-recovery drone",
    points: [
      "A 5-inch, 6S dual-battery quadcopter engineered to survive sub-40 mph impacts and recover flight.",
      "Elastic TPU motor mounts absorb impact energy; recovery combines a contact bumper with differential pre-impact motor power bias.",
      "An offline vision-language model handles post-flight analysis — deliberately kept out of the real-time control loop after evaluating latency constraints.",
      "Built to a ~$800–900 bill of materials against a $2,000 budget.",
    ],
  },
];

const otherSoftware = [
  {
    icon: Globe,
    title: "Smarter Than A Crow",
    text: "A zero-backend quiz web app: static site on GitHub Pages, localStorage state, content swappable through a single questions.json, custom domain configured through DNS.",
  },
  {
    icon: Sparkles,
    title: "ML fine-tuning",
    text: "Working knowledge of the modern post-training pipeline — LoRA, SFT, RLHF, DPO, PPO — applied practically in Nostia's Adventure Page model work.",
  },
];

const writing = [
  {
    icon: Feather,
    title: "Fantasy novel",
    status: "in-progress",
    text: "A novel in third-person limited with an isekai structure.",
  },
  {
    icon: BookOpen,
    title: "Religion & philosophy",
    status: "in-progress",
    text: "A nonfiction book arguing religion and philosophy are congruent disciplines, using Oliver Cromwell as a central case study and treating theology as subject to philosophical scrutiny.",
  },
  {
    icon: Landmark,
    title: "Investment research",
    text: "Independent research across precious metals, defense/aerospace, and quantum computing — including small-cap screening in post-quantum cryptography adjacency.",
  },
  {
    icon: Globe,
    title: "Broader interests",
    text: "Philosophy of language and semantics, biblical criticism, Norse religion, geopolitics, and the history of drone warfare.",
  },
];

const skills = [
  { area: "iOS", items: "Swift, SwiftUI, App Store operations, APNs, App Clips" },
  { area: "Backend", items: "Node.js, Express, SQLite (better-sqlite3), REST API design" },
  { area: "Infrastructure", items: "Linux, Nginx, PM2, systemd, DigitalOcean, DNS, backup automation" },
  { area: "Payments", items: "Stripe Connect v2, direct charges, Apple Pay integration" },
  { area: "ML", items: "LoRA fine-tuning, local model deployment, inference serving" },
  { area: "Embedded", items: "ESP32-C3, ESP-NOW, MOSFET power switching, drone power systems" },
  { area: "Engineering tools", items: "EES, Python (ReportLab, data analysis), Git/GitHub" },
];

export default function OlafWoodall() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Olaf Woodall — Founder & CEO, Nostia";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="w-full max-w-6xl">
      {/* ── Hero ── */}
      <section className="relative pt-6 sm:pt-16 pb-16 sm:pb-24">
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-40 h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] items-center"
        >
          <div className="text-center md:text-left order-2 md:order-1">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-1.5 text-xs sm:text-sm text-white/70 mb-6"
            >
              Founder & CEO, Nostia LLC
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
            >
              Olaf{" "}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Woodall
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base sm:text-lg text-white/70 max-w-xl mx-auto md:mx-0 mb-4">
              Mechanical engineering student at the Colorado School of Mines and founder of Nostia,
              a group-travel app live on the iOS App Store.
            </motion.p>

            <motion.p variants={fadeUp} className="text-sm sm:text-base text-white/50 max-w-xl mx-auto md:mx-0 mb-8">
              I work across an unusually wide range: shipping production software end-to-end,
              building and debugging custom drone hardware, running independent investment
              research, and maintaining long-form writing projects in fiction and philosophy of
              history. My working style is spec-driven — major features and hardware systems get
              formal engineering specifications before and during implementation.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center md:justify-start gap-3">
              {heroLinks.map(({ href, icon: Icon, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 rounded-full text-sm hover:bg-white/10 hover:border-white/40 transition"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </motion.a>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="order-1 md:order-2 flex justify-center">
            <div className="relative w-64 sm:w-80 md:w-full max-w-sm">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-400/20 via-indigo-500/10 to-fuchsia-400/20 blur-2xl" />
              <img
                src={portrait}
                alt="Olaf Woodall"
                className="relative w-full rounded-3xl border border-white/15 object-cover shadow-2xl shadow-black/50"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Nostia ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-8 sm:mt-16"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-4">
          Nostia —{" "}
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            where the group chat becomes a trip.
          </span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          Trips planned in group chats rarely happen. Nostia gives friends, families, and groups
          shared trip calendars, lodging tools, and collaborative fundraising so plans actually
          convert into travel. Founded as Nostia LLC in New Hampshire; live on the iOS App Store.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {nostiaWork.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:border-white/25 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-sky-300" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/60 text-sm">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6 }}
            className="border border-sky-400/40 bg-sky-400/5 rounded-2xl p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-300" />
              </div>
              <StatusBadge status="in-progress" />
            </div>
            <h3 className="font-semibold mb-2">Adventure Page</h3>
            <p className="text-white/60 text-sm">
              An AI-driven discovery feature powered by a locally fine-tuned DeepSeek 1.5B model
              (LoRA), served from dedicated inference infrastructure.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6 }}
            className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:border-white/25 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5">
              <Landmark className="w-5 h-5 text-white/80" />
            </div>
            <h3 className="font-semibold mb-2">The company side</h3>
            <p className="text-white/60 text-sm">
              Formed Nostia LLC in New Hampshire, handled state compliance filings, and co-authored
              and stress-tested the company charter. Applying to Y Combinator with a cofounder.
            </p>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="flex justify-center mt-8">
          <motion.a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-medium shadow-lg shadow-white/10"
          >
            <Apple className="w-7 h-7 fill-current" aria-hidden="true" />
            <span className="text-left leading-tight">
              <span className="block text-[10px] uppercase tracking-widest opacity-60">
                Download Nostia on the
              </span>
              <span className="block text-base font-semibold -mt-0.5">App Store</span>
            </span>
          </motion.a>
        </motion.div>
      </motion.section>

      {/* ── Drone & embedded hardware ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-4">
          Drone & embedded hardware
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/60 max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          Custom flight hardware designed, built, and debugged from the power topology up.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {hardwareProjects.map(({ icon: Icon, status, title, points }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-sky-300" />
                </div>
                <StatusBadge status={status} />
              </div>
              <h3 className="font-semibold text-lg mb-4">{title}</h3>
              <ul className="space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-white/60 text-sm">
                    <CircuitBoard className="w-4 h-4 mt-0.5 shrink-0 text-white/30" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Other software ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-14">
          Other software
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {otherSoftware.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/25 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Writing & interests ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-14">
          Writing & intellectual interests
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {writing.map(({ icon: Icon, title, status, text }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:border-white/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                {status && <StatusBadge status={status} />}
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/60 text-sm">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Education & skills ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mt-24 sm:mt-36"
      >
        <motion.h2 variants={fadeUp} className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-14">
          Education & skills
        </motion.h2>

        <motion.div
          variants={fadeUp}
          className="border border-white/10 bg-white/5 rounded-2xl p-6 sm:p-8 mb-4 sm:mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                B.S. Mechanical Engineering <span className="text-white/40 text-sm font-normal">(in progress)</span>
              </h3>
              <p className="text-white/60 text-sm sm:text-base">
                Colorado School of Mines, Golden, CO. Coursework includes thermodynamics (Rankine
                and combined-cycle analysis with EES), structural mechanics (beam analysis, Mohr's
                circle, shear/moment diagrams), engineering economics (MACRS depreciation and
                after-tax cash flow modeling), and Middle East politics.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {skills.map(({ area, items }) => (
            <motion.div
              key={area}
              variants={fadeUp}
              className="border border-white/10 bg-white/5 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-white/40" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-white/80">{area}</h3>
              </div>
              <p className="text-white/60 text-sm">{items}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Contact ── */}
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
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Get in touch</h2>
            <p className="text-white/60 max-w-xl mx-auto mb-10">
              The best ways to reach me — or to see what I've shipped.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <motion.a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium shadow-lg shadow-white/10"
              >
                <Linkedin className="w-5 h-5" />
                Connect on LinkedIn
              </motion.a>
              <motion.a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/10 hover:border-white/40 transition"
              >
                <Github className="w-5 h-5" />
                GitHub
              </motion.a>
              <motion.a
                href="/home"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/10 hover:border-white/40 transition"
              >
                <ExternalLink className="w-5 h-5" />
                nostia.io
              </motion.a>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
