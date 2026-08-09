import React from "react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// Organization Terms — the B2B agreement for Nostia Orgs.
//
// ⚠️ DRAFT. This was written to cover the risks nostia-pivot/README.md and
// BUSINESS_MODEL.md §15 identify as blocking for a paid launch — principally
// the indemnification clause for branded content, which §15 rates HIGH and
// calls "blocking for a paid launch". It has NOT been reviewed by counsel.
// Do not sign a paying organization onto it until it has been.
//
// Deliberately separate from the consumer /terms: the counterparty is an
// organization, the obligations run the other way (they supply the content and
// carry the liability for it), and mixing the two would leave both vaguer.
// ─────────────────────────────────────────────────────────────

const EFFECTIVE = "August 2026";

const sections = [
  {
    title: "1. What this covers",
    body: [
      "These Organization Terms govern an organization's use of Nostia Orgs: the authoring tools, the publication of organization-authored adventures into the Nostia consumer app, invite-code distribution, and the analytics console.",
      "They are in addition to the Nostia Terms of Service, which continue to govern individual user accounts. Where the two conflict on a matter concerning the organization's own use, these Organization Terms control.",
    ],
  },
  {
    title: "2. Accounts and administrators",
    body: [
      "Organization accounts are provisioned by Nostia. Each organization designates one owner, who is responsible for the acts and omissions of every administrator and member granted access.",
      "The organization is responsible for keeping its credentials secure and for promptly removing access from people who leave. Nostia requires a second authentication factor for console access and may require it for any administrative action.",
    ],
  },
  {
    title: "3. Your content",
    body: [
      "The organization retains all ownership of the text, images, routes, and branding it supplies (\"Organization Content\"). Nostia claims no ownership of it.",
      "The organization grants Nostia a non-exclusive, worldwide, royalty-free licence to host, reproduce, adapt for display, and distribute Organization Content solely for the purpose of operating the service and delivering the adventure to end users. The licence ends when the content is deleted, save for backups retained for a limited period and for records Nostia must keep by law.",
      "The organization represents that it holds all rights necessary to grant that licence, including rights in any photograph, logo, trademark, or third-party material it uploads, and that its content does not infringe the rights of any other party.",
    ],
  },
  {
    title: "4. Responsibility for routes and physical safety",
    body: [
      "An adventure directs members of the public to physical places. The organization is solely responsible for the routes it authors: that each stop is on publicly accessible land or land the organization is entitled to direct people onto, that the route is reasonably safe to walk, and that it complies with local law and any permit or licensing requirement.",
      "Nostia does not inspect, survey, or approve routes, and does not verify that a stop is safe or lawful to visit. Publication by Nostia is not an endorsement or a safety assessment.",
    ],
  },
  {
    title: "5. Indemnification",
    body: [
      "The organization will defend, indemnify, and hold harmless Nostia LLC, its officers, employees, and agents from and against any third-party claim, demand, suit, proceeding, loss, liability, damage, fine, or expense (including reasonable legal fees) arising out of or relating to: (a) Organization Content, including any claim of infringement, defamation, or misuse of a third party's name, likeness, or trademark; (b) any route the organization authored, including any claim of personal injury, death, property damage, or trespass suffered by a person following that route; (c) the organization's breach of these terms or of any law; and (d) any representation the organization makes about a sponsorship, partnership, or endorsement.",
      "Nostia will notify the organization of any such claim, allow the organization to control the defence with counsel reasonably acceptable to Nostia, and cooperate at the organization's expense. The organization may not settle a claim in a way that imposes any obligation or admission on Nostia without Nostia's prior written consent.",
    ],
  },
  {
    title: "6. Acceptable use",
    body: [
      "Organization Content must not be unlawful, discriminatory, harassing, deceptive, or sexually explicit, must not target children as an audience without the organization's own compliant consent mechanism, and must not direct people to trespass or to place themselves in foreseeable danger.",
      "Nostia may remove or unpublish content, or suspend an organization's account, where it reasonably believes these terms have been breached or where a route presents a risk to public safety. Where practical Nostia will give notice first; where a safety risk is immediate it may act first and give notice after.",
    ],
  },
  {
    title: "7. Data and analytics",
    body: [
      "Nostia provides the organization with anonymized, aggregated analytics about how its adventures were walked. Nostia does not disclose to an organization who walked an adventure, and aggregates covering too few participants are withheld precisely so that they cannot identify a person.",
      "The organization must not attempt to re-identify any individual from analytics, or combine analytics with other data for that purpose.",
      "End users remain Nostia's users. The organization obtains no right to contact them and no licence to their personal data by virtue of publishing an adventure.",
    ],
  },
  {
    title: "8. Fees, term, and cancellation",
    body: [
      "Subscription fees, billing interval, and any included limits are those presented at the time of purchase. Fees are billed in advance and are non-refundable except where required by law.",
      "A subscription renews automatically for successive terms unless cancelled before the end of the current term. Cancellation takes effect at the end of the paid term; access and published adventures continue until then.",
      "Nostia may change fees for a renewal term with at least thirty days' notice before that term begins.",
    ],
  },
  {
    title: "9. Service availability",
    body: [
      "Nostia provides the service on an \"as is\" and \"as available\" basis and does not warrant that it will be uninterrupted or error-free. Nostia disclaims all implied warranties to the fullest extent the law permits, including merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    title: "10. Limitation of liability",
    body: [
      "To the fullest extent permitted by law, neither party is liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, or data.",
      "Nostia's total aggregate liability arising out of or relating to these terms is limited to the fees the organization paid Nostia in the twelve months preceding the event giving rise to the claim.",
      "Nothing in this section limits the organization's obligations under section 5 (Indemnification), or either party's liability for death or personal injury caused by its negligence, for fraud, or for any other liability that cannot lawfully be limited.",
    ],
  },
  {
    title: "11. Termination",
    body: [
      "Either party may terminate for material breach that remains uncured thirty days after written notice. Nostia may suspend immediately where section 6 permits.",
      "On termination the organization's adventures are unpublished and console access ends. Sections 3 (as to the surviving licence), 5, 7, 9, 10, and 12 survive termination.",
    ],
  },
  {
    title: "12. General",
    body: [
      "These terms are governed by the laws of the State of New Hampshire, without regard to its conflict-of-laws rules, and the state and federal courts located in New Hampshire have exclusive jurisdiction.",
      "Nostia may update these terms; material changes take effect for an organization at the start of its next renewal term, or thirty days after notice, whichever is later.",
      "Neither party may assign these terms without the other's consent, except to a successor in a merger or sale of substantially all assets.",
      "Questions about these terms: sales@nostia.io.",
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
