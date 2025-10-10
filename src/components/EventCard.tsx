import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

interface Event {
  id: string
  type: string
  time: string
  description: string
  severity: string
  professionalName?: string
  creatorName?: string
  creatorRole?: 'parent' | 'professional'
}

interface EventCardProps {
  event: Event
  onClick: () => void
  severityColors: Record<string, string>
  severityBackgroundColors?: Record<string, string>
}

export function EventCard({ event, onClick, severityColors, severityBackgroundColors }: EventCardProps) {
  const displayName = event.creatorName || event.professionalName || 'Desconhecido'
  const isParent = event.creatorRole === 'parent'
  
  const getBgColor = () => {
    if (severityBackgroundColors && severityBackgroundColors[event.severity]) {
      return severityBackgroundColors[event.severity]
    }
    // Fallback colors
    const fallbackColors: Record<string, string> = {
      'Normal': '#22c55e',
      'Médio': '#9ca3af',
      'Alerta': '#eab308',
      'Grave': '#dc2626',
      'Baixa': '#22c55e',
      'Média': '#eab308',
      'Alta': '#dc2626',
    }
    return fallbackColors[event.severity] || '#9ca3af'
  }
  
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" style={{ borderColor: '#15C3D6', color: '#5C8599' }}>{event.type}</Badge>
              <Badge 
                className={severityColors[event.severity] || 'text-white'}
                style={{ backgroundColor: getBgColor() }}
              >
                {event.severity}
              </Badge>
            </div>
            <p className="text-sm mb-1" style={{ color: '#373737' }}>{event.description}</p>
            <p className="text-xs" style={{ color: '#5C8599' }}>
              {event.time} • {displayName}
              {isParent && ' (Você)'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
