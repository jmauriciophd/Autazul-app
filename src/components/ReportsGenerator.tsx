import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts'
import { 
  FileDown, Calendar, TrendingUp, TrendingDown, BarChart3, 
  Filter, RefreshCw, Download, Loader2 
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface Event {
  id: string
  childId: string
  professionalId: string
  professionalName: string
  type: string
  date: string
  time: string
  description: string
  severity: string
  evaluation: string
}

interface ReportsGeneratorProps {
  childId: string
  childName: string
}

interface ReportData {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  eventsByMonth: Array<{ month: string; count: number }>
  eventsByWeek: Array<{ week: string; count: number }>
  eventsByDay: Array<{ day: string; count: number }>
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  events: Event[]
}

export function ReportsGenerator({ childId, childName }: ReportsGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  
  // Filtros
  const [periodType, setPeriodType] = useState<'month' | 'year' | 'custom'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const eventTypes = [
    'Crise',
    'Birra',
    'Agressividade',
    'Comportamento Repetitivo',
    'Dificuldade de Comunicação',
    'Interação Social Positiva',
    'Progresso',
    'Outro'
  ]

  const severityLevels = ['Normal', 'Médio', 'Alerta', 'Grave']

  useEffect(() => {
    loadReportData()
  }, [periodType, selectedMonth, selectedYear, customStartDate, customEndDate, eventTypeFilter, severityFilter])

  async function loadReportData() {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      
      // Buscar eventos do período
      const events = await fetchEventsForPeriod(startDate, endDate)
      
      // Processar dados para o relatório
      const processedData = processReportData(events, startDate, endDate)
      setReportData(processedData)
    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Erro ao carregar dados do relatório')
    } finally {
      setLoading(false)
    }
  }

  function getDateRange(): { startDate: Date; endDate: Date } {
    let startDate: Date
    let endDate: Date

    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0)
    } else if (periodType === 'year') {
      const year = parseInt(selectedYear)
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31)
    } else {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
    }

    return { startDate, endDate }
  }

  async function fetchEventsForPeriod(startDate: Date, endDate: Date): Promise<Event[]> {
    const allEvents: Event[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Buscar eventos mês a mês
    const currentDate = new Date(start)
    while (currentDate <= end) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const yearMonth = `${year}-${month}`
      
      try {
        const response = await fetch(
          `https://vgtgexfpklqiyctvupbf.supabase.co/functions/v1/make-server-a07d0a8e/events/${childId}/${yearMonth}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZndGdleGZwa2xxaXljdHZ1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MTMyMzYsImV4cCI6MjA1MDk4OTIzNn0.cImKo2y8VQjXZj1n9fZnEtIr6EYI7oO60FxqDNIx4Ic'}`,
              'Content-Type': 'application/json'
            }
          }
        )
        const data = await response.json()
        if (data.events) {
          allEvents.push(...data.events)
        }
      } catch (error) {
        console.error(`Error fetching events for ${yearMonth}:`, error)
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Filtrar eventos pelo intervalo de datas e filtros aplicados
    return allEvents.filter(event => {
      const eventDate = new Date(event.date)
      const inDateRange = eventDate >= start && eventDate <= end
      const matchesType = eventTypeFilter === 'all' || event.type === eventTypeFilter
      const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter
      
      return inDateRange && matchesType && matchesSeverity
    })
  }

  function processReportData(events: Event[], startDate: Date, endDate: Date): ReportData {
    // Total de eventos
    const totalEvents = events.length

    // Eventos por tipo
    const eventsByType: Record<string, number> = {}
    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    })

    // Eventos por severidade
    const eventsBySeverity: Record<string, number> = {}
    events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    })

    // Eventos por mês
    const eventsByMonth: Array<{ month: string; count: number }> = []
    const monthCounts: Record<string, number> = {}
    events.forEach(event => {
      const month = event.date.slice(0, 7) // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1
    })
    Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        eventsByMonth.push({ month, count })
      })

    // Eventos por semana (últimas 8 semanas)
    const eventsByWeek: Array<{ week: string; count: number }> = []
    const weekCounts: Record<string, number> = {}
    events.forEach(event => {
      const eventDate = new Date(event.date)
      const weekNumber = getWeekNumber(eventDate)
      const year = eventDate.getFullYear()
      const weekKey = `${year}-S${weekNumber}`
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1
    })
    Object.entries(weekCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .forEach(([week, count]) => {
        eventsByWeek.push({ week, count })
      })

    // Eventos por dia (últimos 30 dias)
    const eventsByDay: Array<{ day: string; count: number }> = []
    const dayCounts: Record<string, number> = {}
    events.forEach(event => {
      const day = event.date
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    Object.entries(dayCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .forEach(([day, count]) => {
        eventsByDay.push({ day: day.slice(5), count }) // MM-DD
      })

    // Análise de tendência
    const { trend, trendPercentage } = analyzeTrend(eventsByMonth)

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      eventsByMonth,
      eventsByWeek,
      eventsByDay,
      trend,
      trendPercentage,
      events
    }
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  function analyzeTrend(monthlyData: Array<{ month: string; count: number }>): { 
    trend: 'increasing' | 'decreasing' | 'stable'; 
    trendPercentage: number 
  } {
    if (monthlyData.length < 2) {
      return { trend: 'stable', trendPercentage: 0 }
    }

    const firstHalf = monthlyData.slice(0, Math.floor(monthlyData.length / 2))
    const secondHalf = monthlyData.slice(Math.floor(monthlyData.length / 2))

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.count, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.count, 0) / secondHalf.length

    const percentageChange = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100

    if (Math.abs(percentageChange) < 10) {
      return { trend: 'stable', trendPercentage: percentageChange }
    } else if (percentageChange > 0) {
      return { trend: 'increasing', trendPercentage: percentageChange }
    } else {
      return { trend: 'decreasing', trendPercentage: percentageChange }
    }
  }

  async function exportToPDF() {
    setExportingPDF(true)
    try {
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
      
      const element = document.getElementById('report-content')
      if (!element) {
        throw new Error('Report content not found')
      }

      // Capturar o conteúdo como imagem
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const filename = `relatorio_${childName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(filename)
      
      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Erro ao exportar PDF')
    } finally {
      setExportingPDF(false)
    }
  }

  const COLORS = ['#46B0FD', '#15C3D6', '#5C8599', '#22c55e', '#eab308', '#dc2626', '#9333ea', '#f97316']

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros do Relatório
          </CardTitle>
          <CardDescription>
            Selecione o período e os filtros desejados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de período */}
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="custom">Período Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de mês */}
          {periodType === 'month' && (
            <div className="space-y-2">
              <Label>Selecione o Mês</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          {/* Seleção de ano */}
          {periodType === 'year' && (
            <div className="space-y-2">
              <Label>Selecione o Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Período customizado */}
          {periodType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Filtro por tipo de evento */}
          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por severidade */}
          <div className="space-y-2">
            <Label>Severidade</Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {severityLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadReportData} disabled={loading} className="flex-1">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Relatório
            </Button>
            <Button 
              onClick={exportToPDF} 
              disabled={!reportData || exportingPDF}
              variant="secondary"
            >
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do relatório */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#46B0FD' }} />
          </CardContent>
        </Card>
      ) : reportData ? (
        <div id="report-content" className="space-y-6 bg-white p-6 rounded-lg">
          {/* Cabeçalho do Relatório */}
          <div className="text-center space-y-2 border-b pb-4">
            <h2 className="text-2xl" style={{ color: '#46B0FD' }}>Relatório de Eventos - {childName}</h2>
            <p className="text-sm text-muted-foreground">
              Período: {getDateRange().startDate.toLocaleDateString('pt-BR')} até {getDateRange().endDate.toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">
              Gerado em: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl" style={{ color: '#46B0FD' }}>
                  {reportData.totalEvents}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tendência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {reportData.trend === 'increasing' && (
                    <>
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                      <span className="text-2xl text-orange-500">
                        +{Math.abs(reportData.trendPercentage).toFixed(1)}%
                      </span>
                    </>
                  )}
                  {reportData.trend === 'decreasing' && (
                    <>
                      <TrendingDown className="w-6 h-6 text-green-500" />
                      <span className="text-2xl text-green-500">
                        {reportData.trendPercentage.toFixed(1)}%
                      </span>
                    </>
                  )}
                  {reportData.trend === 'stable' && (
                    <>
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                      <span className="text-2xl text-blue-500">Estável</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.trend === 'increasing' && 'Aumento na frequência'}
                  {reportData.trend === 'decreasing' && 'Redução na frequência'}
                  {reportData.trend === 'stable' && 'Frequência estável'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tipo Mais Comum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl" style={{ color: '#46B0FD' }}>
                  {Object.entries(reportData.eventsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.entries(reportData.eventsByType).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} ocorrências
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="types">Por Tipo</TabsTrigger>
              <TabsTrigger value="severity">Por Severidade</TabsTrigger>
              <TabsTrigger value="comparison">Comparação</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Frequência de Eventos ao Longo do Tempo</CardTitle>
                  <CardDescription>Visualização da distribuição temporal dos eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  {periodType === 'year' || reportData.eventsByMonth.length > 3 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={reportData.eventsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#46B0FD" 
                          fill="#46B0FD" 
                          fillOpacity={0.6}
                          name="Eventos"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.eventsByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#46B0FD" name="Eventos" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.eventsByType).map(([name, value]) => ({
                            name,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(reportData.eventsByType).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Eventos por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(reportData.eventsByType)
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#46B0FD" name="Quantidade" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="severity" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Severidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(reportData.eventsBySeverity).map(([name, value]) => ({
                            name,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(reportData.eventsBySeverity).map((entry, index) => {
                            const severityColors: Record<string, string> = {
                              'Normal': '#22c55e',
                              'Médio': '#9ca3af',
                              'Alerta': '#eab308',
                              'Grave': '#dc2626'
                            }
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={severityColors[entry[0]] || COLORS[index % COLORS.length]} 
                              />
                            )
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumo de Severidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {Object.entries(reportData.eventsBySeverity)
                          .sort(([,a], [,b]) => b - a)
                          .map(([severity, count]) => {
                            const severityColors: Record<string, string> = {
                              'Normal': '#22c55e',
                              'Médio': '#9ca3af',
                              'Alerta': '#eab308',
                              'Grave': '#dc2626'
                            }
                            return (
                              <div key={severity} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: severityColors[severity] || '#46B0FD' }}
                                  />
                                  <span>{severity}</span>
                                </div>
                                <Badge variant="secondary">{count} eventos</Badge>
                              </div>
                            )
                          })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Temporal</CardTitle>
                  <CardDescription>
                    Análise da evolução dos eventos ao longo do período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.eventsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#46B0FD" 
                        strokeWidth={2}
                        name="Eventos"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Insights:</h4>
                    <div className="space-y-2">
                      {reportData.trend === 'increasing' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm text-orange-900">
                            <strong>⚠️ Tendência de Aumento:</strong> Os eventos aumentaram em {Math.abs(reportData.trendPercentage).toFixed(1)}% 
                            no período analisado. Considere revisar as estratégias de intervenção com os profissionais.
                          </p>
                        </div>
                      )}
                      {reportData.trend === 'decreasing' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-900">
                            <strong>✅ Tendência Positiva:</strong> Os eventos diminuíram em {Math.abs(reportData.trendPercentage).toFixed(1)}% 
                            no período analisado. Continue com as estratégias atuais!
                          </p>
                        </div>
                      )}
                      {reportData.trend === 'stable' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900">
                            <strong>ℹ️ Tendência Estável:</strong> A frequência de eventos se manteve estável no período analisado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Tabela Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Estatístico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Métrica</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Total de Eventos</td>
                      <td className="text-right p-2">{reportData.totalEvents}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Média de Eventos por Mês</td>
                      <td className="text-right p-2">
                        {reportData.eventsByMonth.length > 0
                          ? (reportData.totalEvents / reportData.eventsByMonth.length).toFixed(1)
                          : '0'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Tipo Mais Frequente</td>
                      <td className="text-right p-2">
                        {Object.entries(reportData.eventsByType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Severidade Mais Comum</td>
                      <td className="text-right p-2">
                        {Object.entries(reportData.eventsBySeverity).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Variação da Tendência</td>
                      <td className="text-right p-2">
                        {reportData.trendPercentage > 0 ? '+' : ''}{reportData.trendPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um período e clique em "Atualizar Relatório" para visualizar os dados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
