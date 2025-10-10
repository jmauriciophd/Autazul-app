import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import logoImage from 'figma:asset/4808b01f93843e68942dc5705a8c21d55435df1b.png'
import backgroundImage from 'figma:asset/e42e586c023e98f242ba36ab0d21a55a8ab1b18c.png'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        if (!name) {
          setError('Por favor, insira seu nome')
          setLoading(false)
          return
        }
        await signUp(email, password, name)
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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
                : 'Crie sua conta como responsável'}
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
