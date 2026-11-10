import React from "react";
import {
  Compass,
  Hourglass,
  HeartHandshake,
  Flame,
  Clock,
  Sunrise,
  Stars,
  Moon,
  Infinity as InfinityIcon,
  Hash,
  Grid3x3,
  Gem,
  Sparkles,
} from "lucide-react";

export const CALCULATOR_ICON_MAP = {
  "free-kundli-maker": {
    icon: Compass,
    label: "Kundli Chart",
    accent: "text-primary bg-primary/10 border-primary/20",
    gradient: "from-primary/20 to-primary/5",
  },
  "shani-sade-sati": {
    icon: Hourglass,
    label: "Saturn Transit",
    accent: "text-sky-500 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
    gradient: "from-sky-500/20 to-sky-500/5",
  },
  "kundli-milan": {
    icon: HeartHandshake,
    label: "Guna Milan",
    accent: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  "mangal-dosha": {
    icon: Flame,
    label: "Mangal Status",
    accent: "text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
  "vimshottari-dasha": {
    icon: Clock,
    label: "Dasha Timeline",
    accent: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  "ascendant-calculator": {
    icon: Sunrise,
    label: "Rising Lagna",
    accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  "nakshatra-finder": {
    icon: Stars,
    label: "Lunar Mansion",
    accent: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    gradient: "from-indigo-500/20 to-indigo-500/5",
  },
  "moon-sign-calculator": {
    icon: Moon,
    label: "Vedic Rashi",
    accent: "text-sky-500 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
    gradient: "from-sky-500/20 to-sky-500/5",
  },
  "kaal-sarp-dosha": {
    icon: InfinityIcon,
    label: "Rahu Ketu Axis",
    accent: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  "numerology-calculator": {
    icon: Hash,
    label: "Numerology",
    accent: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  "ashtakavarga-calculator": {
    icon: Grid3x3,
    label: "Bindu Matrix",
    accent: "text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  "gemstone-advisor": {
    icon: Gem,
    label: "Vedic Ratna",
    accent: "text-teal-500 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
    gradient: "from-teal-500/20 to-teal-500/5",
  },
};

/**
 * CalculatorIcon
 * Replaces legacy raster PNGs with clean, scalable, theme-adaptive vector icons.
 *
 * @param {string} toolId - ID of the calculator (e.g. "shani-sade-sati")
 * @param {"sm"|"md"|"lg"} size - Size of the icon plate
 * @param {string} className - Additional CSS classes
 */
export default function CalculatorIcon({
  toolId,
  size = "sm",
  className = "",
}) {
  const meta = CALCULATOR_ICON_MAP[toolId] || {
    icon: Sparkles,
    label: "Vedic Instrument",
    accent: "text-primary bg-primary/10 border-primary/20",
    gradient: "from-primary/20 to-primary/5",
  };

  const IconComponent = meta.icon;

  const sizeClasses = {
    sm: "h-[42px] w-[42px] rounded-[12px]",
    md: "h-[50px] w-[50px] rounded-[14px]",
    lg: "h-[54px] w-[54px] sm:h-[62px] sm:w-[62px] rounded-[16px]",
  }[size] || "h-[42px] w-[42px] rounded-[12px]";

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7 sm:w-8 sm:h-8",
  }[size] || "w-5 h-5";

  return (
    <span
      className={`relative grid place-items-center flex-none overflow-hidden border border-border/80 glass-card bg-gradient-to-br ${meta.gradient} shadow-xs transition duration-200 group-hover:scale-105 group-hover:border-primary/50 ${sizeClasses} ${className}`}
      aria-label={meta.label}
    >
      <IconComponent
        className={`${iconSizes} ${meta.accent.split(" ")[0]} transition-transform duration-200 group-hover:scale-110`}
      />
    </span>
  );
}
