/**
 * Category metadata & fallback data for Public FAQs and Legal Pages
 * Ensures resilient rendering and rich UI labels across all categories and slugs.
 */

export const FAQ_CATEGORY_META = {
  all: {
    id: "all",
    label: "All Questions",
    description: "Browse every topic across Japaika",
  },
  general: {
    id: "general",
    label: "General & Astrology",
    description: "Vedic calculation precision, Kundli basics & platform usage",
  },
  reports: {
    id: "reports",
    label: "Reports & Readings",
    description: "Personalized life reports, unlocking & generation timelines",
  },
  billing: {
    id: "billing",
    label: "Billing & Credits",
    description: "Payments, credit packs, invoices & refund eligibility",
  },
  privacy: {
    id: "privacy",
    label: "Privacy & Security",
    description: "Birth data protection, encryption & account controls",
  },
};

export const FAQ_SEARCH_SUGGESTIONS = [
  "Vedic accuracy",
  "Birth time",
  "Report credits",
  "Refund policy",
  "Privacy",
];

export const FALLBACK_FAQS = [
  {
    id: "faq-general-1",
    question: "How accurate are Japaika's Vedic astrology calculations?",
    answer:
      "All birth charts (Kundli), planetary longitudes, and divisional charts (Vargas) on Japaika are computed using high-precision astronomical algorithms paired with the authentic Lahiri (Chitrapaksha) Ayanamsa for sub-arcsecond accuracy.",
    category: "general",
    sort_order: 1,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-general-2",
    question: "What if I do not know my exact time of birth?",
    answer:
      "An accurate birth time is essential for determining your Ascendant (Lagna) and Moon Nakshatra. If your exact birth time is uncertain, you can still explore Moon-sign transits, daily horoscopes, and planetary calculators, or use an approximate time to view general planetary placements.",
    category: "general",
    sort_order: 2,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-general-3",
    question: "What is the difference between Jyotish Mode and Shastra Mode in AI chat?",
    answer:
      "Jyotish Mode analyzes your personal Kundli, planetary Dashas, and divisional charts to answer life-specific questions. Shastra Mode explores classical Vedic scriptures, mantras, cosmic philosophy, and spiritual remedies drawn from traditional texts.",
    category: "general",
    sort_order: 3,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-reports-1",
    question: "How do personalized Vedic Reports work?",
    answer:
      "Each premium report (such as Career Mastery, Love & Marriage, or Annual Forecast) synthesizes your natal Rashi chart, relevant divisional charts (D-9 Navamsa, D-10 Dasamsa), and active Vimshottari Dasha periods into a multi-chapter reading with actionable Vedic remedies.",
    category: "reports",
    sort_order: 4,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-reports-2",
    question: "Will I be charged twice if I re-open an unlocked report?",
    answer:
      "Never. Once a report is unlocked for your birth chart, it is permanently saved to your account under 'My Reports'. Re-opening or reading it again deducts zero credits.",
    category: "reports",
    sort_order: 5,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-billing-1",
    question: "What happens if a report generation fails after my credit is deducted?",
    answer:
      "Japaika uses automatic credit protection. If an upstream error interrupts report generation, the deducted report credit is automatically refunded to your account balance.",
    category: "billing",
    sort_order: 6,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-billing-2",
    question: "Where can I download my payment receipts and invoices?",
    answer:
      "You can view and print official tax receipts for all credit pack purchases and subscriptions anytime from the Invoices & Billing section in your profile menu.",
    category: "billing",
    sort_order: 7,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "faq-privacy-1",
    question: "Is my birth chart and personal conversation data kept private?",
    answer:
      "Yes. Your birth details, Kundli profiles, and AI consultation threads are encrypted and strictly confidential. We never sell or share your personal astrological data with third-party advertisers.",
    category: "privacy",
    sort_order: 8,
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
];

export const LEGAL_PAGE_NAVIGATION = [
  {
    slug: "privacy-policy",
    routePath: "/privacy-policy",
    title: "Privacy Policy",
    shortLabel: "Privacy Policy",
    subtitle: "How we safeguard your birth details, charts, and personal data",
    badge: "DATA PROTECTION",
  },
  {
    slug: "terms",
    routePath: "/terms-and-conditions",
    title: "Terms & Conditions",
    shortLabel: "Terms & Conditions",
    subtitle: "Rules, account responsibilities, and service usage terms",
    badge: "USER AGREEMENT",
  },
  {
    slug: "refund-policy",
    routePath: "/refund-policy",
    title: "Refund Policy",
    shortLabel: "Refund Policy",
    subtitle: "Guidelines for digital reports, credit packs, and billing disputes",
    badge: "BILLING & REFUNDS",
  },
  {
    slug: "disclaimer",
    routePath: "/disclaimer",
    title: "Disclaimer",
    shortLabel: "Disclaimer",
    subtitle: "Important notice regarding Vedic astrological interpretations",
    badge: "ADVISORY NOTICE",
  },
];

export const SLUG_ALIAS_MAP = {
  privacy: "privacy-policy",
  "privacy-policy": "privacy-policy",
  terms: "terms",
  "terms-and-conditions": "terms",
  "terms-of-service": "terms",
  "terms-of-use": "terms",
  refund: "refund-policy",
  refunds: "refund-policy",
  "refund-policy": "refund-policy",
  "cancellation-and-refund-policy": "refund-policy",
  disclaimer: "disclaimer",
};

export function normalizeLegalSlug(rawSlug = "") {
  const cleaned = String(rawSlug || "")
    .trim()
    .toLowerCase();
  return SLUG_ALIAS_MAP[cleaned] || cleaned || "privacy-policy";
}

export const FALLBACK_LEGAL_PAGES = [
  {
    id: "legal-privacy-policy",
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "<h2>1. Privacy Commitment</h2><p>At Japaika, we treat your personal birth data, planetary charts, and spiritual inquiries with the highest confidentiality and respect.</p><h2>2. Information We Collect</h2><p>We collect account details (such as your name and email address) and birth chart parameters (date, time, and place of birth) strictly to compute accurate Vedic astrological charts, Dasha timelines, and personalized readings.</p><h2>3. How We Use Your Data</h2><p>Your birth details are used exclusively to generate your Kundli, personalized reports, and AI-assisted Vedic insights. We never sell or rent your personal information to third-party marketers.</p><h2>4. Security & Retention</h2><p>All communication between your browser and Japaika is encrypted over HTTPS. You may update your birth profile or request account deletion at any time by contacting our support team.</p>",
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "legal-terms",
    slug: "terms",
    title: "Terms & Conditions",
    content:
      "<h2>1. Acceptance of Terms</h2><p>By accessing and using Japaika, you agree to abide by these Terms & Conditions and all applicable laws and regulations.</p><h2>2. Services Provided</h2><p>Japaika provides Vedic astrology chart calculations, planetary transit insights, interactive AI consultations (Jyotish and Shastra modes), and personalized astrological reports.</p><h2>3. User Accounts & Security</h2><p>You are responsible for maintaining the confidentiality of your account access and OTP verification credentials. Please notify us immediately of any unauthorized use of your account.</p><h2>4. Intellectual Property</h2><p>All software, ephemeris synthesis engines, visual chart layouts, and generated report structures on Japaika are protected by copyright and intellectual property laws.</p>",
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "legal-refund-policy",
    slug: "refund-policy",
    title: "Refund Policy",
    content:
      "<h2>1. Digital Astrological Services</h2><p>Because personalized astrological reports and AI consultation credits are digital goods computed and delivered immediately upon unlocking, completed report unlocks and consumed chat credits are generally non-refundable.</p><h2>2. Automatic Credit Protection</h2><p>If a report fails to generate due to a technical error on our platform, our system automatically refunds the deducted credit back to your account balance immediately.</p><h2>3. Duplicate Charges & Billing Disputes</h2><p>If you experience a duplicate payment charge or billing error, please contact our support team within 7 days of the transaction with your order reference ID for a full review and resolution.</p>",
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "legal-disclaimer",
    slug: "disclaimer",
    title: "Disclaimer",
    content:
      "<h2>1. Astrological Guidance Disclaimer</h2><p>All horoscopes, Kundli calculations, compatibility scores, AI consultations, and personalized reports provided by Japaika are based on traditional Vedic astrology (Jyotish Shastra) principles and are intended for spiritual reflection, educational, and informational purposes only.</p><h2>2. Not Professional Medical, Legal, or Financial Advice</h2><p>Astrological insights offered on Japaika do not constitute and should never replace professional medical, psychological, legal, or financial advice. Always consult qualified professionals for health, legal, or investment decisions.</p><h2>3. Free Will & Personal Responsibility</h2><p>Vedic astrology highlights planetary tendencies and karmic windows, but your personal choices and actions remain your own responsibility.</p>",
    is_active: true,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-01T10:00:00.000Z",
  },
];

