import { useState, useEffect } from 'react'
import { useAuth } from '../utils'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { autazulLogo } from '../assets/logo'
import { NotificationsPopover } from './NotificationsPopover'
import { FeedbackDialog } from './FeedbackDialog'
import { SecuritySettings } from './SecuritySettings'
import { AdminPanel } from './AdminPanel'
import { ProfileSwitcher } from './ProfileSwitcher'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { AppointmentsCard } from './AppointmentsCard'
import { AdBanner } from './AdBanner'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Calendar as CalendarIcon, Users, FileText, Plus, LogOut, Shield, Crown, Clock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

// Componente do Dashboard do Profissional
interface Child {
  id: string
  name: string
  birthDate: string
  photo?: string
  school?: string
  parentId: string
}

interface Event {
  id: string
  childId: string
  professionalId: string
  type: string
  date: string
  time: string
  description: string
  severity: string
  evaluation: string
}

export function ProfessionalDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false)
  const [securitySettingsOpen, setSecuritySettingsOpen] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [selectedChildId, setSelectedChildId] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventSeverity, setEventSeverity] = useState('')
  const [eventEvaluation, setEventEvaluation] = useState('')

  useEffect(() => {
    loadChildren()
    loadRecentEvents()
  }, [])

  async function loadChildren() {
    try {
      const { children: childrenData } = await api.getChildrenForProfessional()
      setChildren(childrenData)
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  async function loadRecentEvents() {
    try {
      // Load recent events for current month
      const now = new Date()
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      
      const allEvents: Event[] = []
      for (const child of children) {
        const { events: childEvents } = await api.getEvents(child.id, yearMonth)
        allEvents.push(...childEvents)
      }
      
      // Sort by date descending
      allEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateB.getTime() - dateA.getTime()
      })
      
      setEvents(allEvents.slice(0, 10)) // Show last 10 events
    } catch (error) {
      console.error('Error loading recent events:', error)
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      await api.createEvent({
        childId: selectedChildId,
        type: eventType,
        date: eventDate,
        time: eventTime,
        description: eventDescription,
        severity: eventSeverity,
        evaluation: eventEvaluation,
      })
      
      await loadRecentEvents()
      setAddEventDialogOpen(false)
      
      // Reset form
      setSelectedChildId('')
      setEventType('')
      setEventDate('')
      setEventTime('')
      setEventDescription('')
      setEventSeverity('')
      setEventEvaluation('')
    } catch (error) {
      console.error('Error adding event:', error)
      alert('Erro ao cadastrar evento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const severityColors: Record<string, string> = {
    'Normal': 'text-white border-green-500',
    'Médio': 'text-white border-gray-400',
    'Alerta': 'text-white border-yellow-500',
    'Grave': 'text-white border-red-600',
    // Legacy support
    'Baixa': 'text-white border-green-500',
    'Média': 'text-white border-yellow-500',
    'Alta': 'text-white border-red-600',
  }
  
  const severityBackgroundColors: Record<string, string> = {
    'Normal': '#22c55e',
    'Médio': '#9ca3af',
    'Alerta': '#eab308',
    'Grave': '#dc2626',
    // Legacy support
    'Baixa': '#22c55e',
    'Média': '#eab308',
    'Alta': '#dc2626',
  }

  // Show admin panel if user is admin and flag is set
  if (showAdminPanel && user?.isAdmin) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#EBF2F5' }}>
        <header style={{ backgroundColor: '#46B0FD' }}>
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#46B0FD' }}>
                <img src={autazulLogo} alt="Autazul Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl" style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#ffffff' }}>Autazul - Admin</h1>
                <p className="text-sm" style={{ color: '#ffffff', opacity: 0.9 }}>Painel Administrativo</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setShowAdminPanel(false)}
              style={{ color: '#ffffff' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </header>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header className="bg-white border-b shadow-sm" style={{ borderColor: '#15C3D6' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#46B0FD' }}>
              <img src={autazulLogo} alt="Autazul Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl" style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#46B0FD' }}>Autazul - Profissional</h1>
              <p className="text-sm" style={{ color: '#5C8599' }}>Olá, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher />
            <FeedbackDialog />
            <NotificationsPopover />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSecuritySettingsOpen(true)}
              title="Configurações de Segurança"
            >
              <Shield className="w-5 h-5" style={{ color: '#5C8599' }} />
            </Button>
            {user?.isAdmin && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAdminPanel(true)}
                title="Painel Administrativo"
                style={{ color: '#eab308' }}
              >
                <Crown className="w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={signOut}
              style={{ color: '#5C8599' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Children List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Autistas Vinculados</CardTitle>
                <CardDescription>
                  {children.length} criança(s) sob seus cuidados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Você ainda não está vinculado a nenhum autista.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Aguarde o convite dos responsáveis.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {children.map((child) => (
                        <Card key={child.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={child.photo} alt={child.name} />
                                <AvatarFallback className="bg-purple-200 text-purple-700">
                                  {child.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p>{child.name}</p>
                                <div className="space-y-1 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    Nascimento: {new Date(child.birthDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  {child.school && (
                                    <p className="text-xs text-muted-foreground">
                                      Escola: {child.school}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Event Registration and History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Event Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cadastrar Evento</span>
                  <Dialog open={addEventDialogOpen} onOpenChange={setAddEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={children.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Evento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Novo Evento</DialogTitle>
                        <DialogDescription>
                          Registre um evento relacionado ao autista
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddEvent} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="childSelect">Autista *</Label>
                          <Select value={selectedChildId} onValueChange={setSelectedChildId} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o autista" />
                            </SelectTrigger>
                            <SelectContent>
                              {children.map((child) => (
                                <SelectItem key={child.id} value={child.id}>
                                  {child.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="eventType">Tipo de Evento *</Label>
                          <Select value={eventType} onValueChange={setEventType} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Comportamental">Comportamental</SelectItem>
                              <SelectItem value="Acadêmico">Acadêmico</SelectItem>
                              <SelectItem value="Social">Social</SelectItem>
                              <SelectItem value="Sensorial">Sensorial</SelectItem>
                              <SelectItem value="Comunicação">Comunicação</SelectItem>
                              <SelectItem value="Saúde">Saúde</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="eventDate">Data *</Label>
                            <Input
                              id="eventDate"
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              required
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="eventTime">Hora *</Label>
                            <Input
                              id="eventTime"
                              type="time"
                              value={eventTime}
                              onChange={(e) => setEventTime(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="eventSeverity">Gravidade do Evento *</Label>
                          <Select value={eventSeverity} onValueChange={setEventSeverity} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a gravidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Baixa">Baixa</SelectItem>
                              <SelectItem value="Média">Média</SelectItem>
                              <SelectItem value="Alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="eventDescription">Descrição do Ocorrido *</Label>
                          <Textarea
                            id="eventDescription"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            required
                            placeholder="Descreva o que aconteceu..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="eventEvaluation">Avaliação do Profissional *</Label>
                          <Textarea
                            id="eventEvaluation"
                            value={eventEvaluation}
                            onChange={(e) => setEventEvaluation(e.target.value)}
                            required
                            placeholder="Sua avaliação sobre o ocorrido, recomendações, observações..."
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setAddEventDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? 'Salvando...' : 'Cadastrar Evento'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  Registre eventos e observações importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Você precisa estar vinculado a um autista para cadastrar eventos
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-muted-foreground">Eventos Hoje</p>
                        <p className="text-2xl">
                          {events.filter(e => e.date === new Date().toISOString().split('T')[0]).length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-green-600 rounded-full flex items-center justify-center text-white">
                          ↓
                        </div>
                        <p className="text-sm text-muted-foreground">Baixa</p>
                        <p className="text-2xl">
                          {events.filter(e => e.severity === 'Baixa').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4 text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-yellow-600 rounded-full flex items-center justify-center text-white">
                          ~
                        </div>
                        <p className="text-sm text-muted-foreground">Média</p>
                        <p className="text-2xl">
                          {events.filter(e => e.severity === 'Média').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-red-600 rounded-full flex items-center justify-center text-white">
                          ↑
                        </div>
                        <p className="text-sm text-muted-foreground">Alta</p>
                        <p className="text-2xl">
                          {events.filter(e => e.severity === 'Alta').length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos Recentes</CardTitle>
                <CardDescription>
                  Últimos 10 eventos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum evento registrado ainda
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {events.map((event) => {
                        const child = children.find(c => c.id === event.childId)
                        return (
                          <Card key={event.id} className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex gap-2">
                                  <Badge variant="outline">{event.type}</Badge>
                                  <Badge className={severityColors[event.severity]}>
                                    {event.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(event.date).toLocaleDateString('pt-BR')} • {event.time}
                                </p>
                              </div>
                              <p className="text-sm mb-1">{child?.name}</p>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <SecuritySettings
        open={securitySettingsOpen}
        onOpenChange={setSecuritySettingsOpen}
      />
    </div>
  )
}