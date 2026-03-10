import React from "react";

const sections = [
  {
    title: "Data We Collect",
    content:
      "Nostia collects GPS coordinates during active sessions, feature interaction events (clicks, duration), session metrics (length, frequency), conversion funnel milestones, error and performance metrics, and regional trend data aggregated by city or region.",
  },
  {
    title: "How We Use Your Data",
    content:
      "Your data powers core location-based features and is used to generate anonymized, aggregated insights such as trends and heatmaps. Raw data is never shared directly. All monetizable outputs are derived from aggregated and anonymized datasets.",
  },
  {
    title: "Data Anonymization",
    content:
      "GPS data is rounded or bucketed by region. User identifiers are removed prior to analysis. Metrics are aggregated over time windows. No personally identifiable information is included in analytical outputs.",
  },
  {
    title: "Location Access",
    content:
      "Location sharing is a mandatory requirement to use Nostia. If you decline or revoke location access, your account access will be restricted until permission is restored.",
  },
  {
    title: "Data Retention",
    content:
      "Raw location data is retained for a limited period as specified in our retention policy. After this period, raw data is purged while anonymized aggregates are preserved.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to request export of your data, request deletion of your data, revoke consent at any time, and opt out of data collection. These rights are supported under GDPR and CCPA regulations.",
  },
];

export default function Terms() {
  return (
    <main className="w-full max-w-5xl flex-1">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
        Terms of Service
      </h2>
      <p className="text-white/60 text-center mb-8 sm:mb-12 text-sm sm:text-base">
        How Nostia handles your data
      </p>

      <div className="space-y-6 sm:space-y-8">
        {sections.map((section, index) => (
          <div
            key={index}
            className="border border-white/10 p-5 sm:p-8 rounded-lg bg-white/5"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              {section.title}
            </h3>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
