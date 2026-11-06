import { Link } from "react-router-dom"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

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

  return (
    <footer className="relative isolate w-full overflow-hidden border-t border-border bg-card text-foreground mt-8 sm:mt-16 transition-colors">
      {/* Crisp background illustration */}
      <img
        src="/footer-bg.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none select-none absolute inset-0 -z-20 w-full h-full object-cover object-[center_70%]"
      />
      {/* Subtle top-only gradient so the artwork remains clear and vivid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/20 to-transparent dark:from-background/50 dark:via-background/20 dark:to-background/10"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-14 pb-6 sm:pb-8 min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex flex-col justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Socials Column - Full width on mobile, 1 col on md+ */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
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
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/50 transition-all hover:scale-105 cursor-pointer shadow-xs backdrop-blur-xs"
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

          {/* Company Column - 1 col on mobile and md+ */}
          <div className="col-span-1 space-y-3">
            <p className="text-xs font-bold text-foreground font-mono tracking-wider uppercase">
              Company
            </p>
            <ul className="space-y-2.5 text-xs font-medium text-foreground/85">
              <li>
                <Link to="/jobs" className="hover:text-primary transition-colors">
                  Join Us
                </Link>
              </li>
              <li>
                <Link to="/review" className="hover:text-primary transition-colors">
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

          {/* Help & Legal Column - 1 col on mobile and md+ */}
          <div className="col-span-1 space-y-3">
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
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-card/85 hover:bg-card border border-border/80 hover:border-primary/40 text-foreground transition-all shadow-xs backdrop-blur-xs group"
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
        <div className="mt-10 sm:mt-16 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground font-medium">
          <div className="text-center sm:text-left font-mono px-3 py-1 rounded-full bg-card/75 backdrop-blur-xs border border-border/50">
            © 2026 Japaika Technologies Private Limited
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card/85 hover:bg-card hover:border-primary/50 text-foreground transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md backdrop-blur-xs group"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="text-xs font-sans font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:-rotate-12 transition-transform duration-300" />
                <span className="text-xs font-sans font-medium">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  )
}
