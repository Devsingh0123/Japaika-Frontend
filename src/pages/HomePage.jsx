import { useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import { useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import HeroChatInput from "@/components/sections/HeroChatInput"
import JyotishChatConversation from "@/features/jyotish/components/JyotishChatConversation"

export default function HomePage() {
  const context = useOutletContext() || {}
  const onOpenBindModal = context.onOpenBindModal || (() => {})
  const onOpenBuyModal = context.onOpenBuyModal || (() => {})
  const { activeConversationId, activeThreadId, isGenerating } = useSelector((state) => state.jyotish || {})

  const hasActiveConversation = Boolean(activeConversationId || activeThreadId || isGenerating)

  // When switching to active chat conversation, ensure main container and window are at top
  useEffect(() => {
    if (hasActiveConversation) {
      window.scrollTo({ top: 0, behavior: "instant" })
      const mainEl = document.querySelector("main")
      if (mainEl) {
        mainEl.scrollTop = 0
      }
    }
  }, [hasActiveConversation])

  return (
    <div
      className={`relative w-full flex flex-col ${
        hasActiveConversation ? "h-full min-h-0 overflow-hidden flex-1" : "min-h-full"
      }`}
    >
      <AnimatePresence mode="wait">
        {hasActiveConversation ? (
          <motion.div
            key="chat-conversation-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden"
          >
            <JyotishChatConversation onOpenBuyModal={onOpenBuyModal} />
          </motion.div>
        ) : (
          <motion.div
            key="landing-hero-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full flex flex-col"
          >
            {/* Hero Section with Cosmic Wheel & Input - Full viewport height */}
            <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 py-10 sm:py-16 w-full min-h-[calc(100dvh-3.5rem)] md:min-h-screen overflow-hidden">
              {/* Ethereal Celestial Mandala Watermark behind Hero */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] w-[380px] h-[380px] sm:w-[580px] sm:h-[580px] select-none z-0 flex items-center justify-center [mask-image:radial-gradient(circle_at_center,black_35%,transparent_75%)]"
              >
                {/* Breathing Ambient Aura Glow */}
                <div className="absolute inset-0 rounded-full bg-amber-500/[0.04] dark:bg-primary/[0.08] blur-3xl animate-pulse" />
                <img
                  src="/japaikaLogo.svg"
                  alt=""
                  className="w-full h-full object-contain opacity-[0.12] dark:opacity-[0.07] mix-blend-multiply dark:mix-blend-normal filter dark:drop-shadow-[0_0_50px_rgba(56,189,248,0.25)]"
                />
              </div>

              {/* Hero Form & 4 Example Cards */}
              <HeroChatInput
                onOpenBindModal={onOpenBindModal}
                onOpenBuyModal={onOpenBuyModal}
              />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


