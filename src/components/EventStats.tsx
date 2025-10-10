import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react'

interface EventStatsProps {
  events: Array<{
    severity: string
    type: string
    date: string
  }>
}

export function EventStats({ events }: EventStatsProps) {
  if (events.length === 0) {
    return null
  }

  // Calculate statistics
  const totalEvents = events.length
  const severityCounts = {
    Baixa: events.filter(e => e.severity === 'Baixa').length,
    Média: events.filter(e => e.severity === 'Média').length,
    Alta: events.filter(e => e.severity === 'Alta').length,
  }

  const typeCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

  // Calculate trend (comparing last 7 days vs previous 7 days)
  const now = new Date()
  const last7Days = events.filter(e => {
    const eventDate = new Date(e.date)
    const diffTime = now.getTime() - eventDate.getTime()
    const diffDays = diffTime / (1000 * 3600 * 24)
    return diffDays <= 7
  }).length

  const previous7Days = events.filter(e => {
    const eventDate = new Date(e.date)
    const diffTime = now.getTime() - eventDate.getTime()
    const diffDays = diffTime / (1000 * 3600 * 24)
    return diffDays > 7 && diffDays <= 14
  }).length

  const trend = last7Days > previous7Days ? 'up' : last7Days < previous7Days ? 'down' : 'stable'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total de Eventos</CardDescription>
          <CardTitle className="text-3xl">{totalEvents}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            Este mês
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Últimos 7 dias</CardDescription>
          <CardTitle className="text-3xl">{last7Days}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {trend === 'up' && (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Aumento</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Redução</span>
              </>
            )}
            {trend === 'stable' && (
              <span className="text-muted-foreground">Estável</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Tipo mais comum</CardDescription>
          <CardTitle className="text-xl truncate">{mostCommonType?.[0] || 'N/A'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mostCommonType && `${mostCommonType[1]} ocorrência(s)`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Alta Gravidade</CardDescription>
          <CardTitle className="text-3xl">{severityCounts.Alta}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className={`w-4 h-4 ${severityCounts.Alta > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-muted-foreground">
              {severityCounts.Alta > 0 ? 'Requer atenção' : 'Tudo bem'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
