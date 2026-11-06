import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  Menu,
  X,
  Orbit,
  Newspaper,
  Calculator,
  FileText,
  Compass,
  Flame,
  ShoppingBag,
  BookOpen,
  SunMedium,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { openAuthModal } from "@/features/auth"
import UserProfileMenu from "@/features/user/components/UserProfileMenu"
import { setActiveConversation, setActiveThreadId, deleteConversation, clearActiveConversation } from "@/features/jyotish"
import { fetchUserThreads, fetchThreadById, deleteThread } from "@/features/jyotish/jyotishApi"
import { isToday, isYesterday, differenceInCalendarDays, format } from "date-fns"

const mobileNavLinks = [
  { label: "Horoscopes", path: "/horoscope", icon: Orbit },
  { label: "Blogs", path: "/blogs", icon: Newspaper },
  { label: "Doshas", path: "/doshas", icon: Flame },
  { label: "Calculators", path: "/calculators", icon: Calculator },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
]

function getTimelineBucket(dateInput) {
  if (!dateInput) return "TODAY"
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return "TODAY"

  if (isToday(date)) return "TODAY"
  if (isYesterday(date)) return "YESTERDAY"

  const diff = differenceInCalendarDays(new Date(), date)
  if (diff <= 7) return "PREVIOUS 7 DAYS"
  if (diff <= 30) return "PREVIOUS 30 DAYS"
  return format(date, "MMMM yyyy").toUpperCase()
}

