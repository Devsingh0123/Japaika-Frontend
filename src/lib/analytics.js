/**
 * Centralized Google Analytics 4 & Google Tag Manager Analytics Utility
 * Pushes standard and custom business events to window.dataLayer
 */

// Sliding-window cache to prevent duplicate events during React StrictMode dev mounts
let lastEventSignature = ""
let lastEventTimestamp = 0
const DEDUPE_WINDOW_MS = 400

export function pushDataLayer(payload) {
  if (typeof window === "undefined" || !payload) return

  // Deduplication guard for non-null ecommerce payloads and named events
  if (payload.event) {
    try {
      const signature = `${payload.event}::${JSON.stringify(payload)}`
      const now = Date.now()
      if (signature === lastEventSignature && now - lastEventTimestamp < DEDUPE_WINDOW_MS) {
        return // Suppress StrictMode duplicate run
      }
      lastEventSignature = signature
      lastEventTimestamp = now
    } catch {
      // Non-blocking signature generation
    }
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)

  if (import.meta.env.DEV) {
    console.log("[Analytics DataLayer]", payload)
  }
}

/**
 * Tracks custom business events in GA4 / GTM
 * @param {string} eventName - Name of the custom event
 * @param {Record<string, any>} params - Event parameters
 */
export function trackEvent(eventName, params = {}) {
  pushDataLayer({
    event: eventName,
    ...params,
  })
}

/**
 * Tracks GA4 Standard E-Commerce: view_item_list
 * Fired when a list/array of items is presented to the user (e.g. recharge pack modal)
 */
export function trackViewItemList({ items = [], itemListName = "Pack List", currency = "INR" }) {
  if (!Array.isArray(items) || items.length === 0) return
  pushDataLayer({ ecommerce: null })
  pushDataLayer({
    event: "view_item_list",
    ecommerce: {
      item_list_name: itemListName,
      items: items.map((item, idx) => ({
        item_id: String(item.id || item.code),
        item_name: String(item.name || "Astrology Pack"),
        item_category: item.category || "Astrology Pack",
        price: Number(item.price || item.offerPrice || item.originalPrice || 0),
        index: idx + 1,
      })),
    },
  })
}

/**
 * Tracks GA4 Standard E-Commerce: select_item
 * Fired when a user selects a specific item from a list or modal
 */
export function trackSelectItem({ item, itemListName = "Pack List", currency = "INR", value }) {
  if (!item) return
  pushDataLayer({ ecommerce: null })
  pushDataLayer({
    event: "select_item",
    ecommerce: {
      item_list_name: itemListName,
      items: [
        {
          item_id: String(item.id || item.code),
          item_name: String(item.name || "Astrology Pack"),
          item_category: item.category || "Astrology Pack",
          price: Number(value || item.price || 0),
          quantity: 1,
        },
      ],
    },
  })
}

/**
 * Tracks GA4 Standard E-Commerce: view_item
 * Fired when a user views detailed breakdown/order review for a specific item
 */
export function trackViewItem({ item, currency = "INR", value }) {
  if (!item) return
  pushDataLayer({ ecommerce: null }) // Clear previous ecommerce object per GA4 spec
  pushDataLayer({
    event: "view_item",
    ecommerce: {
      currency: (currency || "INR").toUpperCase(),
      value: Number(value || item.price || 0),
      items: [
        {
          item_id: String(item.id || item.item_id || item.code),
          item_name: String(item.name || item.item_name || "Astrology Pack"),
          item_category: item.category || "Astrology Pack",
          price: Number(value || item.price || 0),
          quantity: 1,
        },
      ],
    },
  })
}

/**
 * Tracks GA4 Standard E-Commerce: begin_checkout
 * Fired when user confirms their selection and clicks to open payment
 */
export function trackBeginCheckout({ item, currency = "INR", value, coupon }) {
  if (!item) return
  pushDataLayer({ ecommerce: null })
  pushDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: (currency || "INR").toUpperCase(),
      value: Number(value || 0),
      coupon: coupon ? String(coupon) : undefined,
      items: [
        {
          item_id: String(item.id || item.item_id || item.code),
          item_name: String(item.name || item.item_name || "Astrology Pack"),
          item_category: item.category || "Astrology Pack",
          price: Number(value || 0),
          quantity: 1,
        },
      ],
    },
  })
}

/**
 * Tracks GA4 Standard E-Commerce: purchase
 * Fired strictly when Razorpay payment is verified and confirmed by backend
 */
export function trackPurchase({
  transactionId,
  value,
  currency = "INR",
  tax = 0,
  coupon,
  items = [],
}) {
  pushDataLayer({ ecommerce: null })
  pushDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: String(transactionId),
      value: Number(value || 0),
      currency: (currency || "INR").toUpperCase(),
      tax: Number(tax || 0),
      coupon: coupon ? String(coupon) : undefined,
      items: items.map((item, idx) => ({
        item_id: String(item.id || item.item_id || "pack"),
        item_name: String(item.name || item.item_name || "Astrology Pack"),
        item_category: item.category || "Astrology Pack",
        price: Number(item.price || value || 0),
        quantity: item.quantity || 1,
        index: idx + 1,
      })),
    },
  })
}

/**
 * Tracks promo code application
 */
export function trackApplyPromoCode({ couponCode, discountAmount, packId, status = "success" }) {
  trackEvent("apply_promo_code", {
    coupon_code: couponCode,
    discount_amount: Number(discountAmount || 0),
    pack_id: packId,
    status,
  })
}

/**
 * Sets user identity and demographic context on login or app init
 */
export function setUserContext(user) {
  if (!user || typeof window === "undefined") return
  pushDataLayer({
    user_id: user.id || user.userId,
    user_properties: {
      has_birth_chart: Boolean(user.onboardingCompleted),
      credit_balance: user.creditBalance ?? user.credit_balance ?? 0,
      currency: user.currency || "INR",
    },
  })
}
