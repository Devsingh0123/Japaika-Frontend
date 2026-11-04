import { useEffect, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  BookOpen,
  Orbit,
  Newspaper,
  Calculator,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  Compass,
  Trash2,
  Flame,
  ShoppingBag,
  SunMedium,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { openAuthModal } from "@/features/auth"
import { setActiveConversation, setActiveThreadId, deleteConversation } from "@/features/jyotish"
import { fetchUserThreads, fetchThreadById, deleteThread } from "@/features/jyotish/jyotishApi"
import UserProfileMenu from "@/features/user/components/UserProfileMenu"
import { isToday, isYesterday, differenceInCalendarDays, format } from "date-fns"

const navItems = [
  { label: "My Kundli", path: "/kundli", icon: Compass },
  { label: "Horoscopes", path: "/horoscope", icon: Orbit },
  { label: "Blogs", path: "/blogs", icon: Newspaper },
  { label: "Dosha", path: "/dosha", icon: Flame },
  { label: "Calculators", path: "/calculators", icon: Calculator },
  { label: "Reports", path: "/reports", icon: FileText },
  // { label: "Shop", path: "/shop", icon: ShoppingBag },
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

export default function Sidebar({
  onOpenBindModal,
  onOpenBirthDetailsModal,
  onOpenBuyQuestionsModal,
  onOpenBuyReportsModal,
  isCollapsed,
  onToggleCollapse,
}) {
  const [activeFilter, setActiveFilter] = useState("ALL")
  const dispatch = useDispatch()
  const { isAuthenticated, user, birthDetails } = useSelector((state) => state.auth || {})
  const { conversations = [], serverThreads = [], activeConversationId, activeThreadId } =
    useSelector((state) => state.jyotish || {})
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserThreads())
    }
  }, [dispatch, isAuthenticated])

  return (
    <aside
      className={`h-screen sticky top-0 bg-card/85 backdrop-blur-2xl border-r border-border flex flex-col justify-between transition-all duration-300 z-40 shrink-0 ${isCollapsed ? "w-[72px]" : "w-[260px] lg:w-[280px]"
        }`}
    >
      {/* Top Header & Navigation Rail */}
      <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-3 space-y-4">
        {/* Brand & Collapse Header */}
        {isCollapsed ? (
          <div className="flex items-center justify-center pb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label="Expand navigation"
              title="Expand navigation"
              className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
            >
              <PanelLeftOpen className="size-6 stroke-[1.8]" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1 px-1">
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 group"
              title="Japaika"
            >
              <img
                src="/japaikaLogo.svg"
                alt=""
                className="w-10 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <img
                src="/japaikaName.svg"
                alt="Japaika"
                className="h-7 w-auto object-contain select-none"
              />
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label="Collapse navigation"
              title="Collapse navigation"
              className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 cursor-pointer"
            >
              <PanelLeftClose className="size-6 stroke-[1.8]" />
            </Button>
          </div>
        )}

        {/* Secondary Navigation List */}
        <nav className="space-y-1.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const handleItemClick = (e) => {
              if (item.path === "/kundli") {
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
                  return
                }
              }
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl text-base font-medium transition-all duration-150 ${isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5"
                  } ${isActive
                    ? "text-primary dark:text-foreground bg-primary/10 dark:bg-card border border-primary/25 dark:border-border font-semibold shadow-xs"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent/70"
                  }`
                }
              >
                <Icon className="size-6 shrink-0 stroke-[1.8]" />
                {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Recent Readings Filter & History */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-1 text-[11px] font-mono bg-accent/40 p-1 rounded-xl border border-border/70">
              {["ALL", "JYOTISH", "SHASTRA"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${activeFilter === filter
                    ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {(() => {
              // Deduplicate readings and threads so each thread appears once in the sidebar
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

              // Group readings into timeline buckets preserving chronological order
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
              }

              const handleDeleteItem = (e, item) => {
                e.stopPropagation()
                if (item.isServerThread) {
                  dispatch(deleteThread(item.id))
                }
                dispatch(deleteConversation(item.id))
              }

              return (
                <div className="space-y-3 pt-1 max-h-[320px] overflow-y-auto no-scrollbar pr-0.5">
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
                                  className={`w-full text-left p-2.5 rounded-xl text-[13px] font-sans transition-all cursor-pointer flex items-start gap-2.5 pr-7 ${isSelected
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
                                  className="absolute right-1.5 top-2.5 opacity-0 group-hover/reading:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent cursor-pointer"
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
        )}
      </div>

      {/* Sticky Bottom Log In / User Profile Popover */}
      <div className="p-3 border-t border-border bg-card/90 backdrop-blur-md">
        {isAuthenticated ? (
          <UserProfileMenu
            isCollapsed={isCollapsed}
            onOpenBirthDetailsModal={onOpenBirthDetailsModal}
            onOpenBuyQuestionsModal={onOpenBuyQuestionsModal}
            onOpenBuyReportsModal={onOpenBuyReportsModal}
          />
        ) : (
          <button
            onClick={() => {
              dispatch(openAuthModal())
              if (typeof onOpenBindModal === "function") onOpenBindModal()
            }}
            className={`w-full flex items-center gap-3 rounded-2xl p-2.5 hover:bg-accent border border-border/60 hover:border-primary/40 bg-card/60 transition-all group cursor-pointer text-left shadow-xs ${isCollapsed ? "justify-center" : ""
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
              <LogIn className="size-6" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Log in
                </div>
                <div className="text-[10px] font-mono text-primary font-medium tracking-wider">
                  BIND YOUR CHART
                </div>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
