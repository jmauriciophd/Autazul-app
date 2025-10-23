import { useState, useEffect } from 'react'
import { useAuth } from '../utils'
import { api } from '../utils/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Heart, UserCheck, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

interface ProfessionalAcceptInviteProps {
  token: string
}

export function ProfessionalAcceptInvite({ token }: ProfessionalAcceptInviteProps) {
  const { signIn } = useAuth()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    loadInvite()
  }, [token])

  async function loadInvite() {
    try {
      console.log('Loading invite with token:', token)
      const { invite: inviteData } = await api.getInvite(token)
      console.log('Invite loaded successfully:', inviteData)
      setInvite(inviteData)
      setEmail(inviteData.professionalEmail)
      setName(inviteData.professionalName)
    } catch (error: any) {
      console.error('Error loading invite - Full error:', error)
      console.error('Error message:', error.message)
      setError(`Convite inválido ou expirado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.acceptInvite(token, email, password, name)
      
      // Sign in after accepting
      await signIn(email, password)
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao aceitar convite. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardContent className="py-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Carregando convite...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" fill="white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl">Autazul</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Convite não encontrado'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl">Bem-vindo!</CardTitle>
              <CardDescription>
                Você foi vinculado com sucesso ao autista {invite.childName}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Redirecionando para o painel...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-3xl">Convite Profissional</CardTitle>
            <CardDescription>
              Você foi convidado para acompanhar {invite.childName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Responsável:</span>
                <p>{invite.parentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Autista:</span>
                <p>{invite.childName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Função:</span>
                <p>{invite.professionalType}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Crie uma senha (mínimo 6 caracteres)"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Crie uma senha segura para acessar o sistema
              </p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Processando...' : 'Aceitar Convite e Criar Conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}