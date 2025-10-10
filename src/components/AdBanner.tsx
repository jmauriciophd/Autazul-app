import { useState, useEffect } from 'react'
import { api } from '../utils/api'

interface AdSettings {
  googleAdsCode?: string
  bannerUrl?: string
  bannerLink?: string
}

export function AdBanner() {
  const [settings, setSettings] = useState<AdSettings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

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

  if (loading || (!settings.bannerUrl && !settings.googleAdsCode)) {
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Banner Image */}
      {settings.bannerUrl && (
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
      {settings.googleAdsCode && (
        <div className="w-full min-h-[100px] bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
          <p className="text-xs text-muted-foreground">Espaço para Google Ads</p>
        </div>
      )}
    </div>
  )
}
