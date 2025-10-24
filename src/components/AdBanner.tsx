import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

interface Banner {
  id: string
  imageUrl: string
  link?: string
  title?: string
  order: number
}

interface AdSettings {
  googleAdsCode?: string
  banners?: Banner[]
  bannerUrl?: string
  bannerLink?: string
}

export function AdBanner() {
  const [settings, setSettings] = useState<AdSettings>({})
  const [loading, setLoading] = useState(true)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    // Auto-rotate banners every 5 seconds
    if (settings.banners && settings.banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => 
          prev === settings.banners!.length - 1 ? 0 : prev + 1
        )
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [settings.banners])

  async function loadSettings() {
    try {
      const { settings: data } = await api.getPublicSettings()
      setSettings(data)
      
      // Inject Google Ads code if available
      if (data.googleAdsCode) {
        const script = document.createElement('script')
        script.innerHTML = data.googleAdsCode
        document.body.appendChild(script)
      }
    } catch (error) {
      console.error('Error loading ad settings:', error)
    } finally {
      setLoading(false)
    }
  }

  function nextBanner() {
    if (settings.banners && settings.banners.length > 0) {
      setCurrentBannerIndex((prev) => 
        prev === settings.banners!.length - 1 ? 0 : prev + 1
      )
    }
  }

  function prevBanner() {
    if (settings.banners && settings.banners.length > 0) {
      setCurrentBannerIndex((prev) => 
        prev === 0 ? settings.banners!.length - 1 : prev - 1
      )
    }
  }

  function goToBanner(index: number) {
    setCurrentBannerIndex(index)
  }

  if (loading) {
    return null
  }

  const hasBanners = settings.banners && settings.banners.length > 0
  const hasLegacyBanner = settings.bannerUrl
  const hasGoogleAds = settings.googleAdsCode

  if (!hasBanners && !hasLegacyBanner && !hasGoogleAds) {
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Banner Carousel */}
      {hasBanners && (
        <div className="relative w-full rounded-lg overflow-hidden shadow-md group">
          {/* Banner Image */}
          <div className="relative">
            {settings.banners![currentBannerIndex].link ? (
              <a
                href={settings.banners![currentBannerIndex].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={settings.banners![currentBannerIndex].imageUrl}
                  alt={settings.banners![currentBannerIndex].title || `Banner ${currentBannerIndex + 1}`}
                  className="w-full h-auto transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </a>
            ) : (
              <img
                src={settings.banners![currentBannerIndex].imageUrl}
                alt={settings.banners![currentBannerIndex].title || `Banner ${currentBannerIndex + 1}`}
                className="w-full h-auto transition-opacity duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>

          {/* Navigation Arrows (only show if multiple banners) */}
          {settings.banners!.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={prevBanner}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={nextBanner}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {settings.banners!.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToBanner(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Legacy Single Banner (for backwards compatibility) */}
      {!hasBanners && hasLegacyBanner && (
        <div className="w-full rounded-lg overflow-hidden shadow-md">
          {settings.bannerLink ? (
            <a
              href={settings.bannerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-90 transition-opacity"
            >
              <img
                src={settings.bannerUrl}
                alt="Banner publicitário"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </a>
          ) : (
            <img
              src={settings.bannerUrl}
              alt="Banner publicitário"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>
      )}

      {/* Google Ads placeholder */}
      {hasGoogleAds && (
        <div className="w-full min-h-[100px] bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
          <p className="text-xs text-muted-foreground">Espaço para Google Ads</p>
        </div>
      )}
    </div>
  )
}
