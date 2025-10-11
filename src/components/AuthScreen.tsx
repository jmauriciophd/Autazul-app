import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
<<<<<<< HEAD
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Users, Stethoscope } from 'lucide-react'
=======
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
import logoImage from 'figma:asset/4808b01f93843e68942dc5705a8c21d55435df1b.png'
import backgroundImage from 'figma:asset/e42e586c023e98f242ba36ab0d21a55a8ab1b18c.png'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
<<<<<<< HEAD
  const [profileType, setProfileType] = useState<'parent' | 'professional'>('parent')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasChildren, setHasChildren] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)
=======
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
<<<<<<< HEAD
        // Salvar perfil selecionado antes do login
        localStorage.setItem('selectedProfile', profileType)
=======
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
        await signIn(email, password)
      } else {
        if (!name) {
          setError('Por favor, insira seu nome')
          setLoading(false)
          return
        }
<<<<<<< HEAD
        // Sempre criar como parent no signup
        await signUp(email, password, name, 'parent')
=======
        await signUp(email, password, name)
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
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

=======
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for transparency */}
      <div className="absolute inset-0 bg-white/97"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2" style={{ borderColor: '#15C3D6' }}>
        <CardHeader className="space-y-6 pb-8">
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="Autazul Logo" 
              className="w-28 h-28 object-contain"
            />
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
<<<<<<< HEAD
                : 'Crie sua conta como Pai/Responsável'}
=======
                : 'Crie sua conta como responsável'}
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
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
<<<<<<< HEAD
            
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
=======
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
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
