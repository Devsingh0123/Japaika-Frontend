import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { ALL_CALCULATORS, CalculatorCard } from "@/features/calculators/components/RelatedCalculatorsGrid";
import Footer from "@/components/layout/Footer";

const CATEGORIES = [
  { name: "All", count: 12 },
  { name: "Birth chart", count: 4 },
  { name: "Dasha & transit", count: 3 },
  { name: "Compatibility", count: 1 },
  { name: "Doshas", count: 2 },
  { name: "Remedies", count: 1 },
  { name: "Numerology", count: 1 },
];

export default function CalculatorsListingPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = ALL_CALCULATORS.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" ||
      item.tag.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-transparent text-foreground pb-24">
      <Helmet>
        <title>12 Free Vedic Astrology Calculators | Japaika</title>
        <meta
          name="description"
          content="12 instruments on the same ephemeris the readings run on. Compute here, then hand the result to Jyotish."
        />
      </Helmet>

      <div className="relative px-6 pt-9 pb-20 sm:px-10 sm:pt-11 lg:px-14 xl:px-20 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <header className="min-w-0">
          <div className="text-muted-foreground font-mono text-[10px] tracking-[0.22em] uppercase">
            JAPAIKA / CALCULATORS
          </div>

          <h1 className="mt-3.5 font-serif text-[42px] leading-none tracking-[-0.015em] text-foreground sm:text-[48px]">
            Vedic calculators
          </h1>

          <p className="text-muted-foreground mt-2.5 max-w-[640px] text-[15px] leading-snug text-pretty">
            12 instruments on the same ephemeris the readings run on. Compute here, then hand the result to Jyotish.
          </p>
        </header>

        {/* Toolbar: Search input + Category Filter Pills */}
        <div className="mt-6 mb-7 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
          {/* Search Bar */}
          <div className="border border-border bg-card/80 focus-within:border-primary flex max-w-[290px] min-w-[180px] flex-[1_1_200px] items-center gap-2.5 rounded-full px-4 py-2 transition shadow-xs">
            <Search className="text-muted-foreground w-3.5 h-3.5 shrink-0" />
            <input
              type="text"
              placeholder="Search instruments…"
              aria-label="Search calculators"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-foreground placeholder:text-muted-foreground caret-primary min-w-0 flex-1 bg-transparent font-sans text-[15px] outline-none"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map(({ name, count }) => {
              const isActive = selectedCategory === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategory(name)}
                  className={`flex cursor-pointer items-baseline gap-1.5 rounded-full border px-3.5 py-[7px] font-sans text-[14px] transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground font-medium shadow-xs"
                      : "border-border bg-accent/30 text-muted-foreground hover:border-primary/40 hover:text-foreground font-normal"
                  }`}
                >
                  <span>{name}</span>
                  <span className="font-mono text-[9.5px] opacity-70">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <CalculatorCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl space-y-2 mt-4 glass-card">
            <h3 className="text-base font-serif font-medium text-foreground">
              No instruments found
            </h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or selecting another category.
            </p>
          </div>
        )}
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
