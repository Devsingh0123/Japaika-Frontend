import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import VedicDatePicker from "@/components/common/VedicDatePicker";
import VedicTimePicker from "@/components/common/VedicTimePicker";
import {
  searchLocations,
  clearLocationSuggestions,
} from "../calculatorSlice";

export default function BirthDetailsForm({
  onSubmit,
  isLoading = false,
  initialValues = null,
}) {
  const dispatch = useDispatch();
  const { locationSuggestions, isSearchingLocation } = useSelector(
    (state) => state.calculators
  );

  const [formData, setFormData] = useState({
    name: initialValues?.name || "Anonymous",
    gender: initialValues?.gender || "male",
    dob: initialValues?.dob || "",
    tob: initialValues?.tob || "",
    isTimeUnknown: Boolean(initialValues?.isTimeUnknown),
    city: initialValues?.location?.city || "",
    lat: initialValues?.location?.lat,
    lng: initialValues?.location?.lng,
    timezoneOffset: initialValues?.location?.timezoneOffset ?? 5.5,
  });

  const [locationInput, setLocationInput] = useState(
    initialValues?.location?.city || ""
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (!showDropdown || locationInput.trim().length < 2) return;
    const timer = setTimeout(() => {
      dispatch(searchLocations(locationInput));
    }, 350);
    return () => clearTimeout(timer);
  }, [locationInput, showDropdown, dispatch]);

  const handleSelectLocation = (loc) => {
    const cityName = loc.displayName || loc.place || loc.city;
    setLocationInput(cityName);
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      lat: Number(loc.latitude ?? loc.lat),
      lng: Number(loc.longitude ?? loc.lng),
      timezoneOffset: Number(loc.timezone ?? loc.timezoneOffset ?? 5.5),
    }));
    setShowDropdown(false);
    dispatch(clearLocationSuggestions());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientError("");

    if (!formData.dob) {
      setClientError("Please provide your date of birth.");
      return;
    }
    if (!formData.isTimeUnknown && !formData.tob) {
      setClientError("Please specify time of birth or select 'Time unknown'.");
      return;
    }
    if (!formData.city || formData.lat == null || formData.lng == null) {
      setClientError("Please select a valid place of birth from the dropdown.");
      return;
    }

    onSubmit({
      name: formData.name,
      gender: formData.gender,
      dob: formData.dob,
      tob: formData.isTimeUnknown ? "12:00" : formData.tob,
      isTimeUnknown: formData.isTimeUnknown,
      location: {
        city: formData.city,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        timezone: Number(formData.timezoneOffset),
        timezoneOffset: Number(formData.timezoneOffset),
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card relative overflow-hidden rounded-2xl border border-border/80 shadow-xl text-left"
    >
      <div className="border-border/60 border-b px-5 py-3 sm:px-6">
        <span className="block font-mono text-[9.5px] tracking-[0.22em] text-primary uppercase font-semibold">
          CONSOLE
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {clientError && (
          <div className="mb-4 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{clientError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <span className="block font-mono text-[9.5px] tracking-[0.22em] text-muted-foreground mb-1.5 uppercase font-medium">
              DATE OF BIRTH
            </span>
            <VedicDatePicker
              value={formData.dob}
              onChange={(newDob) =>
                setFormData((prev) => ({ ...prev, dob: newDob }))
              }
              placeholder="Select date of birth"
            />
          </div>

          <div className="min-w-0 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block font-mono text-[9.5px] tracking-[0.22em] text-muted-foreground uppercase font-medium">
                TIME OF BIRTH
              </span>
              <label className="text-[10px] font-mono text-muted-foreground/80 flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isTimeUnknown}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isTimeUnknown: e.target.checked,
                    }))
                  }
                  className="rounded border-input bg-card text-primary focus:ring-0 w-3 h-3 cursor-pointer"
                />
                <span>Time unknown</span>
              </label>
            </div>
            <VedicTimePicker
              value={formData.isTimeUnknown ? "12:00" : formData.tob}
              onChange={(newTob) =>
                setFormData((prev) => ({ ...prev, tob: newTob }))
              }
              disabled={formData.isTimeUnknown}
              placeholder="Select time of birth"
            />
          </div>

          <div className="min-w-0 col-span-2">
            <span className="block font-mono text-[9.5px] tracking-[0.22em] text-muted-foreground mb-1.5 uppercase font-medium">
              PLACE OF BIRTH
            </span>

            <Popover
              open={showDropdown && locationSuggestions.length > 0}
              onOpenChange={(open) => {
                if (!open) setShowDropdown(false);
              }}
            >
              <PopoverAnchor asChild>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search city, state, country..."
                    autoComplete="off"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowDropdown(true);
                      setFormData((prev) => ({
                        ...prev,
                        city: "",
                        lat: undefined,
                        lng: undefined,
                      }));
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="border-input bg-card/70 text-foreground placeholder:text-muted-foreground/60 caret-primary focus:border-primary focus:bg-card w-full rounded-xl border px-[13px] py-[11px] font-sans text-[15px] transition outline-none pr-10 shadow-sm"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {isSearchingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Search className="w-4 h-4 text-muted-foreground/70" />
                    )}
                  </div>
                </div>
              </PopoverAnchor>

              <PopoverContent
                align="start"
                sideOffset={6}
                collisionPadding={16}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onWheel={(e) => e.stopPropagation()}
                className="w-[var(--radix-popover-anchor-width)] p-0 bg-popover text-popover-foreground max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-border/80 shadow-2xl divide-y divide-border/40 z-[100]"
              >
                {locationSuggestions.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectLocation(item)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-accent/40 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-medium truncate">
                        {item.displayName || item.place || item.city}
                      </span>
                    </div>
                    {item.latitude != null && item.longitude != null && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                        {Number(item.latitude).toFixed(2)}°,{" "}
                        {Number(item.longitude).toFixed(2)}°
                      </span>
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="mt-[18px] w-full cursor-pointer rounded-full py-3.5 text-center font-sans text-sm font-medium transition shadow-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
              <span>Computing...</span>
            </>
          ) : (
            <span>Compute</span>
          )}
        </button>
      </div>
    </form>
  );
}
