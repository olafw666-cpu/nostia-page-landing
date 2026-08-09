import React from "react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// Organization Terms — the B2B agreement for Nostia Orgs.
//
// Modelled directly on the live, App-Review-approved terms at
// public/terms/index.html: same section rhythm, same plain declarative voice,
// same data-handling emphasis (collect → use → anonymize → location → retain →
// rights). That document cleared review for a shipping product, so its shape is
// the safest starting point rather than a from-scratch legal register.
//
// What changed for this product: the counterparty is an organization, not an end
// user, so the obligations run the other way — they supply the content and carry
// the liability for it. The added sections (content licence, route safety,
// indemnification, fees) have no equivalent in the consumer document because a
// consumer never authors a route the public walks.
//
// The walker-facing sections are kept deliberately close to the approved
// wording, because they describe the same collection and the same anonymization
// pipeline — restating that differently here would create a discrepancy between
// two published documents describing one system.
//
// ⚠️ Still a DRAFT as to the added B2B clauses, particularly indemnification,
// which BUSINESS_MODEL.md §15 rates HIGH and calls blocking for a paid launch.
// Not reviewed by counsel. Do not sign a paying organization onto it yet.
// ─────────────────────────────────────────────────────────────

const EFFECTIVE = "August 2026";

const sections = [
  {
    title: "Scope",
    body: [
      "These Organization Terms govern an organization's use of Nostia Orgs: authoring adventures, publishing them into the Nostia app, distributing invite codes, and reading analytics. They are in addition to the Nostia Terms of Service, which continue to govern individual accounts. Where the two conflict on the organization's own use, these terms control.",
    ],
  },
  {
    title: "Data We Collect",
    body: [
      "When a person walks an adventure your organization published, Nostia collects GPS coordinates during the active session, arrival and dwell events at each stop, photos submitted for stop verification, session metrics such as length and frequency, per-stop progression milestones, and error and performance metrics.",
      "From your organization, Nostia collects the content you author, your billing details, and administrative activity in the console.",
    ],
  },
  {
    title: "How We Use Your Data",
    body: [
      "Walker data powers the verification features your organization is paying for — confirming that someone reached a stop — and is used to generate anonymized, aggregated insights such as completion rates and per-stop drop-off. Raw data is never shared with your organization. Every figure Nostia reports to you is derived from aggregated and anonymized datasets.",
    ],
  },
  {
    title: "Data Anonymization",
    body: [
      "GPS data is rounded or bucketed by region. User identifiers are removed prior to analysis. Metrics are aggregated over time windows, and aggregates covering too few participants are withheld entirely so that they cannot identify a person. No personally identifiable information is included in anything Nostia shows an organization.",
      "Your organization must not attempt to re-identify any individual from analytics, or combine analytics with other data for that purpose.",
    ],
  },
  {
    title: "Location Access",
    body: [
      "Location sharing is a mandatory requirement for a person to walk an adventure, because arrival at a stop is what the verification measures. A walker who declines or revokes location access cannot complete an adventure.",
      "Your organization never receives a walker's location. It receives only whether a stop was reached, in aggregate.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "Raw location data and submitted photos are retained for a limited period as specified in our retention policy, then purged, while anonymized aggregates are preserved.",
      "Reference photographs your organization uploads are treated differently: they are your content, not a walker's, and are retained until you delete them.",
    ],
  },
  {
    title: "Your Content",
    body: [
      "Your organization retains all ownership of the text, images, routes, and branding it supplies. Nostia claims no ownership of it.",
      "You grant Nostia a non-exclusive, worldwide, royalty-free licence to host, reproduce, adapt for display, and distribute that content solely to operate the service and deliver the adventure to walkers. The licence ends when the content is deleted, save for backups retained for a limited period and records Nostia must keep by law.",
      "You represent that you hold all rights necessary to grant that licence, including rights in any photograph, logo, trademark, or third-party material you upload.",
    ],
  },
  {
    title: "Routes and Physical Safety",
    body: [
      "An adventure directs members of the public to physical places. Your organization is solely responsible for the routes it authors: that each stop is on publicly accessible land or land you are entitled to direct people onto, that the route is reasonably safe to walk, and that it complies with local law and any permit requirement.",
      "Nostia does not inspect, survey, or approve routes. Publication is not an endorsement or a safety assessment.",
    ],
  },
  {
    title: "Indemnification",
    body: [
      "Your organization will defend, indemnify, and hold harmless Nostia LLC, its officers, employees, and agents from and against any third-party claim, demand, suit, proceeding, loss, liability, damage, fine, or expense (including reasonable legal fees) arising out of or relating to: (a) your content, including any claim of infringement, defamation, or misuse of a third party's name, likeness, or trademark; (b) any route you authored, including any claim of personal injury, death, property damage, or trespass suffered by a person following it; (c) your breach of these terms or of any law; and (d) any representation you make about a sponsorship, partnership, or endorsement.",
      "Nostia will notify you of any such claim, allow you to control the defence with counsel reasonably acceptable to Nostia, and cooperate at your expense. You may not settle a claim in a way that imposes any obligation or admission on Nostia without Nostia's prior written consent.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "Content must not be unlawful, discriminatory, harassing, deceptive, or sexually explicit, must not target children as an audience without your own compliant consent mechanism, and must not direct people to trespass or into foreseeable danger.",
      "Nostia may unpublish content or suspend an account where it reasonably believes these terms have been breached or a route presents a risk to public safety. Where practical Nostia gives notice first; where the risk is immediate it may act first and give notice after.",
    ],
  },
  {
    title: "Fees and Cancellation",
    body: [
      "Subscription fees, billing interval, and included limits are those presented at the time of purchase. Fees are billed in advance and are non-refundable except where required by law.",
      "A subscription renews automatically unless cancelled before the end of the current term. Cancellation takes effect at the end of the paid term. Nostia may change fees for a renewal term with at least thirty days' notice before that term begins.",
    ],
  },
  {
    title: "Your Rights",
    body: [
      "Your organization may request export of its content and account data, request deletion, and terminate at any time subject to the cancellation terms above.",
      "Walkers hold their own rights over their own data — export, deletion, withdrawal of consent, and opting out of collection — supported under GDPR and CCPA. Those rights are exercised with Nostia, not with your organization, and Nostia will honour them without your involvement. End users remain Nostia's users; publishing an adventure grants your organization no right to contact them and no licence to their personal data.",
    ],
  },
  {
    title: "Service Availability and Liability",
    body: [
      "The service is provided on an “as is” and “as available” basis. Nostia does not warrant that it will be uninterrupted or error-free and disclaims all implied warranties to the fullest extent the law permits.",
      "Neither party is liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, or data. Nostia's total aggregate liability arising out of these terms is limited to the fees paid to Nostia in the twelve months preceding the claim.",
      "Nothing here limits your obligations under Indemnification, or either party's liability for death or personal injury caused by its negligence, for fraud, or for any other liability that cannot lawfully be limited.",
    ],
  },
  {
    title: "Termination and General",
    body: [
      "Either party may terminate for material breach uncured thirty days after written notice. On termination your adventures are unpublished and console access ends. The sections on content licence, indemnification, data, liability, and this section survive.",
      "These terms are governed by the laws of the State of New Hampshire, and the state and federal courts located there have exclusive jurisdiction. Nostia may update these terms; material changes take effect at the start of your next renewal term, or thirty days after notice, whichever is later.",
      "Questions: sales@nostia.io.",
    ],
  },
];

export default function OrgTerms() {
  return (
    <main className="w-full max-w-3xl">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 rounded-full px-3 py-1 text-xs text-emerald-300 mb-5">
          Nostia Orgs
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          Organization Terms
        </h1>
        <p className="text-white/50 text-sm">
          Effective {EFFECTIVE} · These apply to organizations using Nostia Orgs.
          Individual accounts are governed by the{" "}
          <Link to="/terms" className="text-emerald-300/80 hover:text-emerald-200 underline underline-offset-2">
            Nostia Terms of Service
          </Link>
          .
        </p>
      </div>

      <div className="space-y-10">
        {sections.map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-lg sm:text-xl font-semibold mb-3">{title}</h2>
            {body.map((paragraph, i) => (
              <p key={i} className="text-white/60 text-sm sm:text-base leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="text-white/40 text-sm mt-14 pt-8 border-t border-white/10">
        NOSTIA LLC · Exeter, New Hampshire
      </p>
    </main>
  );
}
