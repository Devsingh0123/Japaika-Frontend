import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiClient, getStoredAccessToken } from "@/lib/api-client"
import { toast } from "sonner"

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"

/**
 * Helper to get the current auth access token from localStorage.
 */
const getAuthToken = () => {
  return getStoredAccessToken() || ""
}

/**
 * Server-Sent Events (SSE) Streaming Client for Jyotish & Shastra
 * Connects directly to POST /api/v1/chat/{jyotish|shastra} with live thinking steps and reading delivery.
 */
export async function streamChatTurn({
  engine = "jyotish",
  query,
  threadId,
  chartId,
  onThinking,
  onToken,
  onMetadata,
  onDone,
  onError,
}) {
  const token = getAuthToken()
  const endpoint = `${BASE_URL}/chat/${engine}`

  const headers = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const payload = {
    query: query.trim(),
    threadId: threadId || undefined,
    chartId: chartId || undefined,
    stream: true,
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errMessage = `Chat request failed with status ${response.status}`
      let errData = null
      try {
        const errJson = await response.json()
        if (errJson?.message) errMessage = errJson.message
        if (errJson?.data) errData = errJson.data
      } catch {
        // use default message
      }
      const err = new Error(errMessage)
      err.status = response.status
      if (errData) {
        err.code = errData.code
        err.offer = errData.offer
      }
      throw err
    }

    // Handle Server-Sent Events reader
    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      // keep the last incomplete chunk in buffer
      buffer = lines.pop() || ""

      for (const block of lines) {
        if (!block.trim()) continue
        const eventMatch = block.match(/^event:\s*(\w+)/m)
        const dataMatch = block.match(/^data:\s*(.+)$/m)

        if (eventMatch && dataMatch) {
          const eventName = eventMatch[1]
          let eventData = null
          try {
            eventData = JSON.parse(dataMatch[1])
          } catch (e) {
            console.warn("Failed to parse SSE data block:", dataMatch[1], e)
            continue
          }

          if (eventName === "thinking" && onThinking) {
            onThinking(eventData.step || eventData.message || "")
          } else if (eventName === "token" && onToken) {
            onToken(eventData.text || "")
          } else if (eventName === "metadata" && onMetadata) {
            onMetadata(eventData)
          } else if (eventName === "done" && onDone) {
            onDone(eventData)
          } else if (eventName === "error") {
            const err = new Error(eventData.message || "Streaming error from chat engine")
            if (onError) onError(err)
            return
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error)
    } else {
      throw error
    }
  }
}

/**
 * Async Thunk: Fetch User Chat Threads from backend
 * Endpoint: GET /api/v1/chat/threads?engine=...
 */
export const fetchUserThreads = createAsyncThunk(
  "jyotish/fetchUserThreads",
  async ({ engine } = {}, { rejectWithValue }) => {
    try {
      const params = engine ? { engine } : {}
      const response = await apiClient.get("/chat/threads", { params })
      if (response.data && response.data.success) {
        return response.data.threads || []
      }
      return []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load chat history."
      )
    }
  }
)

/**
 * Async Thunk: Fetch full thread details and readings by ID
 * Endpoint: GET /api/v1/chat/threads/:threadId
 */
