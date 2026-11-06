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
            <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 py-10 sm:py-16 w-full min-h-[calc(100dvh-3.5rem)] md:min-h-screen">

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


