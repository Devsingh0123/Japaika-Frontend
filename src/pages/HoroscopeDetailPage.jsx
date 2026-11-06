import React, { useState, useEffect } from "react"
import { useParams, useOutletContext, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet-async"
import { RefreshCw, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import {
  HoroscopeHeader,
  HoroscopeReading,
  HoroscopeSidebar,
  signsData,
  fetchSignForecast,
  fetchHoroscopeSigns,
} from "@/features/horoscope"

export default function HoroscopeDetailPage() {
  const { sign: signParam, timeframe: timeframeParam } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { onOpenAuthModal, onOpenBindModal } = useOutletContext() || {}

  const initialPeriod = (timeframeParam || "daily").toLowerCase()
  const [activePeriod, setActivePeriod] = useState(
    ["daily", "monthly", "yearly"].includes(initialPeriod) ? initialPeriod : "daily"
  )

  const handleOpenAuth = onOpenAuthModal || onOpenBindModal
  const currentSignKey = (signParam || "aries").toLowerCase()

  const { forecasts, loading, error, signs } = useSelector(
    (state) => state.horoscope || {}
  )

  // Resolve sign metadata
  const allSigns = signs || signsData
  const sign = allSigns[currentSignKey] || allSigns.aries || {
    id: currentSignKey,
    slug: currentSignKey,
    latin: currentSignKey.charAt(0).toUpperCase() + currentSignKey.slice(1),
    vedic: "Rashi",
    element: "Fire",
    ruler: "Mars",
    glyph: "✦",
    emoji: "✦",
  }

  // Derive other 11 signs for sidebar navigation
  const otherSigns = Object.values(allSigns).filter(
    (s) => (s.slug || s.id) !== (sign.slug || sign.id)
  )

  // Fetch forecast whenever sign or activePeriod changes
  useEffect(() => {
    dispatch(fetchSignForecast({ sign: currentSignKey, timeframe: activePeriod }))
  }, [dispatch, currentSignKey, activePeriod])

  // Sync signs list if empty
  useEffect(() => {
    if (!signs || Object.keys(signs).length <= 1) {
      dispatch(fetchHoroscopeSigns())
    }
  }, [dispatch, signs])

  // Forecast cache lookup
  const cacheKey = `${currentSignKey}_${activePeriod.toLowerCase()}`
  const activeForecastData = forecasts[cacheKey]
  const forecast = activeForecastData?.forecast
  const astrologyData = activeForecastData?.astrologyData || {}

  const handlePeriodChange = (newPeriod) => {
    setActivePeriod(newPeriod)
    navigate(`/horoscopes/${currentSignKey}/${newPeriod}`, { replace: true })
  }

  const handleRetry = () => {
    dispatch(fetchSignForecast({ sign: currentSignKey, timeframe: activePeriod }))
  }

  const signTitle = sign.latin || sign.name || "Aries"
  const vedicTitle = sign.vedic || sign.sanskrit || "Mesha"
  const periodTitle = activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)

  return (
    <div className="min-h-full flex flex-col bg-transparent text-foreground">
      <Helmet>
        <title>
          {signTitle} ({vedicTitle}) {periodTitle} Horoscope | Japaika Vedic Astrology
        </title>
        <meta
          name="description"
          content={`Read authentic Vedic ${periodTitle.toLowerCase()} horoscope for ${signTitle} (${vedicTitle} Rashi). Planetary longitudes, Gochara transits, lucky metrics, and auspicious timings.`}
        />
      </Helmet>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-10">
        {/* Hero Header Section */}
        <HoroscopeHeader
          sign={sign}
          activePeriod={activePeriod}
          onPeriodChange={handlePeriodChange}
          onOpenMoonSignModal={() => handleOpenAuth && handleOpenAuth(true)}
          periodKey={activeForecastData?.periodKey}
          dateRange={activeForecastData?.dateRange}
        />

        {/* Loading State: Skeleton */}
        {loading && !forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-44 w-full rounded-3xl" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error State: Retry Button */}
        {error && !forecast && !loading && (
          <div className="p-8 sm:p-12 rounded-3xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-serif font-medium text-foreground">
                Unable to Load {signTitle} Horoscope
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                {error || "An unexpected error occurred while calculating planetary transits."}
              </p>
            </div>
            <Button
              onClick={handleRetry}
              className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs font-mono tracking-wider flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Reading</span>
            </Button>
          </div>
        )}

        {/* 2-Column Main Reading Layout when forecast is present */}
        {forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Main Reading Column (8 cols on lg) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="lg:col-span-8 space-y-12"
            >
              <HoroscopeReading
                forecast={forecast}
                timeframe={activePeriod}
                astrologyData={astrologyData}
              />
            </motion.div>

            {/* Right Column / Sidebar (4 cols on lg) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="lg:col-span-4"
            >
              <HoroscopeSidebar
                sign={sign}
                otherSigns={otherSigns}
                lucky={forecast?.lucky}
                astrologyData={astrologyData}
                timeframe={activePeriod}
              />
            </motion.div>
          </div>
        )}
      </div>

    </div>
  )
}
