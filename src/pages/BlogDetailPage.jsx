import { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import {
  Clock,
  Eye,
  Calendar,
  User,
  Sparkles,
  ArrowLeft,
  Tag,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { fetchBlogBySlug, clearCurrentBlog } from "@/features/blogs/blogsSlice";
import BlogCard from "@/features/blogs/components/BlogCard";
import BlogReadingProgress from "@/features/blogs/components/BlogReadingProgress";
import BlogShareButtons from "@/features/blogs/components/BlogShareButtons";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/layout/Footer";

// Helper to format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// Markdown-like block renderer for rich typography without heavy dependencies
function renderArticleContent(rawContent) {
  if (!rawContent) return null;

  const lines = rawContent.trim().split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let tableBuffer = [];
  let inTable = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${index}`}
            className="my-5 rounded-xl border border-border/80 bg-card/90 p-4 font-mono text-xs sm:text-sm text-amber-600 dark:text-amber-400 overflow-x-auto shadow-inner glass-card"
          >
            <pre>{codeBuffer.join("\n")}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Markdown Tables
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      // Flush table
      elements.push(renderTable(tableBuffer, `table-${index}`));
      tableBuffer = [];
      inTable = false;
    }

    // Headers
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${index}`}
          className="mt-10 mb-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground border-b border-border/80 pb-2"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${index}`}
          className="mt-8 mb-3 font-serif text-xl sm:text-2xl font-bold tracking-tight text-primary"
        >
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${index}`}
          className="mt-6 mb-2 font-serif text-lg font-bold text-amber-600 dark:text-amber-400"
        >
          {trimmed.replace(/^####\s+/, "")}
        </h4>
      );
      return;
    }

    // Blockquotes
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-6 rounded-r-2xl border-l-4 border-primary bg-primary/10 p-5 font-serif text-base sm:text-lg italic text-foreground shadow-xs"
        >
          {trimmed.replace(/^>\s+/, "").replace(/\*(.*?)\*/g, "$1")}
        </blockquote>
      );
      return;
    }

    // Horizontal Divider
    if (trimmed === "---") {
      elements.push(<hr key={`hr-${index}`} className="my-8 border-border/80" />);
      return;
    }

    // Bullet list items
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.replace(/^[-•]\s+/, "");
      elements.push(
        <li key={`li-${index}`} className="ml-6 list-disc my-1.5 text-muted-foreground leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
        </li>
      );
      return;
    }

    // Numbered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      elements.push(
        <li key={`ol-${index}`} className="ml-6 list-decimal my-1.5 text-muted-foreground leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
        </li>
      );
      return;
    }

    // Empty lines
    if (!trimmed) {
      return;
    }

    // Regular paragraphs
    elements.push(
      <p
        key={`p-${index}`}
        className="my-4 text-base sm:text-lg text-foreground/90 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
      />
    );
  });

  if (inTable && tableBuffer.length > 0) {
    elements.push(renderTable(tableBuffer, `table-end`));
  }

  return elements;
}

// Inline markdown formatter for bold, italic, and inline code
function formatInlineMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-primary italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-amber-600 dark:text-amber-400 border border-border/60">$1</code>');
}

