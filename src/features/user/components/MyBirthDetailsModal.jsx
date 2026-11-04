import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { MapPin, Calendar, Clock, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import VedicDatePicker from "@/components/common/VedicDatePicker"
import VedicTimePicker from "@/components/common/VedicTimePicker"
import { updateUserBirthDetails } from "@/features/auth/authSlice"
import { apiClient } from "@/lib/api-client"

export default function MyBirthDetailsModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const { user, birthDetails, isAuthenticated } = useSelector((state) => state.auth)

  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState("male")
  const [dob, setDob] = useState("")
  const [tob, setTob] = useState("")
  const [isTimeUnknown, setIsTimeUnknown] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setFullName(birthDetails?.fullName || user?.name || "")
    setGender((birthDetails?.gender || user?.gender || "male").toLowerCase())

    const dateStr = birthDetails?.dateOfBirth || birthDetails?.dob || ""
    setDob(dateStr ? dateStr.split("T")[0] : "")

    const timeStr = birthDetails?.timeOfBirth || birthDetails?.tob || ""
    setTob(timeStr ? timeStr.slice(0, 5) : "")
    setIsTimeUnknown(Boolean(birthDetails?.isTimeUnknown))

    const city = birthDetails?.birthCity || birthDetails?.city || ""
    setCityQuery(city)

    if (birthDetails?.latitude != null && birthDetails?.longitude != null) {
      setSelectedLocation({
        city,
        lat: Number(birthDetails.latitude),
        lng: Number(birthDetails.longitude),
        timezoneOffset: Number(birthDetails.timezone ?? 5.5),
      })
    } else {
      setSelectedLocation(null)
    }
  }, [isOpen, birthDetails, user])

  useEffect(() => {
    const query = cityQuery.trim()
    if (query.length < 2 || selectedLocation?.city === query) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const res = await apiClient.get("/vedic/location/autocomplete", {
          params: { query },
        })
        setSuggestions(res.data?.data?.results || res.data?.results || [])
      } catch {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [cityQuery, selectedLocation])

  const handleSelectLocation = (item) => {
    const city = item.displayName || item.place || item.city || ""
    setSelectedLocation({
      city,
      lat: Number(item.latitude ?? item.lat),
      lng: Number(item.longitude ?? item.lng),
      timezoneOffset: Number(item.timezoneOffset ?? item.timezone ?? 5.5),
    })
    setCityQuery(city)
    setSuggestions([])
  }

  const handleSave = async () => {
    const trimmedName = fullName.trim()
    if (!trimmedName) {
      toast.error("Please provide your full name.")
      return
    }
    if (!dob) {
      toast.error("Please select your date of birth.")
      return
    }
    if (!selectedLocation?.city || Number.isNaN(selectedLocation.lat) || Number.isNaN(selectedLocation.lng)) {
      toast.error("Please select a valid place of birth from the suggestions.")
      return
    }

    setIsSaving(true)
    const formattedTime = isTimeUnknown || !tob ? "12:00:00" : `${tob}:00`

    const updatedDetails = {
      fullName: trimmedName,
      name: trimmedName,
      gender,
      dateOfBirth: dob,
      dob,
      timeOfBirth: formattedTime,
      tob: formattedTime,
      isTimeUnknown,
      birthCity: selectedLocation.city,
      city: selectedLocation.city,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      timezone: selectedLocation.timezoneOffset,
    }

    dispatch(updateUserBirthDetails(updatedDetails))

    if (isAuthenticated) {
      try {
        await apiClient.post("/onboarding", {
          name: updatedDetails.fullName,
          gender: updatedDetails.gender,
          dob: updatedDetails.dateOfBirth,
          tob: updatedDetails.timeOfBirth,
          isTimeUnknown: updatedDetails.isTimeUnknown,
          location: {
            city: selectedLocation.city,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            timezone: selectedLocation.timezoneOffset,
            timezoneOffset: selectedLocation.timezoneOffset,
          },
        })
      } catch (err) {
        console.warn("Failed to sync birth details:", err.message)
      }
    }

    setIsSaving(false)
    toast.success("Birth details updated!")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card/90 border border-border/80 text-foreground p-6 space-y-5 rounded-3xl shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <DialogTitle className="text-xl font-serif font-medium tracking-tight text-foreground">
              Birth details
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-sans leading-relaxed">
            These power every reading Jyotish gives you. Keep them accurate for the sharpest chart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 font-sans text-xs">
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium">Full name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-accent/40 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:border-primary text-sm h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {["female", "male", "other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer ${
                    gender === g
                      ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                      : "bg-accent/40 border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Date of birth *</span>
              </label>
              <VedicDatePicker
                value={dob}
                onChange={setDob}
                placeholder="Select a date"
                className="bg-accent/40 border-border/80 text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Time of birth</span>
              </label>
              <VedicTimePicker
                value={isTimeUnknown ? "12:00" : tob}
                onChange={setTob}
                disabled={isTimeUnknown}
                placeholder="Select a time"
                className="bg-accent/40 border-border/80 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Place of birth *</span>
            </label>

            <Popover
              open={suggestions.length > 0}
              onOpenChange={(open) => {
                if (!open) setSuggestions([])
              }}
            >
              <PopoverAnchor asChild>
                <div className="relative">
                  <Input
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value)
                      setSelectedLocation(null)
                    }}
                    placeholder="Search city, state, country..."
                    className="bg-accent/40 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:border-primary text-sm h-10 rounded-xl pr-9"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin absolute right-3 top-3" />
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
                className="w-[var(--radix-popover-anchor-width)] rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl p-1.5 space-y-0.5 max-h-48 overflow-y-auto overscroll-contain z-[100]"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectLocation(item)}
                    className="w-full text-left p-2 rounded-xl hover:bg-accent text-xs text-popover-foreground transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">
                      {item.displayName || item.place || item.city}
                    </span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground font-sans leading-relaxed pt-1 border-t border-border/50">
          Don&apos;t know your birth time? Leave it blank, your reading stays approximate.
        </p>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="text-xs px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
