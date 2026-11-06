import {
  Flame,
  Sparkles,
  Moon,
  HeartHandshake,
  Crown,
  Gem,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

const REMEDY_TYPE_META = {
  puja: {
    label: "Sacred Ritual & Puja",
    icon: Flame,
    colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  mantra: {
    label: "Japa & Stotra Recitation",
    icon: Sparkles,
    colorClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  fasting: {
    label: "Vrat & Dietary Discipline",
    icon: Moon,
    colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  },
  donation: {
    label: "Dana (Charitable Offering)",
    icon: HeartHandshake,
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  deity: {
    label: "Deity Adoration & Bhakti",
    icon: Crown,
    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  gemstone: {
    label: "Ratna (Gemstone Therapy)",
    icon: Gem,
    colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
};

export default function DoshaRemediesList({ remedies = [] }) {
  if (!Array.isArray(remedies) || remedies.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 text-center text-muted-foreground text-sm font-sans">
        Remedial Upayas are prescribed dynamically based on individual planetary dasha.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {remedies.map((remedy, idx) => {
        const rawType = String(remedy.type || "general").toLowerCase();
        const meta = REMEDY_TYPE_META[rawType] || {
          label: "Vedic Upaya",
          icon: BookOpen,
          colorClass: "bg-accent text-muted-foreground border-border/70",
        };
        const IconComponent = meta.icon;

        return (
          <div
            key={idx}
            className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${meta.colorClass}`}
                >
                  <IconComponent className="w-3 h-3 shrink-0" />
                  <span>{meta.label}</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Upaya #{idx + 1}
                </span>
              </div>

              <h4 className="font-serif text-base sm:text-lg font-medium text-foreground tracking-tight leading-snug">
                {remedy.title}
              </h4>

              <p className="text-xs sm:text-sm text-foreground/80 mt-2 font-sans leading-relaxed">
                {remedy.description}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Authentic classical Shastra protocol</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