// Table renderer helper
function renderTable(tableRows, key) {
  const parsed = tableRows
    .map((r) => r.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((r) => !r.every((c) => c.match(/^[:\s-]+$/))); // filter out separator row

  if (parsed.length === 0) return null;
  const header = parsed[0];
  const body = parsed.slice(1);

  return (
    <div key={key} className="my-6 overflow-x-auto rounded-xl border border-border/80 bg-card/90 glass-card shadow-sm">
      <table className="w-full text-left font-sans text-xs sm:text-sm">
        <thead className="bg-muted/50 border-b border-border/80 font-mono uppercase text-foreground text-[11px]">
          <tr>
            {header.map((col, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(col) }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {body.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-accent/40">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-3 text-foreground/80">
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentBlog, detailLoading, detailError } = useSelector(
    (state) => state.blogs || {}
  );

  const blog = currentBlog?.blog;
  const relatedBlogs = currentBlog?.relatedBlogs || [];

  useEffect(() => {
    if (slug) {
      dispatch(fetchBlogBySlug(slug));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [slug, dispatch]);

  const authorName = useMemo(() => {
    if (!blog) return "Japaika Scholar";
    if (typeof blog.author === "string") return blog.author;
    return blog.author?.name || blog.author?.email?.split("@")[0] || "Japaika Vedic Scholar";
  }, [blog]);

  const authorBio = useMemo(() => {
    if (!blog) return "";
    return (
      blog.author?.bio ||
      "Senior Jyotish researcher and scholar dedicated to decoding planetary transits, divisional charts, and classical Parashari sutras."
    );
  }, [blog]);

  const categoryName = useMemo(() => {
    if (!blog?.category) return "Vedic Astrology";
    return blog.category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [blog]);

  // Loading skeleton
  if (detailLoading) {
    return (
      <div className="min-h-full flex flex-col justify-between bg-transparent text-foreground">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not found / error state
  if (detailError || (!blog && !detailLoading)) {
    return (
      <div className="min-h-full flex flex-col justify-between bg-transparent text-foreground">
        <div className="max-w-lg w-full mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Article Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The publication you are looking for may have been moved, updated, or unpublished.
          </p>
          <div className="pt-2">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Publications</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const metaTitle = blog.meta_title || `${blog.title} | Japaika`;
  const metaDesc =
    blog.meta_description || blog.excerpt || "In-depth Vedic astrology publication by Japaika.";

  return (
    <div className="min-h-full flex flex-col justify-between bg-transparent text-foreground">
      {/* Top Reading Progress Bar */}
      <BlogReadingProgress />

      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {blog.meta_keywords && <meta name="keywords" content={blog.meta_keywords} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        {blog.featured_image && <meta property="og:image" content={blog.featured_image} />}
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={blog.published_at || blog.created_at} />
        <link rel="canonical" href={blog.canonical_url || shareUrl} />
      </Helmet>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Navigation Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Japaika</Link>
          <span>/</span>
          <Link to="/blogs" className="hover:text-foreground transition-colors">Publications</Link>
          <span>/</span>
          <Link
            to={`/blogs?category=${blog.category}`}
            className="text-primary hover:text-foreground transition-colors"
          >
            {categoryName}
          </Link>
        </nav>

        {/* Article Header */}
        <header className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border/80 bg-background/85 px-3 py-1 font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-md shadow-xs">
              {categoryName}
            </span>

            {blog.read_time_minutes && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{blog.read_time_minutes} min read</span>
              </span>
            )}

            {blog.views_count > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>{blog.views_count.toLocaleString()} views</span>
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-sans font-normal">
              {blog.excerpt}
            </p>
          )}

          {/* Author info & Social Share toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-b border-border/80 py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-border bg-card/80 flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 shadow-xs">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{authorName}</p>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 text-muted-foreground/70" />
                  <span>{formatDate(blog.published_at || blog.created_at)}</span>
                </div>
              </div>
            </div>

            <BlogShareButtons title={blog.title} url={shareUrl} />
          </div>
        </header>

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/80 shadow-lg">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-60" />
          </div>
        )}

        {/* Formatted Article Body */}
        <article className="prose dark:prose-invert max-w-none font-sans text-foreground">
          {renderArticleContent(blog.content)}
        </article>

        {/* Tags Section */}
        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="pt-6 border-t border-border/80 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Topics:</span>
            </span>
            {blog.tags.map((tag, tIdx) => (
              <Link
                key={tIdx}
                to={`/blogs?tag=${tag}`}
                className="rounded-full border border-border/80 bg-card/80 px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent transition-colors glass-card shadow-xs"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Interactive "Ask Jyotish" Consultation Card */}
        <section
          aria-label="Ask Jyotish on this topic"
          className="my-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-8 shadow-xl relative overflow-hidden glass-card"
        >
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/15 px-3 py-0.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Personal Reading</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                How does this transit or yoga affect your birth chart?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Consult <strong>Jyotish</strong>, our AI Vedic engine. It cross-references your exact birth degrees with Brihat Parashara Hora Shastra in seconds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/?engine=jyotish`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
            >
              <span>Consult Jyotish</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </section>

        {/* Author Bio Box */}
        <section aria-label="Author Profile" className="rounded-2xl border border-border/80 bg-card/70 glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-lg font-bold text-foreground">{authorName}</h4>
              <span className="font-mono text-[10px] text-muted-foreground rounded border border-border px-1.5 py-0.5 uppercase">
                Scholar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {authorBio}
            </p>
          </div>
        </section>

        {/* Related Articles Section */}
        {relatedBlogs.length > 0 && (
          <section aria-label="Related Publications" className="pt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="font-serif text-2xl font-bold text-foreground">Related Publications</h3>
              <Link
                to={`/blogs?category=${blog.category}`}
                className="text-xs font-mono text-primary hover:underline transition-colors flex items-center gap-1"
              >
                <span>View all in {categoryName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((rBlog) => (
                <BlogCard key={rBlog.id || rBlog.slug} blog={rBlog} />
              ))}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-8 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Publications Archive</span>
          </Link>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
