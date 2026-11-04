import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Sparkles,
  Heart,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { apiClient } from "@/lib/api-client";
import VedicDatePicker from "@/components/common/VedicDatePicker";
import VedicTimePicker from "@/components/common/VedicTimePicker";

function PartnerInputCard({
  partnerType,
  title,
  subtitle,
  data,
  onChange,
  onAutoFill,
  canAutoFill,
}) {
  const [locationInput, setLocationInput] = useState(data.city || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setLocationInput(data.city || "");
  }, [data.city]);

  useEffect(() => {
    const query = locationInput.trim();
    if (!showDropdown || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await apiClient.get("/vedic/location/autocomplete", {
          params: { query, limit: 6 },
        });
        setSuggestions(res.data?.data?.results || res.data?.results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationInput, showDropdown]);

  const handleSelectLocation = (loc) => {
    const cityName = loc.displayName || loc.place || loc.city;
    setLocationInput(cityName);
    onChange({
      city: cityName,
      lat: Number(loc.latitude ?? loc.lat),
      lng: Number(loc.longitude ?? loc.lng),
      timezone: Number(loc.timezone ?? loc.timezoneOffset ?? 5.5),
    });
    setShowDropdown(false);
  };

  const isBoy = partnerType === "boy";
  const borderColor = isBoy
    ? "focus-within:border-amber-500/60"
    : "focus-within:border-primary/60";

  return (
    <div className="flex-1 rounded-2xl border border-border/80 glass-card bg-card/85 dark:bg-card/70 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isBoy ? "bg-amber-500" : "bg-primary"
              }`}
            />
            <h3 className="text-base font-semibold text-foreground tracking-wide font-serif">
              {title}
            </h3>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {canAutoFill && onAutoFill && (
          <button
            type="button"
            onClick={onAutoFill}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 glass-card bg-card/60 hover:bg-accent/40 text-foreground text-[11px] font-mono transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Use My Profile</span>
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Full Name
          </label>
          <div
            className={`flex items-center gap-2 rounded-xl border border-border/80 bg-accent/30 dark:bg-accent/20 px-3.5 py-2.5 ${borderColor} transition-colors`}
          >
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              required
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter full name"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Date of Birth
          </label>
          <VedicDatePicker
            value={data.dob}
            onChange={(newDob) => onChange({ dob: newDob })}
            placeholder="Select date of birth"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Time of Birth
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.isTimeUnknown}
                onChange={(e) => onChange({ isTimeUnknown: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-border bg-accent/40 accent-primary"
              />
              <span>Time Unknown</span>
            </label>
          </div>
          <VedicTimePicker
            value={data.isTimeUnknown ? "12:00" : data.tob}
            onChange={(newTob) => onChange({ tob: newTob })}
            disabled={data.isTimeUnknown}
            placeholder="Select time of birth"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Birth City & Location
          </label>

          <Popover
            open={showDropdown && suggestions.length > 0}
            onOpenChange={(open) => {
              if (!open) setShowDropdown(false);
            }}
          >
            <PopoverAnchor asChild>
              <div
                className={`flex items-center gap-2 rounded-xl border border-border/80 bg-accent/30 dark:bg-accent/20 px-3.5 py-2.5 ${borderColor} transition-colors`}
              >
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setShowDropdown(true);
                    onChange({ city: "", lat: undefined, lng: undefined });
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search birth city, state, country..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                )}
              </div>
            </PopoverAnchor>

            <PopoverContent
              align="start"
              sideOffset={6}
              collisionPadding={16}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              className="w-[var(--radix-popover-anchor-width)] rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl backdrop-blur-2xl max-h-56 overflow-y-auto overscroll-contain p-1.5 z-[100]"
            >
              {suggestions.map((loc, idx) => (
                <button
                  key={`${loc.displayName || loc.place}-${idx}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs text-popover-foreground hover:bg-accent/50 transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {loc.displayName || loc.place || loc.city}
                  </span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

const EMPTY_PARTNER = {
  name: "",
  dob: "",
  tob: "",
  isTimeUnknown: false,
  city: "",
  lat: undefined,
  lng: undefined,
  timezone: 5.5,
};

export default function DualBirthForm({ onSubmit, isLoading = false }) {
  const { isAuthenticated, birthDetails } = useSelector((state) => state.auth);

  const [boyData, setBoyData] = useState(EMPTY_PARTNER);
  const [girlData, setGirlData] = useState(EMPTY_PARTNER);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAutoFill = (target) => {
    if (!birthDetails) return;
    const rawTime = birthDetails.timeOfBirth || birthDetails.tob || "";
    const patch = {
      name: birthDetails.fullName || birthDetails.name || "",
      dob: (birthDetails.dateOfBirth || birthDetails.dob || "").split("T")[0],
      tob: rawTime ? rawTime.slice(0, 5) : "",
      isTimeUnknown: Boolean(birthDetails.isTimeUnknown),
      city: birthDetails.birthCity || birthDetails.city || "",
      lat: Number(birthDetails.latitude ?? birthDetails.lat),
      lng: Number(birthDetails.longitude ?? birthDetails.lng),
      timezone: Number(birthDetails.timezone ?? 5.5),
    };

    if (target === "boy") {
      setBoyData((prev) => ({ ...prev, ...patch }));
    } else {
      setGirlData((prev) => ({ ...prev, ...patch }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!boyData.name.trim() || !boyData.dob || boyData.lat == null || boyData.lng == null) {
      setErrorMsg("Please complete name, date of birth, and a valid birth city for Partner 1.");
      return;
    }
    if (!girlData.name.trim() || !girlData.dob || girlData.lat == null || girlData.lng == null) {
      setErrorMsg("Please complete name, date of birth, and a valid birth city for Partner 2.");
      return;
    }

    onSubmit({ boy: boyData, girl: girlData });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PartnerInputCard
          partnerType="boy"
          title="Partner 1 (Groom / Boy)"
          subtitle="First person's birth time, date & coordinates"
          data={boyData}
          onChange={(patch) => setBoyData((prev) => ({ ...prev, ...patch }))}
          canAutoFill={Boolean(isAuthenticated && birthDetails)}
          onAutoFill={() => handleAutoFill("boy")}
        />

        <PartnerInputCard
          partnerType="girl"
          title="Partner 2 (Bride / Girl)"
          subtitle="Second person's birth time, date & coordinates"
          data={girlData}
          onChange={(patch) => setGirlData((prev) => ({ ...prev, ...patch }))}
          canAutoFill={Boolean(isAuthenticated && birthDetails)}
          onAutoFill={() => handleAutoFill("girl")}
        />
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto min-w-[260px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-6 px-8 text-sm shadow-lg shadow-primary/20 cursor-pointer transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating Ashtakoota Milan...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current" />
              <span>Analyze Compatibility (36 Guna)</span>
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
