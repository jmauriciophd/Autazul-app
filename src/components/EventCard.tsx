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
}

export function EventCard({ event, onClick, severityColors }: EventCardProps) {
  const displayName = event.creatorName || event.professionalName || 'Desconhecido'
  const isParent = event.creatorRole === 'parent'
  
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{event.type}</Badge>
              <Badge className={severityColors[event.severity] || 'bg-gray-100 text-gray-800'}>
                {event.severity}
              </Badge>
            </div>
            <p className="text-sm mb-1">{event.description}</p>
            <p className="text-xs text-muted-foreground">
              {event.time} • {displayName}
              {isParent && ' (Você)'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