export default function MobileHeader({
  onOpenBindModal,
  onOpenBirthDetailsModal,
  onOpenBuyQuestionsModal,
  onOpenBuyReportsModal,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("ALL")
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { isAuthenticated, user, birthDetails } = useSelector((state) => state.auth || {})
  const { conversations = [], serverThreads = [], activeConversationId, activeThreadId } =
    useSelector((state) => state.jyotish || {})

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserThreads())
    }
  }, [dispatch, isAuthenticated])

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 w-full h-14 bg-card/80 backdrop-blur-xl border-b border-border px-4 flex items-center justify-between transition-colors shadow-xs">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="text-foreground hover:bg-accent/70 w-11 h-11 rounded-xl cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu className="size-7 stroke-[2]" />
        </Button>

        <Link
          to="/"
          onClick={() => dispatch(clearActiveConversation())}
          className="flex items-center gap-2 group"
        >
          <img
            src="/japaikaLogo.svg"
            alt=""
            className="w-8 h-8 object-contain shrink-0"
          />
          <img
            src="/japaikaName.svg"
            alt="Japaika"
            className="h-5.5 w-auto object-contain select-none"
          />
        </Link>

        {isAuthenticated ? (
          <UserProfileMenu
            triggerVariant="avatarOnly"
            side="bottom"
            align="end"
            sideOffset={8}
            onOpenBirthDetailsModal={onOpenBirthDetailsModal}
            onOpenBuyQuestionsModal={onOpenBuyQuestionsModal}
            onOpenBuyReportsModal={onOpenBuyReportsModal}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenBindModal(true)}
            className="text-xs font-semibold text-primary hover:text-foreground px-3 h-8 rounded-lg cursor-pointer hover:bg-accent/60"
          >
            Log in
          </Button>
        )}
      </header>

      {/* Mobile Slide-over Drawer with true glassmorphism */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-[310px] max-w-[86%] bg-card/95 backdrop-blur-2xl border-r border-border p-4 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-0.5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <Link
                  to="/"
                  onClick={() => {
                    setIsOpen(false)
                    dispatch(clearActiveConversation())
                  }}
                  className="flex items-center gap-2.5 group"
                >
                  <img
                    src="/japaikaLogo.svg"
                    alt=""
                    className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <img
                    src="/japaikaName.svg"
                    alt="Japaika"
                    className="h-6 w-auto object-contain select-none"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                >
                  <X className="w-6 h-6 stroke-[1.8]" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1 pt-1">
                <Link
                  to="/kundli"
                  onClick={(e) => {
                    setIsOpen(false)
                    if (!isAuthenticated) {
                      e.preventDefault()
                      if (typeof onOpenBindModal === "function") {
                        onOpenBindModal()
                      } else {
                        dispatch(openAuthModal())
                      }
                      return
                    }
                    if (user?.onboardingCompleted === false || (!birthDetails && !user?.hasBirthDetails)) {
                      e.preventDefault()
                      navigate("/onboarding")
                    }
                  }}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[17px] font-semibold text-foreground/85 hover:text-foreground hover:bg-accent/70 transition-colors"
                >
                  <Compass className="size-6 shrink-0 stroke-[1.8] text-amber-500" />
                  <span>My Janam Kundli</span>
                </Link>

                {mobileNavLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[17px] font-semibold text-foreground/85 hover:text-foreground hover:bg-accent/70 transition-colors"
                  >
                    <item.icon className="size-6 shrink-0 stroke-[1.8]" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Recent Readings Filter & History (matching desktop sidebar) */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center gap-1 text-[11px] font-mono bg-accent/40 p-1 rounded-xl border border-border/70">
                  {["ALL", "JYOTISH", "SHASTRA"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center text-xs ${
                        activeFilter === filter
                          ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {(() => {
                  const threadMap = new Map()

                  // 1. Add server threads as baseline
                  serverThreads.forEach((th) => {
                    threadMap.set(th.id, {
                      id: th.id,
                      threadId: th.id,
                      question: th.title,
                      engine: th.engine,
                      createdAt: th.lastMessageAt || th.createdAt,
                      isServerThread: true,
                    })
                  })

                  // 2. Add or update with local conversations
                  conversations.forEach((c) => {
                    const key = c.threadId || c.id
                    if (threadMap.has(key)) {
                      const existing = threadMap.get(key)
                      const timeC = new Date(c.createdAt || 0).getTime()
                      const timeExisting = new Date(existing.createdAt || 0).getTime()
                      if (timeC > timeExisting) {
                        threadMap.set(key, {
                          ...existing,
                          question: existing.question || c.question,
                          createdAt: c.createdAt,
                        })
                      }
                    } else {
                      threadMap.set(key, {
                        id: c.id,
                        threadId: c.threadId || c.id,
                        question: c.question || "Untitled Reading",
                        engine: c.engine || "jyotish",
                        createdAt: c.createdAt,
                        isServerThread: Boolean(c.threadId),
                      })
                    }
                  })

                  const allReadings = Array.from(threadMap.values())

                  const filtered = allReadings.filter((item) => {
                    if (activeFilter === "JYOTISH") return item.engine === "jyotish"
                    if (activeFilter === "SHASTRA") return item.engine === "shastra"
                    return true
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="py-6 px-1 text-xs text-muted-foreground font-sans">
                        Your readings will appear here.
                      </div>
                    )
                  }

                  // Sort chronologically newest first
                  filtered.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime()
                    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime()
                    return timeB - timeA
                  })

                  // Group readings into timeline buckets
                  const timelineGroups = []
                  const groupMap = new Map()

                  filtered.forEach((item) => {
                    const bucket = getTimelineBucket(item.createdAt || item.timestamp)
                    if (!groupMap.has(bucket)) {
                      groupMap.set(bucket, [])
                      timelineGroups.push(bucket)
                    }
                    groupMap.get(bucket).push(item)
                  })

                  const handleItemClick = (item) => {
                    const targetId = item.id
                    const targetThreadId = item.threadId || item.id

                    dispatch(setActiveConversation(targetId))
                    dispatch(setActiveThreadId(targetThreadId))

                    if (item.isServerThread || targetThreadId) {
                      dispatch(fetchThreadById(targetThreadId))
                    }
                    if (location.pathname !== "/") {
                      navigate(`/?engine=${item.engine || "jyotish"}`)
                    }
                    setIsOpen(false)
                  }

                  const handleDeleteItem = (e, item) => {
                    e.stopPropagation()
                    if (item.isServerThread) {
                      dispatch(deleteThread(item.id))
                    }
                    dispatch(deleteConversation(item.id))
                  }

                  return (
                    <div className="space-y-3 pt-1 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                      {timelineGroups.map((groupKey) => {
                        const items = groupMap.get(groupKey) || []
                        return (
                          <div key={groupKey} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground px-1.5 pt-1.5 pb-0.5 tracking-wider uppercase select-none">
                              <span>{groupKey}</span>
                              <span className="text-[9px] text-muted-foreground/60 font-sans">{items.length}</span>
                            </div>
                            <div className="space-y-1">
                              {items.map((item) => {
                                const isSelected =
                                  activeConversationId === item.id ||
                                  activeConversationId === item.threadId ||
                                  (activeThreadId && (activeThreadId === item.id || activeThreadId === item.threadId))

                                return (
                                  <div
                                    key={item.id}
                                    className="relative group/reading flex items-center"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleItemClick(item)}
                                      className={`w-full text-left p-2.5 rounded-xl text-[13.5px] font-sans transition-all cursor-pointer flex items-start gap-2.5 pr-8 ${
                                        isSelected
                                          ? item.engine === "shastra"
                                            ? "bg-amber-500/15 text-foreground border border-amber-500/40 shadow-xs"
                                            : "bg-primary/10 text-foreground border border-primary/30 shadow-xs"
                                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent"
                                      }`}
                                    >
                                      <span className="flex-none pt-0.5">
                                        {item.engine === "shastra" ? (
                                          <BookOpen className="w-4 h-4 text-amber-500" />
                                        ) : (
                                          <SunMedium className="w-4 h-4 text-primary" />
                                        )}
                                      </span>
                                      <span className="line-clamp-2 leading-snug flex-1">
                                        {item.question || item.title || "Untitled Reading"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteItem(e, item)}
                                      title="Delete reading"
                                      className="absolute right-1.5 top-2.5 opacity-70 hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
