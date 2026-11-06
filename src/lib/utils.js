import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
}

/**
 * Strictly normalizes currency to either "INR" or "USD". Defaults to "INR".
 * @param {string} currency
 * @returns {"INR" | "USD"}
 */
export function normalizeCurrency(currency) {
  const curr = String(currency || "INR").trim().toUpperCase()
  return curr === "USD" ? "USD" : "INR"
}

/**
 * Format currency with proper symbol and locale formatting (strictly INR or USD)
 * @param {number|string} amount - price
 * @param {string} currency - "INR", "USD"
 * @param {Object} [options]
 * @param {boolean} [options.showDecimals] - force displaying decimals
 * @returns {string} e.g. "₹799", "$9.99"
 */
export function formatCurrency(amount, currency = "INR", options = {}) {
  const num = Number(amount) || 0
  const curr = normalizeCurrency(currency)
  const symbol = CURRENCY_SYMBOLS[curr]

  if (curr === "INR") {
    const isWhole = num % 1 === 0 && !options.showDecimals
    return `${symbol}${num.toLocaleString("en-IN", {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2,
    })}`
  }

  const isWhole = num % 1 === 0 && !options.showDecimals
  return `${symbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Safe extractor for dynamic pack pricing strictly for INR or USD.
 * @param {Object} pkg - pack object from API
 * @param {string} currentCurrency - active currency code ("INR" | "USD")
 * @returns {{ originalPrice: number, offerPrice: number, currency: "INR" | "USD" }}
 */
export function getPackPricing(pkg, currentCurrency = "INR") {
  const curr = normalizeCurrency(currentCurrency || pkg?.currency)
  if (!pkg) {
    return { originalPrice: 0, offerPrice: 0, currency: curr }
  }

  // Handle nested prices JSON if present (strictly INR or USD)
  const nested =
    pkg.prices && typeof pkg.prices === "object" && !Array.isArray(pkg.prices)
      ? pkg.prices[curr] || pkg.prices["INR"] || pkg.prices
      : null

  const original =
    pkg.originalPrice !== undefined && pkg.originalPrice !== null
      ? pkg.originalPrice
      : nested?.basePrice !== undefined && nested?.basePrice !== null
      ? nested.basePrice
      : nested?.originalPrice !== undefined && nested?.originalPrice !== null
      ? nested.originalPrice
      : pkg.offerPrice !== undefined && pkg.offerPrice !== null
      ? pkg.offerPrice
      : nested?.offerPrice ?? 0

  const offer =
    pkg.offerPrice !== undefined && pkg.offerPrice !== null
      ? pkg.offerPrice
      : nested?.offerPrice !== undefined && nested?.offerPrice !== null
      ? nested.offerPrice
      : nested?.basePrice !== undefined && nested?.basePrice !== null
      ? nested.basePrice
      : original

  return {
    originalPrice: Number(original) || 0,
    offerPrice: Number(offer) || 0,
    currency: curr,
  }
}
