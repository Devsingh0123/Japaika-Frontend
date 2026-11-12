import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Check,
  X,
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import VedicDatePicker from "@/components/common/VedicDatePicker"
import VedicTimePicker from "@/components/common/VedicTimePicker"
import { toast } from "sonner"
import { trackEvent, setUserContext } from "@/lib/analytics"
import {
  closeAuthModal,
  setEmail as setStoreEmail,
  setStep as setStoreStep,
  clearError,
  sendOtp,
  verifyOtp,
  submitOnboarding,
} from "./authSlice"

export default function AuthModal({ isOpen: propsIsOpen, onClose: propsOnClose }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {
    isAuthModalOpen,
    email: storeEmail,
    step,
    cooldownSeconds,
    user,
    loading,
    error,
  } = useSelector((state) => state.auth || {})

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isAuthModalOpen

  const [localEmail, setLocalEmail] = useState(storeEmail || "")
  // 6 separate digit inputs for OTP (Screenshot 1)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef([])

  const [resendTimer, setResendTimer] = useState(38)

  // Step 3 (About You) State (Screenshot 2)
  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState("Female") // "Female" | "Male" | "Other"

  // Step 4 (Your Birth Details) State (Screenshots 3 & 4)
  const [birthDate, setBirthDate] = useState("")
  const [birthTime, setBirthTime] = useState("")
  const [unknownTime, setUnknownTime] = useState(false)
  const [birthPlace, setBirthPlace] = useState("")

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let interval = null
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, resendTimer])

  // Sync initial user details if available
  useEffect(() => {
    if (user?.name) setFullName(user.name)
    if (user?.gender) setGender(user.gender)
    if (user?.birthDate) setBirthDate(user.birthDate)
    if (user?.birthTime) setBirthTime(user.birthTime)
    if (user?.birthPlace) setBirthPlace(user.birthPlace)
  }, [user])

  const handleClose = (open) => {
    if (!open) {
      if (propsOnClose) {
        propsOnClose(false)
      }
      dispatch(closeAuthModal())
      setOtpDigits(["", "", "", "", "", ""])
    }
  }

  const isValidEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim())
  }

  // STEP 1 SUBMIT: Send OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = localEmail.trim()
    if (!isValidEmail(trimmedEmail)) return

    dispatch(clearError())
    dispatch(setStoreEmail(trimmedEmail))
    const result = await dispatch(sendOtp({ email: trimmedEmail }))
    if (!result.error) {
      try {
        trackEvent("otp_requested", { method: "email" })
      } catch {
        // Analytics non-blocking
      }
      setResendTimer(cooldownSeconds || 38)
      setOtpDigits(["", "", "", "", "", ""])
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus()
      }, 100)
    }
  }

  // OTP Digit Box Change Handler
  const handleOtpDigitChange = (index, val) => {
    const cleaned = val.replace(/\D/g, "")
    if (!cleaned) {
      const nextDigits = [...otpDigits]
      nextDigits[index] = ""
      setOtpDigits(nextDigits)
      return
    }

    // If pasted multiple digits
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split("")
      const nextDigits = [...otpDigits]
      pasteDigits.forEach((d, i) => {
        if (index + i < 6) nextDigits[index + i] = d
      })
      setOtpDigits(nextDigits)
      const nextIndex = Math.min(5, index + pasteDigits.length)
      if (otpRefs.current[nextIndex]) otpRefs.current[nextIndex].focus()
      return
    }

    const nextDigits = [...otpDigits]
    nextDigits[index] = cleaned[0]
    setOtpDigits(nextDigits)

    // Auto-advance to next box
    if (index < 5 && cleaned[0]) {
      if (otpRefs.current[index + 1]) otpRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      if (otpRefs.current[index - 1]) {
        otpRefs.current[index - 1].focus()
      }
    }
  }

  // STEP 2 SUBMIT: Verify OTP
  const fullOtp = otpDigits.join("")
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (fullOtp.length !== 6) return

    dispatch(clearError())
    const emailToVerify = localEmail || storeEmail
    const result = await dispatch(verifyOtp({ email: emailToVerify, otp: fullOtp }))
    if (!result.error) {
      const verifiedUser = result.payload?.user
      const isComplete = Boolean(verifiedUser?.onboardingCompleted)
      const isNewUser = Boolean(result.payload?.isNewUser || result.payload?.is_new_user)

      try {
        if (isNewUser) {
          trackEvent("sign_up", { method: "email_otp", user_id: verifiedUser?.id })
        } else {
          trackEvent("login", { method: "email_otp", user_id: verifiedUser?.id })
        }
        setUserContext(verifiedUser)
      } catch {
        // Analytics non-blocking
      }

      if (propsOnClose) propsOnClose(false)
      dispatch(closeAuthModal())
      setOtpDigits(["", "", "", "", "", ""])

      if (isComplete) {
        navigate("/")
      } else {
        navigate("/onboarding")
      }
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return
    dispatch(clearError())
    const emailToTarget = localEmail || storeEmail
    const result = await dispatch(sendOtp({ email: emailToTarget }))
    if (!result.error) {
      setResendTimer(cooldownSeconds || 38)
    }
  }

  const handleBackToEmail = () => {
    dispatch(clearError())
    dispatch(setStoreStep(1))
    setOtpDigits(["", "", "", "", "", ""])
  }

  // STEP 3 SUBMIT: About You -> Advance to Step 4
  const handleAboutYouSubmit = (e) => {
    e.preventDefault()
    if (!fullName.trim()) return
    dispatch(setStoreStep(4))
  }

  // STEP 4 SUBMIT: Birth Details -> Finalize Profile
  const handleBirthDetailsSubmit = async (e) => {
    e.preventDefault()
    if (!birthDate || (!birthPlace.trim() && !birthPlace)) {
      toast.error("Please provide your date and place of birth.")
      return
    }

    const payload = {
      name: fullName.trim(),
      gender: gender.toLowerCase(),
      dob: birthDate,
      tob: unknownTime ? "12:00:00" : birthTime,
      isTimeUnknown: unknownTime,
      location: {
        city: birthPlace.trim(),
        lat: 12.9716,
        lng: 77.5946,
        timezoneOffset: 5.5,
      },
    }

    const result = await dispatch(submitOnboarding(payload))
    if (!result.error) {
      if (propsOnClose) {
        propsOnClose(false)
      }
      navigate("/")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[760px] md:max-w-[820px] w-[95vw] p-0 overflow-hidden border border-border/80 bg-card/90 backdrop-blur-2xl text-foreground rounded-2xl sm:rounded-3xl shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 min-h-[460px]">
          {/* ================= LEFT HERO COLUMN ================= */}
          <div className="md:col-span-2 p-6 md:p-8 bg-accent/40 border-b md:border-b-0 md:border-r border-border/80 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle celestial radial aura */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <img
                  src="/japaikaLogo.svg"
                  alt=""
                  className="w-9 h-9 object-contain shrink-0"
                />
                <img
                  src="/japaikaName.svg"
                  alt="Japaika"
                  className="h-6 w-auto object-contain select-none"
                />
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground leading-tight">
                  This needs your <span className="text-primary italic">birth chart</span>
                </h2>
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-accent/60 border border-border/80 text-xs font-mono text-muted-foreground">
                  &ldquo;Buy Diamond&rdquo;
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-3 pt-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>Readings saved to your chart, not a cookie</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>Jyotish remembers every thread</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>Shastra stays free</span>
                </li>
              </ul>
            </div>

            <div className="text-[10px] text-muted-foreground font-mono pt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Vedic Swiss-Ephemeris Engine</span>
            </div>
          </div>

          {/* ================= RIGHT FORM COLUMN ================= */}
          <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-between relative bg-card/60">
            {/* Top Close Button */}
            <button
              onClick={() => handleClose(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-accent/60 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ---------------- STEP 1: EMAIL ENTRY ---------------- */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-5 pt-1">
                {/* 4-Step Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] mb-2">
                    <span className="text-primary font-semibold">YOUR EMAIL</span>
                    <span className="text-muted-foreground">STEP 1 OF 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-border" />
                    <div className="h-0.5 rounded-full bg-border" />
                    <div className="h-0.5 rounded-full bg-border" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h3 className="text-2xl sm:text-[28px] font-serif font-normal text-foreground">
                    What&apos;s your email?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    We&apos;ll text a 6-digit code to verify it. Your chart and readings stay tied to this email.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div className="flex items-center rounded-2xl border border-border/80 bg-accent/30 px-4 py-3 focus-within:border-primary transition-all">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0 mr-3" />
                  <Input
                    type="email"
                    placeholder="alex.mercer@example.com"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="border-0 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus-visible:ring-0 shadow-none h-auto p-0"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!isValidEmail(localEmail) || loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Code...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            )}

            {/* ---------------- STEP 2: OTP VERIFICATION (Screenshot 1) ---------------- */}
            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-5 pt-1">
                {/* 4-Step Progress Bar with Change Email */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] mb-2">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>CHANGE EMAIL</span>
                    </button>
                    <span className="text-muted-foreground">STEP 2 OF 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-border" />
                    <div className="h-0.5 rounded-full bg-border" />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-2xl sm:text-[28px] font-serif font-normal text-foreground">
                    Enter the code
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Sent to <span className="text-foreground font-medium">{localEmail || storeEmail}</span>. Enter the 6-digit code.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {error}
                  </div>
                )}

                {/* 6 Individual Digit Boxes */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-14 sm:w-12 sm:h-14 rounded-2xl bg-accent/40 border border-border/80 text-center font-mono text-xl sm:text-2xl font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground pt-1 font-sans">
                    Didn&apos;t get it?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0 || loading}
                      className="text-primary hover:underline disabled:opacity-40 disabled:no-underline font-medium cursor-pointer ml-1"
                    >
                      {resendTimer > 0 ? `Resend code in 0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}` : "Resend code"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={fullOtp.length !== 6 || loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            )}

            {/* ---------------- STEP 3: ABOUT YOU (Screenshot 2) ---------------- */}
            {step === 3 && (
              <form onSubmit={handleAboutYouSubmit} className="space-y-5 pt-1">
                {/* 4-Step Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] mb-2">
                    <span className="text-primary font-semibold">ABOUT YOU</span>
                    <span className="text-muted-foreground">STEP 3 OF 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-border" />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-2xl sm:text-[28px] font-serif font-normal text-foreground">
                    A little about you
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    This helps Jyotish address you the right way.
                  </p>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                    NAME
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-border/80 bg-accent/30 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                    autoFocus
                    required
                  />
                </div>

                {/* Gender Pills Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                    GENDER
                  </label>
                  <div className="flex items-center gap-2.5">
                    {["Female", "Male", "Other"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setGender(item)}
                        className={`rounded-full px-5 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                          gender === item
                            ? "border border-primary bg-primary/10 text-primary font-medium shadow-xs"
                            : "border border-border/80 bg-accent/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!fullName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm"
                >
                  Continue
                </Button>
              </form>
            )}

            {/* ---------------- STEP 4: BIRTH DETAILS (Screenshots 3 & 4) ---------------- */}
            {step === 4 && (
              <form onSubmit={handleBirthDetailsSubmit} className="space-y-4 pt-1">
                {/* 4-Step Progress Bar with Back */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] mb-2">
                    <button
                      type="button"
                      onClick={() => dispatch(setStoreStep(3))}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>BACK</span>
                    </button>
                    <span className="text-muted-foreground">STEP 4 OF 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                    <div className="h-0.5 rounded-full bg-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-[28px] font-serif font-normal text-foreground">
                    Your birth details
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Vedic astrology reads your chart from the exact moment and place you were born.
                  </p>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                      DATE OF BIRTH
                    </label>
                    <VedicDatePicker
                      value={birthDate}
                      onChange={setBirthDate}
                      placeholder="Select a date"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                      TIME OF BIRTH
                    </label>
                    <VedicTimePicker
                      value={unknownTime ? "12:00" : birthTime}
                      onChange={setBirthTime}
                      disabled={unknownTime}
                      placeholder="Select a time"
                    />
                  </div>
                </div>

                {/* Don't know time checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={unknownTime}
                    onChange={(e) => setUnknownTime(e.target.checked)}
                    className="w-4 h-4 rounded-full border-border accent-primary cursor-pointer"
                  />
                  <span>I don&apos;t know my time of birth</span>
                </label>

                {/* Place of Birth Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                    PLACE OF BIRTH
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-muted-foreground absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="City, State, Country"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="w-full rounded-2xl border border-border/80 bg-accent/30 pl-10 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!birthDate || !birthPlace.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3.5 rounded-full transition shadow-md shadow-primary/20 disabled:opacity-40 cursor-pointer text-sm"
                >
                  Continue
                </Button>
              </form>
            )}

            {/* Bottom Footer Note */}
            <div className="text-[10px] text-center font-mono text-muted-foreground pt-4 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                {step === 1 && "WE ONLY USE YOUR EMAIL TO SIGN YOU IN"}
                {step === 2 && "NEVER SHARE THIS CODE WITH ANYONE"}
                {step === 3 && "YOU CAN CHANGE THIS LATER"}
                {step === 4 && "YOU CAN REFINE THESE ANY TIME"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
