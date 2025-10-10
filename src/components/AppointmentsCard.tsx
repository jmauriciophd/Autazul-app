import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface Appointment {
  id: string
  childId: string
  childName: string
  professionalId: string
  date: string
  time: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  requesterName: string
}

interface AppointmentsCardProps {
  userRole: 'parent' | 'professional'
  childId?: string
}

export function AppointmentsCard({ userRole, childId }: AppointmentsCardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [childId])

  async function loadAppointments() {
    try {
      setLoading(true)
      if (userRole === 'professional') {
        const { appointments: data } = await api.getAppointmentsForProfessional()
        setAppointments(data)
      } else if (childId) {
        const { appointments: data } = await api.getAppointmentsForChild(childId)
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(appointmentId: string, newStatus: string) {
    try {
      await api.updateAppointment(appointmentId, newStatus)
      notify.success('Status atualizado', 'O agendamento foi atualizado com sucesso')
      await loadAppointments()
    } catch (error) {
      console.error('Error updating appointment:', error)
      notify.error('Erro ao atualizar', 'Não foi possível atualizar o status')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Pendente
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="flex items-center gap-1 bg-blue-500">
            <CheckCircle className="w-3 h-3" />
            Confirmado
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="w-3 h-3" />
            Concluído
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== 'cancelled' && apt.status !== 'completed'
  )

  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'cancelled' || apt.status === 'completed'
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agenda de Atendimentos
        </CardTitle>
        <CardDescription>
          {userRole === 'professional'
            ? 'Gerenciar seus atendimentos agendados'
            : 'Atendimentos agendados'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h4 className="mb-3">Próximos Atendimentos</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{appointment.childName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(appointment.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {appointment.time}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">{getStatusBadge(appointment.status)}</div>
                        </div>

                        {userRole === 'professional' && appointment.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                            >
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}

                        {userRole === 'professional' && appointment.status === 'confirmed' && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                            >
                              Marcar como Concluído
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h4 className="mb-3">Histórico</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 border rounded-lg bg-muted/50 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-3 h-3" />
                              <span>{appointment.childName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
