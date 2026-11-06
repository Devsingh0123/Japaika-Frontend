import { ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";

export default function DoshaCancellationsCard({ cancellations, doshaName = "this Dosha" }) {
  if (!cancellations) return null;

  // Split lines into structured list if formatted with numbers or newlines
  const rawLines = String(cancellations)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let intro = "";
  const rules = [];

  rawLines.forEach((line) => {
    // If it starts with a number like "1." or "-"
    if (/^(\d+[.)]|-|\*)\s*/.test(line)) {
      rules.push(line.replace(/^(\d+[.)]|-|\*)\s*/, ""));
    } else if (rules.length === 0) {
      intro = line;
    } else {
      rules.push(line);
    }
  });

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Decorative Top Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-semibold block leading-tight">
              VEDIC NIVARAN & CANCELLATIONS
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              How {doshaName} is Naturally Neutralized
            </h3>
          </div>
        </div>

        {intro && (
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
            {intro}
          </p>
        )}

        {rules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-500/20 bg-background/80 text-xs sm:text-sm text-foreground/90 font-sans shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-background/80 text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed">
            {cancellations}
          </div>
        )}

        <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            If any of these conditions are present in your natal chart, the dosha is neutralized or rendered auspicious.
          </span>
        </div>
      </div>
    </div>
  );
}
