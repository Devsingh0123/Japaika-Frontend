import React from "react";

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    desc: "Enter your date, exact time and place of birth.",
  },
  {
    step: "02",
    desc: "Japaika computes planetary degrees using astronomical algorithms and sets your ascendant.",
  },
  {
    step: "03",
    desc: "Read your chart: houses, planetary placements, Dasha timeline and yogas.",
  },
];

const DEFAULT_FAQS = [
  {
    q: "What is a Kundli?",
    a: "A Kundli, also called a Janam Kundali or birth chart, is an astrological map of the sky at the exact time and place of your birth. It shows where the planets, Sun and Moon sit across the twelve houses.",
  },
  {
    q: "How accurate is this Kundli calculator?",
    a: "It uses astronomical algorithms planetary data, the same source professional astrologers rely on, so planetary degrees, ascendant and Dasha periods are calculated to professional-grade precision.",
  },
  {
    q: "What if I don't know my exact birth time?",
    a: "If your birth time is unknown, toggle the 'Time unknown' switch. The calculator will render a Moon and Sun chart, providing qualitative planetary placements without an unreliable rising degree.",
  },
  {
    q: "What is the difference between Lagna and Rashi?",
    a: "Your Lagna (ascendant) is the constellation rising on the eastern horizon at birth; it frames every house in your chart. Your Rashi (Moon sign) is where the Moon was situated; it governs your internal emotional instincts.",
  },
];

export default function CalculatorFaqSection({
  howItWorks = HOW_IT_WORKS_STEPS,
  faqs = DEFAULT_FAQS,
  toolName = "Free Kundli Maker",
}) {
  const formattedToolName = (toolName || "Kundli")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="space-y-12 mt-12 text-left">
      {/* How it works */}
      <div className="space-y-4">
        <h2 className="font-serif text-[24px] text-foreground sm:text-[28px] font-medium tracking-tight">
          How it works
        </h2>

        <div className="space-y-2.5">
          {howItWorks.map(({ step, desc }) => (
            <div
              key={step}
              className="flex items-start gap-4 rounded-2xl border border-border/80 glass-card bg-card/60 p-4 transition-colors hover:border-primary/40 shadow-xs"
            >
              <span className="font-mono text-sm font-semibold text-primary shrink-0 mt-0.5">
                {step}
              </span>
              <p className="text-sm text-foreground/90 leading-relaxed font-sans">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Understanding Tool */}
      <div className="space-y-5">
        <h2 className="font-serif text-[24px] text-foreground sm:text-[28px] font-medium tracking-tight">
          Understanding {formattedToolName}
        </h2>

        <div className="space-y-3.5">
          {faqs.map(({ q, a }, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 glass-card bg-card/60 p-5 space-y-2 transition-colors hover:border-primary/40 shadow-xs"
            >
              <h3 className="font-serif text-[17px] text-foreground font-medium tracking-tight">
                {q}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
