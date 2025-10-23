import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Users, Stethoscope } from 'lucide-react'
import { autazulLogo, loginBackground } from '../assets/logo'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [profileType, setProfileType] = useState<'parent' | 'professional'>('parent')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasChildren, setHasChildren] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Salvar perfil selecionado antes do login
        localStorage.setItem('selectedProfile', profileType)
        await signIn(email, password)
      } else {
        if (!name) {
          setError('Por favor, insira seu nome')
          setLoading(false)
          return
        }
        // Sempre criar como parent no signup
        await signUp(email, password, name, 'parent')
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Verificar se usuário tem crianças cadastradas (só no login)
  async function checkUserHasChildren(userEmail: string) {
    try {
      setCheckingProfile(true)
      // Aqui faremos uma chamada temporária para verificar
      // Por enquanto, vamos permitir a seleção e verificar no backend
      setHasChildren(true) // Placeholder
    } catch (error) {
      console.error('Error checking children:', error)
      setHasChildren(false)
    } finally {
      setCheckingProfile(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#EBF2F5'
      }}
    >
      {/* Overlay for transparency */}
      <div className="absolute inset-0 bg-white/97"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2" style={{ borderColor: '#15C3D6' }}>
        <CardHeader className="space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="w-28 h-28 flex items-center justify-center">
              <img src={autazulLogo} alt="Autazul Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="mb-2" style={{ 
              fontFamily: "'Roboto Condensed', sans-serif",
              color: '#46B0FD',
              fontWeight: 700,
              fontSize: '4.5rem',
              lineHeight: '1'
            }}>
              Autazul
            </h1>
            <CardDescription className="text-base" style={{ color: '#5C8599' }}>
              {isLogin
                ? 'Entre na sua conta'
                : 'Crie sua conta como Pai/Responsável'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: '#373737' }}>Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="SEU NOME COMPLETO"
                  className="bg-white border-2"
                  style={{ borderColor: '#BDBCBC' }}
                />
              </div>
            )}
            
            {isLogin && (
              <div className="space-y-3">
                <Label style={{ color: '#373737' }}>Acessar como</Label>
                <RadioGroup value={profileType} onValueChange={(value) => setProfileType(value as 'parent' | 'professional')}>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        profileType === 'parent' ? 'border-[#15C3D6] bg-blue-50' : 'border-[#BDBCBC] bg-white'
                      }`}
                      onClick={() => setProfileType('parent')}
                    >
                      <RadioGroupItem value="parent" id="parent" className="sr-only" />
                      <Users className="w-5 h-5" style={{ color: profileType === 'parent' ? '#15C3D6' : '#5C8599' }} />
                      <Label htmlFor="parent" className="cursor-pointer flex-1 text-sm" style={{ color: '#373737' }}>
                        Pai/Responsável
                      </Label>
                    </div>
                    
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        profileType === 'professional' ? 'border-[#15C3D6] bg-blue-50' : 'border-[#BDBCBC] bg-white'
                      }`}
                      onClick={() => setProfileType('professional')}
                    >
                      <RadioGroupItem value="professional" id="professional" className="sr-only" />
                      <Stethoscope className="w-5 h-5" style={{ color: profileType === 'professional' ? '#15C3D6' : '#5C8599' }} />
                      <Label htmlFor="professional" className="cursor-pointer flex-1 text-sm" style={{ color: '#373737' }}>
                        Profissional
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                <p className="text-xs" style={{ color: '#5C8599' }}>
                  {profileType === 'parent' 
                    ? 'Acesse o painel de pais/responsáveis'
                    : 'Acesse o painel de profissionais'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: '#373737' }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="SEU@EMAIL.COM"
                className="bg-white border-2"
                style={{ borderColor: '#BDBCBC' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: '#373737' }}>Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="bg-white border-2"
                style={{ borderColor: '#BDBCBC' }}
              />
            </div>
            {error && (
              <div className="text-white text-sm p-3 rounded-lg" style={{ backgroundColor: '#dc2626' }}>
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full text-white hover:opacity-90" 
              disabled={loading}
              style={{ 
                backgroundColor: '#15C3D6',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700
              }}
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              style={{ 
                color: '#5C8599',
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              {isLogin
                ? 'Não tem conta? Cadastre-se'
                : 'Já tem conta? Entre'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}