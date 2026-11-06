import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Sparkles, BookOpen, ArrowUp, ChevronDown, ThumbsUp, ThumbsDown, Plus, SunMedium } from "lucide-react"
import {
  addConversation,
  clearActiveConversation,
  updateConversationFeedback,
  startGenerating,
  setThinkingStep,
  stopGenerating,
} from "../jyotishSlice"
import { streamChatTurn, submitMessageFeedback } from "../jyotishApi"
import { toast } from "sonner"

// Formats seconds into MM:SS left
function formatCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s} left`
}

// Renders markdown bolding and bullet points faithfully with theme-aware colors
function renderParagraph(text, isJyotish) {
  if (!text) return null
  const lines = text.split("\n")
  return (
    <div className="space-y-2">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const bulletContent = trimmed.replace(/^[•-]\s*/, "")
          const match = bulletContent.match(/^\*\*(.*?)\*\*(.*)/)
          if (match) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1">
                <span className={`text-[13px] pt-1 leading-none ${isJyotish ? "text-primary" : "text-amber-500"}`}>
                  •
                </span>
                <p className="flex-1">
                  <span className={`font-semibold ${isJyotish ? "text-primary dark:text-primary-foreground" : "text-amber-600 dark:text-amber-300"}`}>
                    {match[1]}
                  </span>
                  <span className="text-foreground/90">{match[2]}</span>
                </p>
              </div>
            )
          }
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1">
              <span className={`text-[13px] pt-1 leading-none ${isJyotish ? "text-primary" : "text-amber-500"}`}>
                •
              </span>
              <p className="flex-1 text-foreground/90">{bulletContent}</p>
            </div>
          )
        }

        const parts = line.split(/(\*\*.*?\*\*)/g)
        return (
          <p key={lIdx}>
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                  </strong>
                )
              }
              return part
            })}
          </p>
        )
      })}
    </div>
  )
}

export default function JyotishChatConversation({ onOpenBuyModal }) {
  const dispatch = useDispatch()
  const {
    conversations = [],
    activeConversationId,
    activeThreadId,
    isGenerating,
    thinkingStep,
    thinkingSteps = [],
    pendingQuestion,
    pendingEngine,
    questionQuota,
  } = useSelector((state) => state.jyotish || {})
  const { user, birthDetails } = useSelector((state) => state.auth || {})

  const activeQuestionQuota =
    typeof questionQuota === "number"
      ? questionQuota
      : typeof user?.creditBalance === "number"
        ? user.creditBalance
        : typeof user?.credit_balance === "number"
          ? user.credit_balance
          : 0

  // 1. Identify the current active thread ID
  const currentThreadId =
    activeThreadId ||
    (activeConversationId
      ? conversations.find(
        (c) => c.id === activeConversationId || c.threadId === activeConversationId
      )?.threadId || activeConversationId
      : null)

  // 2. Filter readings that belong to this thread or active conversation
  const threadReadings = currentThreadId
    ? conversations.filter(
      (c) => c.threadId === currentThreadId || c.id === currentThreadId
    )
    : conversations.filter((c) => c.id === activeConversationId)

  // 3. Sort chronologically (oldest first) so user reads downwards naturally
  const displayReadings = [...threadReadings].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime()
    const timeB = new Date(b.createdAt || 0).getTime()
    return timeA - timeB
  })

  // 4. Latest reading in the active thread
  const latestReading =
    displayReadings.length > 0 ? displayReadings[displayReadings.length - 1] : null

  const isJyotish = (latestReading?.engine || pendingEngine || "jyotish") === "jyotish"

  const [followUpQuery, setFollowUpQuery] = useState("")
  const [inFlightQuery, setInFlightQuery] = useState("")
  const [expandedAstrologyMap, setExpandedAstrologyMap] = useState({})
  const [countdownSeconds, setCountdownSeconds] = useState(582)
  const scrollAreaRef = useRef(null)
  const latestTurnRef = useRef(null)
  const generatingTurnRef = useRef(null)
  const prevReadingsLengthRef = useRef(displayReadings.length)
  const prevGeneratingRef = useRef(isGenerating)

  const toggleExpandedAstrology = (id) => {
    setExpandedAstrologyMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Countdown timer for promotional offer banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Reset scroll to top when switching between conversation threads
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [currentThreadId])

  // Ensure parent main container and window are at top when chat view mounts
  useEffect(() => {
    if (scrollAreaRef.current) {
      const parentMain = scrollAreaRef.current.closest("main")
      if (parentMain) {
        parentMain.scrollTop = 0
      }
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [])

  // Smart scrolling: Keep the user focused on the beginning of their new turn / answer
  useEffect(() => {
    const readingsCountChanged = displayReadings.length !== prevReadingsLengthRef.current
    const generatingStarted = !prevGeneratingRef.current && isGenerating
    const generatingFinished = prevGeneratingRef.current && !isGenerating

    prevReadingsLengthRef.current = displayReadings.length
    prevGeneratingRef.current = isGenerating

    // 1. When a new question starts generating: scroll smoothly to show question and thinking indicator
    if (generatingStarted) {
      requestAnimationFrame(() => {
        if (displayReadings.length === 0) {
          if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0
        } else if (generatingTurnRef.current) {
          generatingTurnRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      })
      return
    }

    // 2. When generation finishes and answer arrives: bring top of the answer into view
    if (generatingFinished || (readingsCountChanged && displayReadings.length > 0)) {
      requestAnimationFrame(() => {
        if (displayReadings.length === 1 && scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = 0
        } else if (latestTurnRef.current) {
          latestTurnRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      })
    }
  }, [displayReadings.length, isGenerating])

  const handleSendFollowUp = (queryToSend) => {
    const text = (queryToSend || followUpQuery).trim()
    if (!text || isGenerating) return

    const currentEngine = latestReading?.engine || pendingEngine || "jyotish"

    if (currentEngine === "jyotish") {
      if (activeQuestionQuota <= 0) {
        toast.error("Your question balance is empty. Top up to consult Jyotish.")
        if (onOpenBuyModal) {
          onOpenBuyModal({ promoCode: "QUICKGOLD", packId: "pack_gold_12" })
        }
        return
      }
    }

    setInFlightQuery(text)
    setFollowUpQuery("")

    const initialStep =
      currentEngine === "jyotish"
        ? "Reviewing your core birth profile and selecting chart tools..."
        : "Searching Brihat Parashara Hora Shastra & classical treatises..."

    dispatch(
      startGenerating({
        step: initialStep,
        query: text,
        engine: currentEngine,
      })
    )

    // Call real backend SSE streaming endpoint
    streamChatTurn({
      engine: currentEngine,
      query: text,
      threadId: currentThreadId || latestReading?.threadId,
      chartId: birthDetails?.chartId,
      onThinking: (step) => {
        dispatch(setThinkingStep(step))
      },
      onDone: (data) => {
        setInFlightQuery("")
        if (data?.reading) {
          dispatch(
            addConversation({
              ...data.reading,
              creditsRemaining: data.creditsRemaining,
            })
          )
        }
      },
      onError: (err) => {
        setInFlightQuery("")
        toast.error(err.message || "Failed to consult astrology engine. Please try again.")
        dispatch(stopGenerating())
        if (err.status === 402 || err.code === "CREDITS_EXHAUSTED") {
          if (typeof onOpenBuyModal === "function") {
            onOpenBuyModal({
              promoCode: err.offer?.promoCode,
              packId: err.offer?.packId || "pack_gold_12",
            })
          }
        }
      },
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendFollowUp()
    }
  }

  const handleFeedback = (readingId, feedbackType) => {
    if (readingId) {
      dispatch(updateConversationFeedback({ id: readingId, feedback: feedbackType }))
      dispatch(submitMessageFeedback({ messageId: readingId, feedback: feedbackType }))
    }
  }

  // If there are no readings in this thread and nothing in progress, return null so home page shows hero input
  if (displayReadings.length === 0 && !isGenerating && !inFlightQuery && !pendingQuestion) {
    return null
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-4 sm:px-8 lg:px-10">
      {/* Monospace Breadcrumb Header */}
      <div className="text-muted-foreground relative z-10 flex flex-none items-center justify-between pt-3 pb-2.5 sm:pt-4 sm:pb-3 border-b border-border/60 font-mono text-[9px] sm:text-[10px] tracking-[0.22em] uppercase">
        <div className="flex items-center gap-1.5">
          <span>Japaika</span>
          <span>/</span>
          <span className={isJyotish ? "text-primary font-semibold" : "text-amber-500 font-semibold"}>
            {isJyotish ? "Ask Jyotish" : "Ask Shastra"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => dispatch(clearActiveConversation())}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/70 bg-card/60 hover:bg-card text-[9.5px] font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs backdrop-blur-sm"
        >
          <Plus className="w-3 h-3 text-primary" />
          <span>New Reading</span>
        </button>
      </div>

      {/* Main Conversation Container (Scrollable message area) */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center w-full">
        <div
          ref={scrollAreaRef}
          className="flex w-full max-w-[900px] flex-1 flex-col gap-[30px] overflow-x-hidden overflow-y-auto pr-1 pt-4 sm:pt-6 pb-6 mlh-thin-scroll"
        >
          {/* Render All Completed Turns for this Thread */}
          {displayReadings.map((reading, rIdx) => {
            const isLastReading = rIdx === displayReadings.length - 1
            const readingIsJyotish = (reading.engine || "jyotish") === "jyotish"
            const isExpanded = Boolean(expandedAstrologyMap[reading.id || rIdx])

            return (
              <div
                key={reading.id || rIdx}
                ref={isLastReading ? latestTurnRef : null}
                className="flex flex-col gap-[24px]"
              >
                {/* User Question Speech Bubble (Aligned to the Right) */}
                {reading.question && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex max-w-[700px] flex-col items-end self-end">
                    <span className="text-muted-foreground/60 mb-1.5 font-mono text-[9.5px] tracking-[0.2em] uppercase">
                      You
                    </span>
                    <div
                      className={`rounded-[20px_20px_4px_20px] border px-5 py-3.5 font-sans text-[15.5px] sm:text-[17px] leading-[1.4] text-pretty shadow-md backdrop-blur-xl ${readingIsJyotish
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-amber-500/30 bg-amber-500/10 text-foreground"
                        }`}
                    >
                      {reading.question}
                    </div>
                  </div>
                )}

                {/* Engine Reading Bubble (Glass Card) */}
                <div
                  className={`animate-in fade-in slide-in-from-bottom-3 duration-400 w-full rounded-3xl glass-card border p-5 sm:p-7 shadow-xl backdrop-blur-2xl transition-all ${readingIsJyotish ? "border-primary/25" : "border-amber-500/25"
                    }`}
                >
                  {/* Engine Header */}
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/50 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`relative grid h-7 w-7 flex-none place-items-center rounded-xl border shadow-xs ${readingIsJyotish
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                          }`}
                      >
                        {readingIsJyotish ? (
                          <SunMedium className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span
                        className={`font-mono text-[9.5px] tracking-[0.2em] uppercase sm:text-[10px] font-semibold ${readingIsJyotish ? "text-primary" : "text-amber-500"
                          }`}
                      >
                        {readingIsJyotish
                          ? "Jyotish · reading from your birth chart"
                          : "Shastra · Universal Vedic Encyclopedia"}
                      </span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="min-w-0 flex-1">
                    {/* Consulted Vedic Tools Badges */}
                    {reading.thinkingSteps && reading.thinkingSteps.length > 0 && (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          Tools Consulted:
                        </span>
                        {reading.thinkingSteps.map((toolBadge, tbIdx) => (
                          <span
                            key={tbIdx}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide shadow-xs ${readingIsJyotish
                              ? "border-primary/25 bg-card/80 text-foreground/85"
                              : "border-amber-500/25 bg-card/80 text-foreground/85"
                              }`}
                          >
                            <span className="text-emerald-500 text-[9px]">✦</span>
                            <span>{toolBadge}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Opening Thought Note */}
                    {reading.openingThought && (
                      <p className="mb-4 text-foreground/90 font-serif italic text-[17px] leading-[1.6] sm:text-[19px]">
                        {reading.openingThought}
                      </p>
                    )}

                    {/* Reading Paragraphs */}
                    <div className="text-foreground/90 font-sans text-[16px] leading-[1.65] text-pretty sm:text-[18px]">
                      {reading.paragraphs?.map((p, idx) => (
                        <div key={idx} className="mb-4 last:mb-0">
                          {renderParagraph(p, readingIsJyotish)}
                        </div>
                      ))}
                    </div>

                    {/* Promotional Offer Banner (shown on latest reading) */}
                    {readingIsJyotish && isLastReading && (reading.offer || activeQuestionQuota <= 0) && (
                      <div className="border-amber-500/30 bg-amber-500/10 relative mt-5 overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg backdrop-blur-md">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <div className="text-amber-600 dark:text-amber-300 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.22em] uppercase font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Special Offer
                          </div>
                          <span className="border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200 rounded-md px-2 py-[2px] font-mono text-[9.5px] tracking-[0.14em] whitespace-nowrap uppercase font-semibold">
                            {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : "Offer ended"}
                          </span>
                        </div>

                        <h3 className="text-foreground mt-2 font-serif text-[20px] leading-[1.2] sm:text-[22px] font-bold">
                          {reading.offer?.title || "Special Offer: 12 Questions Pack"}
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-[62ch] text-[13px] leading-snug sm:text-[13.5px]">
                          {reading.offer?.description ||
                            "Your question balance is ZERO. Top up with Gold Pack using promo code: QUICKGOLD"}
                        </p>

                        <div className="border-amber-500/20 mt-3.5 border-t pt-3">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-muted-foreground font-mono text-[9px] tracking-[0.16em] uppercase">
                                Code {reading.offer?.promoCode || "QUICKGOLD"}
                              </span>
                              {reading.offer?.discountedPrice && (
                                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  {reading.offer.discountedPrice}
                                  {reading.offer?.originalPrice && (
                                    <span className="text-[10px] text-muted-foreground line-through ml-1.5 font-normal">
                                      {reading.offer.originalPrice}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenBuyModal &&
                                onOpenBuyModal({
                                  promoCode: reading.offer?.promoCode || "QUICKGOLD",
                                  packId: reading.offer?.packId || "pack_gold_12",
                                })
                              }
                              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shrink-0 px-5 py-2 text-[13px] font-semibold shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* The Astrology Behind This (Collapsible Citations Drawer) */}
                    {reading.astrologyBehind && reading.astrologyBehind.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/50">
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpandedAstrology(reading.id || rIdx)}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2 font-sans text-[14px] sm:text-[15px] font-medium transition-all shadow-xs ${readingIsJyotish
                              ? "border-primary/25 bg-accent/40 text-foreground hover:bg-accent hover:border-primary/50"
                              : "border-amber-500/25 bg-accent/40 text-foreground hover:bg-accent hover:border-amber-500/50"
                              }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`text-[12px] leading-none ${readingIsJyotish ? "text-primary" : "text-amber-500"
                                }`}
                            >
                              ✦
                            </span>
                            <span>
                              {readingIsJyotish ? "The astrology behind this" : "Classical references & citations"}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground ${isExpanded ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                        </div>

                        {isExpanded && (
                          <div
                            className="mt-3.5 overflow-hidden rounded-2xl border border-border/80 bg-accent/30 p-4 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
                          >
                            <div
                              className={`font-mono text-[9.5px] tracking-[0.22em] uppercase font-semibold ${readingIsJyotish ? "text-primary" : "text-amber-500"
                                }`}
                            >
                              {readingIsJyotish ? "What I read from your chart" : "Citations & Classical Treatises"}
                            </div>
                            <div className="mt-3 space-y-2 font-sans text-[14px] sm:text-[15px] leading-relaxed text-foreground/85">
                              {reading.astrologyBehind.map((item, aIdx) => {
                                const match = item.match(/^(\d+\)\s*[^:]+:)(.*)$/)
                                if (match) {
                                  return (
                                    <div key={aIdx} className="flex items-start gap-2">
                                      <span className={`font-semibold shrink-0 ${readingIsJyotish ? "text-primary" : "text-amber-600 dark:text-amber-400"}`}>
                                        {match[1]}
                                      </span>
                                      <span className="text-foreground/80">{match[2]}</span>
                                    </div>
                                  )
                                }
                                return (
                                  <div key={aIdx} className="text-foreground/80">
                                    {item}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback Buttons */}
                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-[9px] tracking-[0.2em] uppercase">
                          Was this useful?
                        </span>
                        <button
                          type="button"
                          aria-label="Yes"
                          onClick={() => handleFeedback(reading.id, "yes")}
                          className={`grid h-7 w-7 cursor-pointer place-items-center rounded-lg border transition-all ${reading.feedback === "yes"
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "border-border/80 bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="No"
                          onClick={() => handleFeedback(reading.id, "no")}
                          className={`grid h-7 w-7 cursor-pointer place-items-center rounded-lg border transition-all ${reading.feedback === "no"
                            ? "border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "border-border/80 bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Suggested Questions Grid (shown on latest reading) */}
                    {isLastReading && reading.suggestedQuestions && reading.suggestedQuestions.length > 0 && (
                      <div
                        className="mt-5 border-t border-border/50 pt-4"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`font-mono text-[9.5px] tracking-[0.22em] uppercase font-semibold ${readingIsJyotish ? "text-primary" : "text-amber-500"
                              }`}
                          >
                            {readingIsJyotish ? "Suggested Follow-ups & Questions" : "Keep exploring"}
                          </div>
                          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider hidden sm:inline">
                            Click to ask instantly
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                          {reading.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => handleSendFollowUp(q)}
                              className={`group flex cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left font-sans text-[14px] sm:text-[15px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${readingIsJyotish
                                ? "border-border/80 bg-accent/40 hover:bg-accent hover:border-primary/50 text-foreground/85 hover:text-foreground"
                                : "border-border/80 bg-accent/40 hover:bg-accent hover:border-amber-500/50 text-foreground/85 hover:text-foreground"
                                }`}
                            >
                              <span className="flex-1 line-clamp-2">{q}</span>
                              <span
                                aria-hidden="true"
                                className="ml-auto pl-1 font-mono text-[11px] transition-transform duration-200 group-hover:translate-x-0.5 text-primary"
                              >
                                →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Active Generating Turn (if isGenerating) */}
          {isGenerating && (
            <div ref={generatingTurnRef} className="flex flex-col gap-[24px] w-full max-w-[860px]">
              {(inFlightQuery || pendingQuestion) && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex max-w-[700px] flex-col items-end self-end">
                  <span className="text-muted-foreground/60 mb-1.5 font-mono text-[9.5px] tracking-[0.2em] uppercase">
                    You
                  </span>
                  <div
                    className={`rounded-[20px_20px_4px_20px] border px-5 py-3.5 font-sans text-[15.5px] sm:text-[17px] leading-[1.4] text-pretty shadow-md backdrop-blur-xl ${isJyotish
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-amber-500/30 bg-amber-500/10 text-foreground"
                      }`}
                  >
                    {inFlightQuery || pendingQuestion}
                  </div>
                </div>
              )}

              <div
                className={`animate-in fade-in slide-in-from-bottom-3 duration-400 w-full rounded-3xl glass-card border p-5 sm:p-7 shadow-xl backdrop-blur-2xl ${isJyotish ? "border-primary/25" : "border-amber-500/25"
                  }`}
              >
                <div className="mb-4 flex items-center gap-2.5 border-b border-border/50 pb-3.5">
                  <span
                    aria-hidden="true"
                    className={`relative grid h-7 w-7 flex-none place-items-center rounded-xl border shadow-xs ${isJyotish
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      }`}
                  >
                    {isJyotish ? (
                      <SunMedium className="w-3.5 h-3.5" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span
                    className={`font-mono text-[9.5px] tracking-[0.2em] uppercase sm:text-[10px] font-semibold ${isJyotish ? "text-primary" : "text-amber-500"
                      }`}
                  >
                    {isJyotish
                      ? "Jyotish · reading from your birth chart"
                      : "Shastra · Universal Vedic Encyclopedia"}
                  </span>
                </div>

                <div className="min-w-0 flex-1 py-2 space-y-3">
                  <div className="flex flex-col gap-2">
                    {thinkingSteps && thinkingSteps.length > 0 ? (
                      thinkingSteps.map((step, sIdx) => {
                        const isLatest = sIdx === thinkingSteps.length - 1
                        return (
                          <div
                            key={sIdx}
                            className={`flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-xs sm:text-[12.5px] tracking-wide transition-all shadow-xs ${isLatest
                              ? isJyotish
                                ? "border border-primary/50 bg-primary/15 text-primary animate-pulse"
                                : "border border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse"
                              : "border border-border/60 bg-accent/40 text-muted-foreground"
                              }`}
                          >
                            {isLatest ? (
                              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                            ) : (
                              <span className="text-emerald-500 text-[11px] font-bold shrink-0">✓</span>
                            )}
                            <span className="truncate">{step}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div
                        className={`flex items-center gap-2.5 font-mono text-xs sm:text-[13px] tracking-wide animate-pulse ${isJyotish ? "text-primary" : "text-amber-600 dark:text-amber-400"
                          }`}
                      >
                        <Sparkles className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                        <span>
                          {thinkingStep ||
                            (isJyotish
                              ? "Reading your birth chart..."
                              : "Consulting classical Vedic texts...")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Bottom Follow-Up Composer */}
        <div className="w-full max-w-[860px] flex-none pt-3 pb-4 sm:pb-5">
          <div>
            <div
              className={`relative overflow-hidden rounded-3xl border glass-card transition-all duration-300 shadow-xl backdrop-blur-2xl ${isJyotish
                ? "border-border/80 focus-within:border-primary/60 focus-within:shadow-2xl focus-within:shadow-primary/10"
                : "border-border/80 focus-within:border-amber-500/60 focus-within:shadow-2xl focus-within:shadow-amber-500/10"
                }`}
            >
              <div className="relative flex gap-3 px-4 pt-4 sm:px-5 sm:pt-4">
                <span
                  aria-hidden="true"
                  className={`shrink-0 pt-1 text-[16px] leading-none ${isJyotish ? "text-primary animate-pulse" : "text-amber-500 animate-pulse"
                    }`}
                >
                  {isJyotish ? (
                    <SunMedium className="size-5 shrink-0 stroke-[2]" />
                  ) : (
                    <BookOpen className="size-5 shrink-0 stroke-[2]" />
                  )}
                </span>
                <textarea
                  rows={2}
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isJyotish
                      ? "Ask a follow-up: a date you are weighing, a decision, a what-if…"
                      : "Search another topic: a term, a yoga, a doṣa…"
                  }
                  className="text-foreground placeholder:text-muted-foreground min-h-[56px] min-w-0 flex-1 resize-none bg-transparent font-sans text-[15px] sm:text-[17px] leading-[1.5] outline-none disabled:cursor-not-allowed disabled:opacity-60 caret-primary"
                  style={{ height: "56px" }}
                />
              </div>

              <div className="relative flex flex-wrap items-center justify-between gap-3 px-3 pt-2 pb-3 sm:gap-3.5 sm:px-4 sm:pt-2 sm:pb-3.5">
                <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
                  {isJyotish && (
                    <div className="flex items-stretch overflow-hidden rounded-full border border-amber-500/40 bg-amber-500/10 font-mono text-[10.5px] font-medium tracking-[0.14em] whitespace-nowrap uppercase text-amber-600 dark:text-amber-300 shadow-xs">
                      <span className="px-3 py-1.5">
                        <span>{activeQuestionQuota}</span> {activeQuestionQuota === 1 ? "question" : "questions"} left
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenBuyModal &&
                          onOpenBuyModal({ promoCode: "QUICKGOLD", packId: "pack_gold_12" })
                        }
                        className="cursor-pointer border-l border-amber-500/30 px-3 py-1.5 transition-colors bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-200 font-semibold"
                      >
                        Buy more
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!followUpQuery.trim() || isGenerating}
                    onClick={() => handleSendFollowUp()}
                    aria-label="Send question"
                    className={`grid h-10 w-10 flex-none place-items-center rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 shadow-md ${isJyotish
                      ? "text-primary-foreground bg-primary hover:bg-primary/90 hover:scale-105 shadow-primary/25"
                      : "text-white bg-amber-500 hover:bg-amber-600 hover:scale-105 shadow-amber-500/25"
                      }`}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground/60 mt-2 text-center font-mono text-[9px] tracking-[0.18em] uppercase">
              Enter to send · Shift + Enter for a new line
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
