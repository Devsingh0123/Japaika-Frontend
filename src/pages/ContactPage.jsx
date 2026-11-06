import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  Mail,
  Copy,
  Check,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SUPPORT_EMAIL = "support@japaika.com";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard
      .writeText(SUPPORT_EMAIL)
      .then(() => {
        setCopied(true);
        toast.success("Email copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Could not copy email");
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Contact Us | Japaika</title>
        <meta
          name="description"
          content="Reach out to Japaika support via email at support@japaika.com."
        />
      </Helmet>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center space-y-6">
        <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 py-8 sm:py-12 shadow-lg glass-card text-center">
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

          <CardContent className="relative z-10 px-6 sm:px-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JAPAIKA / CONTACT US</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Get in <span className="cosmic-gradient font-extrabold">Touch</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                For any questions or support, copy our official email below and write to us.
              </p>
            </div>

            {/* Email Copy Box */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-background/90 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 truncate">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-mono text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>

              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopyEmail}
                className="w-full sm:w-auto rounded-xl cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    <span>Copy Email</span>
                  </>
                )}
              </Button>
            </div>

            {/* Response Time Note */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Response time: Within 24 hours</span>
              </span>
              <span className="hidden sm:inline text-border">&bull;</span>
              <Link
                to="/faq"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Read FAQs</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
