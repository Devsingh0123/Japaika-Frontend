import { Link, useNavigate } from "react-router-dom";
import { Sparkles, MessageSquare, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AskJyotishDoshaBanner({ doshaName = "this Dosha" }) {
  const navigate = useNavigate();

  const handleAskJyotish = () => {
    const questionText = encodeURIComponent(
      `Check my birth chart for ${doshaName}. Do I have it, and are there any classical cancellations or remedies that apply to me?`
    );
    navigate(`/?engine=jyotish&prompt=${questionText}`);
  };

  return (
    <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-md">
      {/* Decorative Celestial Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
            <Sparkles className="w-3 h-3" />
            <span>AI Chart Verification</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Do You Have {doshaName} in Your Kundli?
          </h3>

          <p className="text-xs sm:text-sm text-foreground/80 font-sans leading-relaxed">
            Don’t rely on generic advice. Jyotish AI reads your specific D-1 Lagna, Moon, and divisional placements to determine if this dosha is active, dormant, or fully neutralized.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            type="button"
            onClick={handleAskJyotish}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-medium shadow-md shadow-primary/20 hover:brightness-105 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Check My Chart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-border/80 hover:bg-accent text-foreground px-5 py-3 rounded-2xl text-xs sm:text-sm cursor-pointer"
          >
            <Link to="/calculators" className="flex items-center justify-center gap-1.5">
              <Compass className="w-4 h-4 text-muted-foreground" />
              <span>Calculators</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

