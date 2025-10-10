import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import { notify, messages } from '../utils/notifications'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Calendar } from './ui/calendar'
import { Heart, LogOut, Plus, UserPlus, Users, Trash2, Copy, Check, Calendar as CalendarIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { EventStats } from './EventStats'
import { EventCard } from './EventCard'

interface Child {
  id: string
  name: string
  birthDate: string
  parentId: string
}

interface Professional {
  id: string
  name: string
  email: string
  type: string
  linkedAt: string
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
  photos?: string[]
}

export function ParentDashboard() {
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Dialog states
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false)
  const [addProfessionalDialogOpen, setAddProfessionalDialogOpen] = useState(false)
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false)
  const [inviteUrlDialog, setInviteUrlDialog] = useState<{ open: boolean; url: string }>({ open: false, url: '' })
  const [copied, setCopied] = useState(false)

  // Form states
  const [childName, setChildName] = useState('')
  const [childBirthDate, setChildBirthDate] = useState('')
  const [professionalName, setProfessionalName] = useState('')
  const [professionalEmail, setProfessionalEmail] = useState('')
  const [professionalType, setProfessionalType] = useState('')
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
      loadProfessionals()
      loadEvents()
    }
  }, [selectedChild, selectedDate])

  async function loadChildren() {
    try {
      const { children: childrenData } = await api.getChildren()
      setChildren(childrenData)
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0])
      }
    } catch (error) {
      console.error('Error loading children:', error)
    }
  }

  async function loadProfessionals() {
    if (!selectedChild) return
    try {
      const { professionals: professionalsData } = await api.getProfessionalsForChild(selectedChild.id)
      setProfessionals(professionalsData)
    } catch (error) {
      console.error('Error loading professionals:', error)
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

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createChild(childName, childBirthDate)
      await loadChildren()
      setAddChildDialogOpen(false)
      setChildName('')
      setChildBirthDate('')
      notify.success(messages.child.addSuccess, `${childName} foi adicionado ao sistema`)
    } catch (error) {
      console.error('Error adding child:', error)
      notify.error(messages.child.addError, 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddProfessional(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedChild) return
    setLoading(true)
    try {
      const { inviteUrl } = await api.createProfessionalInvite(
        selectedChild.id,
        professionalName,
        professionalEmail,
        professionalType
      )
      setInviteUrlDialog({ open: true, url: inviteUrl })
      await loadProfessionals()
      setAddProfessionalDialogOpen(false)
      setProfessionalName('')
      setProfessionalEmail('')
      setProfessionalType('')
      notify.success(messages.professional.inviteSuccess, 'Compartilhe o link com o profissional')
    } catch (error) {
      console.error('Error adding professional:', error)
      notify.error(messages.professional.inviteError, 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveProfessional(professionalId: string) {
    if (!selectedChild) return
    if (!confirm('Tem certeza que deseja remover este profissional?')) return
    
    try {
      await api.removeProfessional(selectedChild.id, professionalId)
      await loadProfessionals()
      notify.success(messages.professional.removeSuccess)
    } catch (error) {
      console.error('Error removing professional:', error)
      notify.error(messages.professional.removeError, 'Tente novamente')
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedChild) return
    setLoading(true)
    
    try {
      await api.createEvent({
        childId: selectedChild.id,
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
      setEventType('')
      setEventDate('')
      setEventTime('')
      setEventDescription('')
      setEventSeverity('')
      setEventEvaluation('')
      
      notify.success(messages.event.addSuccess, 'Evento registrado com sucesso!')
    } catch (error) {
      console.error('Error adding event:', error)
      notify.error(messages.event.addError, 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify.success(messages.general.copySuccess)
  }

  const daysWithEvents = new Set(
    events.map(event => event.date)
  )

  const eventsForSelectedDate = events.filter(event => event.date === selectedDate.toISOString().split('T')[0])

  const severityColors: Record<string, string> = {
    'Baixa': 'bg-green-100 text-green-800 border-green-200',
    'Média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Alta': 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl">Autazul</h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Child Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Filhos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {children.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum filho cadastrado ainda
                  </p>
                ) : (
                  <Select
                    value={selectedChild?.id}
                    onValueChange={(value) => {
                      const child = children.find(c => c.id === value)
                      setSelectedChild(child || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um filho" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Dialog open={addChildDialogOpen} onOpenChange={setAddChildDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Filho
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Filho</DialogTitle>
                      <DialogDescription>
                        Cadastre um novo filho no sistema
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddChild} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="childName">Nome</Label>
                        <Input
                          id="childName"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          required
                          placeholder="Nome do filho"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="childBirthDate">Data de Nascimento</Label>
                        <Input
                          id="childBirthDate"
                          type="date"
                          value={childBirthDate}
                          onChange={(e) => setChildBirthDate(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Professionals */}
            {selectedChild && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Profissionais
                  </CardTitle>
                  <CardDescription>
                    {professionals.length} profissional(is) vinculado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-[300px]">
                    {professionals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum profissional cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {professionals.map((prof) => (
                          <div key={prof.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{prof.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{prof.type}</p>
                              <p className="text-xs text-muted-foreground truncate">{prof.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProfessional(prof.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <Dialog open={addProfessionalDialogOpen} onOpenChange={setAddProfessionalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Profissional
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Profissional</DialogTitle>
                        <DialogDescription>
                          Gere um link único para o profissional se cadastrar
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProfessional} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="professionalName">Nome</Label>
                          <Input
                            id="professionalName"
                            value={professionalName}
                            onChange={(e) => setProfessionalName(e.target.value)}
                            required
                            placeholder="Nome do profissional"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="professionalEmail">Email</Label>
                          <Input
                            id="professionalEmail"
                            type="email"
                            value={professionalEmail}
                            onChange={(e) => setProfessionalEmail(e.target.value)}
                            required
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="professionalType">Tipo</Label>
                          <Select value={professionalType} onValueChange={setProfessionalType} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Professor(a)">Professor(a)</SelectItem>
                              <SelectItem value="Monitor(a)">Monitor(a)</SelectItem>
                              <SelectItem value="Psicólogo(a)">Psicólogo(a)</SelectItem>
                              <SelectItem value="Médico(a)">Médico(a)</SelectItem>
                              <SelectItem value="Neurologista">Neurologista</SelectItem>
                              <SelectItem value="Fonoaudiólogo(a)">Fonoaudiólogo(a)</SelectItem>
                              <SelectItem value="Terapeuta Ocupacional">Terapeuta Ocupacional</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Gerando...' : 'Gerar Link de Convite'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedChild ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3>Nenhum filho selecionado</h3>
                  <p className="text-muted-foreground mt-2">
                    Adicione um filho para começar a visualizar eventos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Statistics */}
                <EventStats events={events} />

                {/* Add Event Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Registrar Evento</CardTitle>
                        <CardDescription>
                          Registre eventos importantes que acontecem com {selectedChild.name}
                        </CardDescription>
                      </div>
                      <Dialog open={addEventDialogOpen} onOpenChange={setAddEventDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Evento
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Cadastrar Novo Evento</DialogTitle>
                            <DialogDescription>
                              Registre um evento ou observação importante sobre {selectedChild.name}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddEvent} className="space-y-4">
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
                                  <SelectItem value="Alimentação">Alimentação</SelectItem>
                                  <SelectItem value="Sono">Sono</SelectItem>
                                  <SelectItem value="Higiene">Higiene</SelectItem>
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
                              <Label htmlFor="eventSeverity">Gravidade/Intensidade *</Label>
                              <Select value={eventSeverity} onValueChange={setEventSeverity} required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a gravidade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Baixa">Baixa - Situação tranquila</SelectItem>
                                  <SelectItem value="Média">Média - Requer atenção</SelectItem>
                                  <SelectItem value="Alta">Alta - Situação crítica</SelectItem>
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
                                placeholder="Descreva o que aconteceu, onde estava, o que estava fazendo..."
                                rows={4}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="eventEvaluation">Observações Adicionais *</Label>
                              <Textarea
                                id="eventEvaluation"
                                value={eventEvaluation}
                                onChange={(e) => setEventEvaluation(e.target.value)}
                                required
                                placeholder="Como você reagiu? Como a criança respondeu? Outras observações importantes..."
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
                    </div>
                  </CardHeader>
                </Card>

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

                {/* Events List */}
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
                    {selectedEvent.creatorRole === 'parent' && ' (Você)'}
                  </p>
                </div>
                <div>
                  <Label>Descrição do Ocorrido</Label>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
                <div>
                  <Label>Observações Adicionais</Label>
                  <p className="text-sm">{selectedEvent.evaluation}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite URL Dialog */}
      <Dialog open={inviteUrlDialog.open} onOpenChange={(open) => setInviteUrlDialog({ ...inviteUrlDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite Gerado</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o profissional para que ele possa se cadastrar e vincular-se ao autista
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg break-all text-sm">
              {inviteUrlDialog.url}
            </div>
            <Button
              onClick={() => copyToClipboard(inviteUrlDialog.url)}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