export const fetchThreadById = createAsyncThunk(
  "jyotish/fetchThreadById",
  async (threadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/chat/threads/${threadId}`)
      if (response.data && response.data.success) {
        // Backend returns: { success: true, data: { thread, messages, readings } }
        const payload = response.data.data || response.data || {}
        const thread = payload.thread || null
        let readings = Array.isArray(payload.readings) ? [...payload.readings] : []
        const messages = Array.isArray(payload.messages) ? payload.messages : []

        // If readings array is empty, construct readings from raw assistant/user messages
        if (readings.length === 0 && messages.length > 0) {
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i]
            if (msg.role === "assistant") {
              const prevUser = i > 0 && messages[i - 1]?.role === "user" ? messages[i - 1] : null
              let structured = msg.structuredData || msg.structured_data || {}
              if (typeof structured === "string") {
                try {
                  structured = JSON.parse(structured)
                } catch {
                  structured = {}
                }
              }
              let paragraphs = structured.paragraphs || (msg.content ? [msg.content] : [])
              if (typeof paragraphs === "string") {
                try {
                  paragraphs = JSON.parse(paragraphs)
                } catch {
                  paragraphs = [paragraphs]
                }
              }
              readings.push({
                id: msg.id,
                threadId: thread?.id || threadId,
                engine: thread?.engine || "jyotish",
                question: prevUser ? prevUser.content : (thread?.title || "Reading"),
                createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
                openingThought: structured.openingThought || "",
                thinkingSteps: Array.isArray(structured.thinkingSteps) ? structured.thinkingSteps : [],
                paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
                astrologyBehind: Array.isArray(structured.astrologyBehind) ? structured.astrologyBehind : [],
                suggestedQuestions: Array.isArray(structured.suggestedQuestions) ? structured.suggestedQuestions : [],
                offer: structured.offer || null,
                feedback: msg.feedback,
              })
            }
          }
        }

        // Normalize every reading to ensure clean arrays and strings
        readings = readings.map((r) => {
          let structured = r.structuredData || r.structured_data || {}
          if (typeof structured === "string") {
            try {
              structured = JSON.parse(structured)
            } catch {
              structured = {}
            }
          }
          let paragraphs = r.paragraphs
          if (typeof paragraphs === "string") {
            try {
              paragraphs = JSON.parse(paragraphs)
            } catch {
              paragraphs = [paragraphs]
            }
          }
          if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
            if (Array.isArray(structured.paragraphs) && structured.paragraphs.length > 0) {
              paragraphs = structured.paragraphs
            } else if (r.content) {
              paragraphs = [r.content]
            } else {
              paragraphs = ["Consultation reading."]
            }
          }
          return {
            ...r,
            threadId: r.threadId || thread?.id || threadId,
            engine: r.engine || thread?.engine || "jyotish",
            question: r.question || thread?.title || "Reading",
            openingThought: r.openingThought || structured.openingThought || "",
            thinkingSteps: Array.isArray(r.thinkingSteps)
              ? r.thinkingSteps
              : Array.isArray(structured.thinkingSteps)
              ? structured.thinkingSteps
              : [],
            paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs],
            astrologyBehind: Array.isArray(r.astrologyBehind)
              ? r.astrologyBehind
              : Array.isArray(structured.astrologyBehind)
              ? structured.astrologyBehind
              : [],
            suggestedQuestions: Array.isArray(r.suggestedQuestions)
              ? r.suggestedQuestions
              : Array.isArray(structured.suggestedQuestions)
              ? structured.suggestedQuestions
              : [],
            offer: r.offer || structured.offer || null,
          }
        })

        // If still empty but thread exists, provide a fallback entry
        if (readings.length === 0 && thread) {
          readings.push({
            id: thread.id,
            threadId: thread.id,
            engine: thread.engine || "jyotish",
            question: thread.title || "Consultation",
            createdAt: thread.createdAt || new Date().toISOString(),
            paragraphs: ["Consultation thread opened."],
          })
        }

        return {
          thread,
          readings,
          threadId,
        }
      }
      return rejectWithValue("Failed to fetch conversation thread.")
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load reading details."
      )
    }
  }
)

/**
 * Async Thunk: Submit thumbs up / thumbs down feedback for a reading
 * Endpoint: PATCH /api/v1/chat/messages/:messageId/feedback
 */
export const submitMessageFeedback = createAsyncThunk(
  "jyotish/submitMessageFeedback",
  async ({ messageId, feedback }) => {
    try {
      const response = await apiClient.patch(`/chat/messages/${messageId}/feedback`, {
        feedback,
      })
      if (response.data && response.data.success) {
        toast.success(
          feedback === "yes"
            ? "Thank you! Glad this reading was helpful."
            : "Feedback received. We will refine future readings."
        )
        return { messageId, feedback }
      }
      return { messageId, feedback }
    } catch (error) {
      // Non-blocking error for feedback
      console.warn("Feedback submission error:", error)
      return { messageId, feedback }
    }
  }
)

/**
 * Async Thunk: Delete a conversation thread
 * Endpoint: DELETE /api/v1/chat/threads/:threadId
 */
export const deleteThread = createAsyncThunk(
  "jyotish/deleteThread",
  async (threadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/chat/threads/${threadId}`)
      if (response.data && response.data.success) {
        toast.success("Conversation deleted.")
        return threadId
      }
      return threadId
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete conversation."
      toast.error(msg)
      return rejectWithValue(msg)
    }
  }
)
