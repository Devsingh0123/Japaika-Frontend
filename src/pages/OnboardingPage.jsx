import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Check,
  ArrowLeft,
  MapPin,
  Loader2,
  Compass,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import VedicDatePicker from "@/components/common/VedicDatePicker"
import VedicTimePicker from "@/components/common/VedicTimePicker"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { trackEvent } from "@/lib/analytics"
import {
  submitOnboarding,
  setOnboardingStep,
  updateOnboardingData,
} from "@/features/auth/authSlice"

function formatLocationName(loc) {
  return (
    loc.displayName ||
    loc.place ||
    [loc.city, loc.region, loc.country].filter(Boolean).join(", ")
  )
}

export default function OnboardingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    user,
    onboardingStep,
    onboardingData,
    isOnboardingSubmitting,
    onboardingError,
  } = useSelector((state) => state.auth)

  const [name, setName] = useState(() => onboardingData?.name || user?.name || "")
  const [gender, setGender] = useState(() => onboardingData?.gender || "female")
  const [dob, setDob] = useState(() => onboardingData?.dob || "")
  const [tob, setTob] = useState(() => onboardingData?.tob || "")
  const [isTimeUnknown, setIsTimeUnknown] = useState(
    () => Boolean(onboardingData?.isTimeUnknown)
  )

  const [locationQuery, setLocationQuery] = useState(
    () => onboardingData?.location?.city || ""
  )
  const [selectedLocation, setSelectedLocation] = useState(
    () => onboardingData?.location || null
  )
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name)
    }
  }, [user?.name, name])

  useEffect(() => {
    const trimmed = locationQuery.trim()
    if (!showLocationDropdown || trimmed.length < 2) {
      setLocationSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingLocation(true)
        const response = await apiClient.get("/vedic/location/autocomplete", {
          params: { query: trimmed, limit: 8 },
        })
        setLocationSuggestions(
          response.data?.data?.results || response.data?.results || []
        )
      } catch {
        setLocationSuggestions([])
      } finally {
        setIsSearchingLocation(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [locationQuery, showLocationDropdown])

  const handleSelectLocation = (loc) => {
    const city = formatLocationName(loc)
    const locData = {
      city,
      lat: Number(loc.latitude ?? loc.lat),
      lng: Number(loc.longitude ?? loc.lng),
      timezoneOffset: Number(loc.timezoneOffset ?? loc.timezone ?? 5.5),
    }

    setSelectedLocation(locData)
    setLocationQuery(city)
    setShowLocationDropdown(false)
  }

  const handleBackToStep1 = () => {
    dispatch(
      updateOnboardingData({
        name: name.trim(),
        gender: gender.toLowerCase(),
        dob,
        tob,
        isTimeUnknown,
        location: selectedLocation,
      })
    )
    dispatch(setOnboardingStep(1))
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Please enter your name.")
      return
    }

    dispatch(
      updateOnboardingData({
        name: trimmedName,
        gender: gender.toLowerCase(),
      })
    )
    dispatch(setOnboardingStep(2))
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()

    if (!dob) {
      toast.error("Please provide your date of birth.")
      return
    }

    if (!isTimeUnknown && !tob) {
      toast.error(
        "Please specify your time of birth or select 'I don't know my time of birth'."
      )
      return
    }

    if (!selectedLocation || Number.isNaN(selectedLocation.lat)) {
      toast.error("Please select a valid place of birth from the suggestions.")
      return
    }

    const payload = {
      name: (name || onboardingData?.name || user?.name || "").trim(),
      gender: (gender || onboardingData?.gender || "female").toLowerCase(),
      dob,
      tob: isTimeUnknown ? "12:00" : tob,
      isTimeUnknown,
      location: {
        city: selectedLocation.city,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timezone: selectedLocation.timezoneOffset,
        timezoneOffset: selectedLocation.timezoneOffset,
      },
    }

    const result = await dispatch(submitOnboarding(payload))

    if (!result.error) {
      try {
        trackEvent("birth_chart_bound", {
          birth_city: selectedLocation?.city,
          gender: payload.gender,
          chart_generated: true,
        })
      } catch {
        // Analytics non-blocking
      }
      navigate("/", { replace: true })
    }
  }

  return (
    <div className="min-h-full w-full py-4 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 flex flex-col items-center justify-start lg:justify-center relative overflow-x-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl lg:max-w-4xl lg:my-auto bg-card/90 dark:bg-card/80 backdrop-blur-2xl border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5 relative z-10 transition-colors duration-200">
        {/* ================= LEFT HERO COLUMN (Desktop Only) ================= */}
        <div className="hidden lg:flex lg:col-span-2 p-6 lg:p-8 bg-accent/40 dark:bg-accent/20 border-r border-border/80 flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/japaikaLogo.svg"
                alt=""
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <img
                  src="/japaikaName.svg"
                  alt="Japaika"
                  className="h-6 w-auto object-contain select-none block"
                />
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest block font-medium mt-1">
                  Vedic Astrology Engine
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground leading-tight">
                This needs your{" "}
                <span className="text-amber-600 dark:text-amber-400 italic font-serif">
                  birth chart
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We read your planetary positions directly from the exact time
                and coordinates of your birth.
              </p>
            </div>

            <ul className="space-y-3 pt-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span className="text-foreground/90 font-medium">
                  Readings saved to your natal chart, never a cookie
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span className="text-foreground/90 font-medium">
                  Jyotish AI remembers your planetary transits and dashas
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span className="text-foreground/90 font-medium">
                  Calculators and Shastra stay free & unbounded
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             www.japaika.com
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Lahiri Ayanamsa
            </span>
          </div>
        </div>

        {/* ================= RIGHT INTERACTIVE FORM COLUMN ================= */}
        <div className="lg:col-span-3 p-5 sm:p-7 lg:p-8 flex flex-col justify-between bg-card/60 dark:bg-card/40">
          <div>
            <div className="mb-5 sm:mb-6">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] mb-2">
                <span className="text-primary font-semibold flex items-center gap-1.5 uppercase">
                  <Compass className="w-3 h-3 text-primary shrink-0" />
                  {onboardingStep === 1
                    ? "Step 1 of 2: About you"
                    : "Step 2 of 2: Your birth details"}
                </span>
                <span className="text-muted-foreground font-mono uppercase">
                  {onboardingStep === 1 ? "50% completed" : "Final step"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    onboardingStep >= 1 ? "bg-primary" : "bg-border"
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    onboardingStep >= 2 ? "bg-primary" : "bg-border"
                  }`}
                />
              </div>
            </div>

            {onboardingError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                {onboardingError}
              </div>
            )}

            {/* ---------------- STEP 1: ABOUT YOU ---------------- */}
            {onboardingStep === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-5 sm:space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-normal text-foreground">
                    A little about you
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    This helps Jyotish address you with personal astrological precision.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                    FULL NAME *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-accent/30 dark:bg-accent/20 px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all h-auto"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                    GENDER *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {[
                      { key: "female", label: "Female" },
                      { key: "male", label: "Male" },
                      { key: "other", label: "Other" },
                    ].map((item) => {
                      const isSelected =
                        gender.toLowerCase() === item.key.toLowerCase()
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setGender(item.key)}
                          className={`rounded-xl sm:rounded-2xl py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-all text-center cursor-pointer border ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                              : "border-border/80 bg-accent/30 dark:bg-accent/20 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 sm:py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm h-auto"
                  >
                    Continue to Birth Details
                  </Button>
                </div>
              </form>
            )}

            {/* ---------------- STEP 2: BIRTH DETAILS & AUTOCOMPLETE ---------------- */}
            {onboardingStep === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-mono tracking-wider cursor-pointer transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>BACK TO STEP 1</span>
                  </button>
                  <span className="text-[10px] sm:text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                    Step 2: Coordinates
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-normal text-foreground">
                    Your birth details
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Vedic astrology reads your chart from the exact moment and place you were born.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                      DATE OF BIRTH *
                    </label>
                    <VedicDatePicker
                      value={dob}
                      onChange={setDob}
                      placeholder="Select a date"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                      TIME OF BIRTH
                    </label>
                    <VedicTimePicker
                      value={isTimeUnknown ? "12:00" : tob}
                      onChange={setTob}
                      disabled={isTimeUnknown}
                      placeholder="Select a time"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={isTimeUnknown}
                    onChange={(e) => setIsTimeUnknown(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer shrink-0"
                  />
                  <span>I don&apos;t know my exact time of birth</span>
                </label>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                      PLACE OF BIRTH *
                    </label>
                    {selectedLocation && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Coordinates Locked
                      </span>
                    )}
                  </div>

                  <Popover
                    open={showLocationDropdown && locationSuggestions.length > 0}
                    onOpenChange={(open) => {
                      if (!open) setShowLocationDropdown(false)
                    }}
                  >
                    <PopoverAnchor asChild>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 z-10 shrink-0" />
                        <Input
                          type="text"
                          placeholder="Search city, state, country..."
                          value={locationQuery}
                          onChange={(e) => {
                            setLocationQuery(e.target.value)
                            setShowLocationDropdown(true)
                            if (selectedLocation && selectedLocation.city !== e.target.value) {
                              setSelectedLocation(null)
                            }
                          }}
                          onFocus={() => {
                            if (locationQuery.trim().length >= 2) {
                              setShowLocationDropdown(true)
                            }
                          }}
                          className="w-full rounded-xl sm:rounded-2xl border border-border/80 bg-accent/30 dark:bg-accent/20 pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all h-auto"
                          required
                        />

                        {isSearchingLocation && (
                          <Loader2 className="w-4 h-4 text-primary absolute right-3.5 top-3.5 animate-spin" />
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
                      className="w-[var(--radix-popover-anchor-width)] p-0 bg-popover text-popover-foreground border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-56 overflow-y-auto overscroll-contain"
                    >
                      {locationSuggestions.map((loc, idx) => {
                        const displayName = formatLocationName(loc)
                        const tz = loc.timezoneOffset ?? loc.timezone ?? 5.5
                        const lat = (loc.latitude ?? loc.lat)?.toFixed?.(2)
                        const lng = (loc.longitude ?? loc.lng)?.toFixed?.(2)

                        return (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left px-3.5 sm:px-4 py-2.5 hover:bg-accent transition-colors border-b border-border/40 last:border-0 flex items-center justify-between group cursor-pointer gap-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="text-xs text-foreground truncate font-medium">
                                {displayName}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                              {lat && lng ? `${lat}°, ${lng}°` : `TZ: ${tz >= 0 ? `+${tz}` : tz}`}
                            </div>
                          </button>
                        )
                      })}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      !dob ||
                      (!isTimeUnknown && !tob) ||
                      !selectedLocation ||
                      isOnboardingSubmitting
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 sm:py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm h-auto"
                  >
                    {isOnboardingSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating Birth Chart...
                      </span>
                    ) : (
                      "Save & Continue to Japaika"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="pt-5 mt-5 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Your birth details are encrypted and used exclusively for Vedic calculations.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
