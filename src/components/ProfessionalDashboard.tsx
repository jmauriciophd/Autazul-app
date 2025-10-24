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
import { EventCard } from './EventCard'
import { Footer } from './Footer'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar } from './ui/calendar'
import { Calendar as CalendarIcon, Users, FileText, Plus, LogOut, Shield, Crown, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
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
  professionalName: string
  creatorId?: string
  creatorName?: string
  creatorRole?: 'parent' | 'professional'
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
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
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
  }, [])

  useEffect(() => {
    if (selectedChild) {
      loadEvents()
    }
  }, [selectedChild, selectedDate])

  async function loadChildren() {
    try {
      const { children: childrenData } = await api.getChildrenForProfessional()
      setChildren(childrenData)
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  async function loadEvents() {
    if (!selectedChild) return
    try {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const yearMonth = `${year}-${month}`
      const { events: eventsData } = await api.getEvents(selectedChild.id, yearMonth)
      setEvents(eventsData)
    } catch (error) {
      console.error('Error loading events:', error)
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
      
      await loadEvents()
      setAddEventDialogOpen(false)
      
      // Reset form
      setSelectedChildId('')
      setEventType('')
      setEventDate('')
      setEventTime('')
      setEventDescription('')
      setEventSeverity('')
      setEventEvaluation('')
      
      notify.success('Evento cadastrado!', 'O evento foi registrado com sucesso')
    } catch (error) {
      console.error('Error adding event:', error)
      notify.error('Erro ao cadastrar evento', 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  const daysWithEvents = new Set(
    events.map(event => event.date)
  )

  const eventsForSelectedDate = events.filter(event => event.date === selectedDate.toISOString().split('T')[0])

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
              <CardContent className="space-y-3">
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
                  <>
                    <Select
                      value={selectedChild?.id}
                      onValueChange={(value) => {
                        const child = children.find(c => c.id === value)
                        setSelectedChild(child || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma criança" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedChild && (
                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={selectedChild.photo} alt={selectedChild.name} />
                              <AvatarFallback className="bg-purple-200 text-purple-700">
                                {selectedChild.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{selectedChild.name}</p>
                              <div className="space-y-1 mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Nascimento: {new Date(selectedChild.birthDate).toLocaleDateString('pt-BR')}
                                </p>
                                {selectedChild.school && (
                                  <p className="text-xs text-muted-foreground">
                                    Escola: {selectedChild.school}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
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
            {!selectedChild ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3>Nenhuma criança selecionada</h3>
                  <p className="text-muted-foreground mt-2">
                    Selecione uma criança para visualizar seus eventos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calendário de Eventos - {selectedChild.name}</CardTitle>
                    <CardDescription>
                      Clique em um dia para ver os eventos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                      modifiers={{
                        hasEvent: (date) => {
                          const dateStr = date.toISOString().split('T')[0]
                          return daysWithEvents.has(dateStr)
                        }
                      }}
                      modifiersClassNames={{
                        hasEvent: 'bg-blue-100 font-bold text-blue-900'
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Events List for Selected Date */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Eventos do dia {selectedDate.toLocaleDateString('pt-BR')}
                    </CardTitle>
                    <CardDescription>
                      {eventsForSelectedDate.length} evento(s) registrado(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {eventsForSelectedDate.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum evento registrado neste dia
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {eventsForSelectedDate.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                            severityColors={severityColors}
                            severityBackgroundColors={severityBackgroundColors}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o evento registrado
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{selectedEvent.type}</Badge>
                <Badge className={severityColors[selectedEvent.severity]}>
                  {selectedEvent.severity}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label>Data e Hora</Label>
                  <p>{new Date(selectedEvent.date).toLocaleDateString('pt-BR')} às {selectedEvent.time}</p>
                </div>
                <div>
                  <Label>Registrado por</Label>
                  <p>
                    {selectedEvent.creatorName || selectedEvent.professionalName}
                    {selectedEvent.creatorRole === 'professional' && selectedEvent.professionalId === user?.id && ' (Você)'}
                  </p>
                </div>
                <div>
                  <Label>Descrição do Ocorrido</Label>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
                <div>
                  <Label>Avaliação/Observações</Label>
                  <p className="text-sm">{selectedEvent.evaluation}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Security Settings */}
      <SecuritySettings
        open={securitySettingsOpen}
        onOpenChange={setSecuritySettingsOpen}
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}