import { useState, useEffect } from 'react'
import { useAuth } from '../utils/AuthContext'
import { api } from '../utils/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Heart, UserCheck, Loader2, Users, LogIn, UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface CoParentAcceptInviteProps {
  token: string
}

export function CoParentAcceptInvite({ token }: CoParentAcceptInviteProps) {
  const { signIn } = useAuth()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // For creating new account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  
  // For existing account login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [activeTab, setActiveTab] = useState('login')

  useEffect(() => {
    loadInvite()
  }, [token])

  async function loadInvite() {
    try {
      console.log('Loading co-parent invite with token:', token)
      const { invite: inviteData } = await api.getCoParentInvite(token)
      console.log('Co-parent invite loaded successfully:', inviteData)
      setInvite(inviteData)
      setEmail(inviteData.coParentEmail)
      setName(inviteData.coParentName)
    } catch (error: any) {
      console.error('Error loading co-parent invite - Full error:', error)
      console.error('Error message:', error.message)
      setError(`Convite inválido ou expirado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptWithNewAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      console.log('🆕 Criando nova conta e aceitando convite...')
      await api.acceptCoParentInvite(token, email, password, name)
      
      // Sign in after accepting
      console.log('🔐 Fazendo login com nova conta...')
      await signIn(email, password)
      
      setSuccess(true)
    } catch (err: any) {
      console.error('❌ Erro ao criar conta:', err)
      const errorMessage = err.message || err.error || 'Erro ao aceitar convite'
      
      // Tratar erro de email já existente
      if (errorMessage.includes('já existe') || errorMessage.includes('already registered')) {
        setError('Este email já possui uma conta. Use a aba "Já tenho conta" para fazer login.')
        setActiveTab('login')
        setLoginEmail(email)
      } else {
        setError(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAcceptWithExistingAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      console.log('🔐 Fazendo login com conta existente...')
      // First, sign in to get the token
      await signIn(loginEmail, loginPassword)
      
      console.log('✅ Login realizado, aceitando convite...')
      // Now accept the invitation with the logged-in user
      await api.acceptCoParentInviteByEmail(token)
      
      setSuccess(true)
    } catch (err: any) {
      console.error('❌ Erro ao fazer login ou aceitar:', err)
      const errorMessage = err.message || err.error || 'Erro ao aceitar convite'
      
      if (errorMessage.includes('Invalid login credentials') || 
          errorMessage.includes('Email ou senha incorretos')) {
        setError('Email ou senha incorretos. Verifique suas credenciais.')
      } else {
        setError(errorMessage)
      }
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
              <CardTitle className="text-3xl">Bem-vindo(a)!</CardTitle>
              <CardDescription>
                Você foi vinculado(a) com sucesso como co-responsável de {invite.childName}
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
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-3xl">Convite de Co-Responsável</CardTitle>
            <CardDescription>
              Você foi convidado(a) para ser co-responsável de {invite.childName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Convidado por:</span>
                <p>{invite.parentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Autista:</span>
                <p>{invite.childName}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="w-4 h-4" />
                Já tenho conta
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  ℹ️ Se você já possui uma conta no Autazul, faça login para aceitar o convite.
                </p>
              </div>
              
              <form onSubmit={handleAcceptWithExistingAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Senha</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Fazer Login e Aceitar Convite'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-900">
                  ℹ️ Crie uma nova conta para aceitar o convite e acessar o sistema.
                </p>
              </div>

              <form onSubmit={handleAcceptWithNewAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Seu nome completo"
                    autoComplete="name"
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
                    autoComplete="email"
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
                    autoComplete="new-password"
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
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Criar Conta e Aceitar Convite'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}