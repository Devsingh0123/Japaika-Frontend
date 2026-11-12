import { Link } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { clearActiveConversation } from "@/features/jyotish"

const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com",
    logo: "/brandLogos/linkedin-badge.svg",
    imgClass: "w-5 h-5 object-contain",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com",
    logo: "/brandLogos/facebook.svg",
    imgClass: "w-5 h-5 object-contain",
  },
  {
    name: "Instagram",
    url: "https://instagram.com",
    logo: "/brandLogos/instagram.svg",
    imgClass: "w-5 h-5 object-contain",
  },
  {
    name: "X",
    url: "https://x.com",
    logo: "/brandLogos/x.svg",
    imgClass: "w-4 h-4 object-contain dark:invert",
  },
  {
    name: "WhatsApp",
    url: "https://web.whatsapp.com/",
    logo: "/brandLogos/whatsapp.svg",
    imgClass: "w-4 h-4 object-contain",
  },
]

export default function Footer() {
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useDispatch()

  return (
    <footer className="relative w-full border-t border-border/80 overflow-hidden text-foreground mt-8 sm:mt-16 transition-colors print:hidden">
      {/* Ethereal Upward Starlight Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/[0.02] via-transparent to-transparent dark:from-primary/[0.045] dark:via-primary/[0.015]"
      />

      {/* Decorative Japaika Astrolabe Mandala Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 sm:-bottom-36 sm:-right-16 w-[440px] h-[440px] sm:w-[660px] sm:h-[660px] opacity-[0.16] dark:opacity-[0.07] select-none z-0 [mask-image:radial-gradient(circle_at_center,black_35%,transparent_75%)]"
      >
        <img
          src="/japaikaLogo.svg"
          alt=""
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal filter dark:brightness-115"
        />
      </div>

      <div className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-5 sm:pb-7 flex flex-col justify-between gap-6 sm:gap-8">

          {/* ==============================================================
              MOBILE HORIZONTAL FOOTER (< md)
              Compact, horizontal, and fits the 16:9 landscape aspect ratio
              ============================================================== */}
          <div className="block md:hidden space-y-4">
            {/* Top row: Brand + Social Icons in a single horizontal bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
              <Link
                to="/"
                onClick={() => dispatch(clearActiveConversation())}
                className="inline-flex items-center gap-2 group"
              >
                <img
                  src="/japaikaLogo.svg"
                  alt=""
                  className="w-7 h-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
                />
                <img
                  src="/japaikaName.svg"
                  alt="Japaika"
                  className="h-5 w-auto object-contain select-none"
                />
              </Link>

              {/* Social Brand Logos */}
              <div className="flex items-center gap-1.5">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    title={social.name}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-card/85 hover:bg-card border border-border/80 hover:border-primary/50 transition-all hover:scale-105 cursor-pointer shadow-xs"
                  >
                    <img
                      src={social.logo}
                      alt={social.name}
                      className={social.imgClass}
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Horizontal Navigation Links */}
            <div className="space-y-2 text-xs">
              {/* Company links in horizontal row */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-foreground/90 font-medium">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Company:</span>
                <Link to="/coming-soon" title="Coming Soon" className="hover:text-primary transition-colors">Become an Affiliate</Link>
                <span className="text-border/80">•</span>
                <Link to="/coming-soon" title="Coming Soon" className="hover:text-primary transition-colors">Add a Review</Link>
                <span className="text-border/80">•</span>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              </div>

              {/* Legal links in horizontal row */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-foreground/90 font-medium">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legal:</span>
                <Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link>
                <span className="text-border/80">•</span>
                <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
                <span className="text-border/80">•</span>
                <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms</Link>
                <span className="text-border/80">•</span>
                <Link to="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link>
                <span className="text-border/80">•</span>
                <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
              </div>
            </div>

          {/* App Downloads Column - Full width on mobile, 1 col on md+ */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <p className="text-xs font-bold text-foreground font-mono tracking-wider uppercase">
              Mobile App
            </p>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 w-full">
              <Link
                to="/coming-soon"
               
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs backdrop-blur-xs group"
              >
                <img
                  src="/brandLogos/apple.svg"
                  alt="App Store"
                  className="w-4 h-4 object-contain shrink-0 invert dark:invert-0"
                />
                <div className="text-left leading-none">
                  <span className="block text-[8px] text-muted-foreground uppercase tracking-wide">Download on</span>
                  <span className="font-semibold text-[11px]">App Store</span>
                </div>
              </Link>

              <Link
                to="/coming-soon"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs backdrop-blur-xs group"
              >
                <img
                  src="/brandLogos/google-play.svg"
                  alt="Play Store"
                  className="w-4 h-4 object-contain shrink-0"
                />
                <div className="text-left leading-none">
                  <span className="block text-[8px] text-muted-foreground uppercase tracking-wide">Get it on</span>
                  <span className="font-semibold text-[11px]">Play Store</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

          {/* ==============================================================
              DESKTOP 4-COLUMN FOOTER (md+)
              ============================================================== */}
          <div className="hidden md:grid md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand & Socials Column */}
            <div className="space-y-4">
              <Link
                to="/"
                onClick={() => dispatch(clearActiveConversation())}
                className="inline-flex items-center gap-2.5 group"
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

              <p className="text-xs text-foreground/85 font-medium leading-relaxed">
                World’s Most Accurate Astrology Engine.
              </p>

              {/* Social Brand Logos */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    title={social.name}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/50 transition-all hover:scale-105 cursor-pointer shadow-xs"
                  >
                    <img
                      src={social.logo}
                      alt={social.name}
                      className={social.imgClass}
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Company Column */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground font-mono tracking-wider uppercase">
                Company
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-foreground/85">
                <li>
                  <Link to="/coming-soon" title="Coming Soon" className="hover:text-primary transition-colors">
                    Become an Affiliate
                  </Link>
                </li>
                <li>
                  <Link to="/coming-soon" title="Coming Soon" className="hover:text-primary transition-colors">
                    Add a Review
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Help & Legal Column */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground font-mono tracking-wider uppercase">
                Help & Legal
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-foreground/85">
                <li>
                  <Link to="/faq" className="hover:text-primary transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-primary transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="hover:text-primary transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* App Downloads Column */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-foreground font-mono tracking-wider uppercase">
                Mobile App
              </p>
              <div className="grid grid-cols-1 gap-2.5 w-full">
                <Link
                  to="/coming-soon"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs group"
                >
                  <img
                    src="/brandLogos/apple.svg"
                    alt="App Store"
                    className="w-5 h-5 object-contain shrink-0 invert dark:invert-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="text-left leading-tight">
                    <span className="block text-[9px] text-muted-foreground uppercase tracking-wide">
                      Download on the
                    </span>
                    <span className="font-semibold text-xs">App Store</span>
                  </div>
                </Link>

                <Link
                  to="/coming-soon"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs group"
                >
                  <img
                    src="/brandLogos/google-play.svg"
                    alt="Play Store"
                    className="w-5 h-5 object-contain shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="text-left leading-tight">
                    <span className="block text-[9px] text-muted-foreground uppercase tracking-wide">
                      Get it on
                    </span>
                    <span className="font-semibold text-xs">Play Store</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Theme Toggle */}
          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground font-medium">
            <div className="text-center sm:text-left font-mono px-3 py-1 rounded-full bg-card/80 border border-border/60 text-[11px] sm:text-xs">
              © 2026 Veltex Services Private Limited
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border bg-card/85 hover:bg-card hover:border-primary/50 text-foreground transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group text-[11px] sm:text-xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="font-sans font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:-rotate-12 transition-transform duration-300" />
                  <span className="font-sans font-medium">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
