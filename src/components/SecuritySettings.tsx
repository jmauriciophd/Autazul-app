import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import { notify } from '../utils/notifications'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { Lock, ShieldCheck, Key, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { Separator } from './ui/separator'

interface SecuritySettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SecuritySettings({ open, onOpenChange }: SecuritySettingsProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  useEffect(() => {
    if (open) {
      loadUserSettings()
    }
  }, [open])

  useEffect(() => {
    validatePassword(newPassword)
  }, [newPassword])

  async function loadUserSettings() {
    try {
      // Load user data to check 2FA status
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setTwoFactorEnabled(userData.twoFactorEnabled || false)
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }

  function validatePassword(password: string) {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  function isPasswordValid(): boolean {
    return Object.values(passwordValidation).every(v => v === true)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      notify.error('Senhas não coincidem', 'A nova senha e a confirmação devem ser iguais')
      return
    }

    if (!isPasswordValid()) {
      notify.error('Senha inválida', 'A senha não atende aos critérios de segurança')
      return
    }

    setLoading(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      notify.success('Senha alterada!', 'Sua senha foi atualizada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      notify.error('Erro ao alterar senha', error.error || 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle2FA(enabled: boolean) {
    setLoading(true)
    try {
      await api.toggle2FA(enabled)
      setTwoFactorEnabled(enabled)
      
      // Update user data in localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      userData.twoFactorEnabled = enabled
      localStorage.setItem('user', JSON.stringify(userData))
      
      if (enabled) {
        notify.success('2FA Ativado', 'Autenticação de dois fatores ativada com sucesso')
      } else {
        notify.success('2FA Desativado', 'Autenticação de dois fatores desativada')
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error)
      notify.error('Erro', 'Não foi possível alterar a configuração de 2FA')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendVerificationCode() {
    setLoading(true)
    try {
      await api.generate2FACode()
      setCodeSent(true)
      notify.success('Código enviado!', 'Verifique seu email')
    } catch (error) {
      console.error('Error sending verification code:', error)
      notify.error('Erro', 'Não foi possível enviar o código')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.verify2FACode(verificationCode)
      notify.success('Código verificado!', 'Verificação concluída com sucesso')
      setVerificationCode('')
      setCodeSent(false)
    } catch (error: any) {
      console.error('Error verifying code:', error)
      notify.error('Código inválido', error.error || 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={valid ? 'text-green-600' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Configurações de Segurança
          </DialogTitle>
          <DialogDescription>
            Gerencie sua senha e autenticação de dois fatores
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </TabsTrigger>
            <TabsTrigger value="2fa">
              <Key className="w-4 h-4 mr-2" />
              Autenticação 2FA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Digite sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirme sua nova senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {newPassword && (
                    <Alert>
                      <AlertDescription>
                        <p className="font-semibold mb-2">Critérios de segurança:</p>
                        <div className="space-y-1">
                          <ValidationItem
                            valid={passwordValidation.minLength}
                            text="Mínimo de 8 caracteres"
                          />
                          <ValidationItem
                            valid={passwordValidation.hasUpperCase}
                            text="Pelo menos uma letra maiúscula"
                          />
                          <ValidationItem
                            valid={passwordValidation.hasLowerCase}
                            text="Pelo menos uma letra minúscula"
                          />
                          <ValidationItem
                            valid={passwordValidation.hasNumber}
                            text="Pelo menos um número"
                          />
                          <ValidationItem
                            valid={passwordValidation.hasSpecialChar}
                            text="Pelo menos um caractere especial (!@#$%^&*)"
                          />
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !isPasswordValid() || newPassword !== confirmPassword}
                  >
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2fa" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
                <CardDescription>
                  Adicione uma camada extra de segurança à sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium" style={{ color: '#5C8599' }}>
                      Ativar Autenticação 2FA
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Você será solicitado a verificar sua identidade a cada 30 dias ou após 6 meses sem login
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                    disabled={loading}
                  />
                </div>

                {twoFactorEnabled && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium" style={{ color: '#5C8599' }}>
                        Testar Verificação
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Envie um código de verificação para seu email para testar o sistema 2FA
                      </p>

                      {!codeSent ? (
                        <Button
                          onClick={handleSendVerificationCode}
                          disabled={loading}
                          variant="outline"
                          className="w-full"
                        >
                          {loading ? 'Enviando...' : 'Enviar Código de Verificação'}
                        </Button>
                      ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                          <Alert>
                            <AlertDescription>
                              Um código de 6 dígitos foi enviado para <strong>{user?.email}</strong>
                            </AlertDescription>
                          </Alert>
                          
                          <div className="space-y-2">
                            <Label htmlFor="verificationCode">Código de Verificação</Label>
                            <Input
                              id="verificationCode"
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              required
                              placeholder="000000"
                              maxLength={6}
                              className="text-center text-2xl tracking-widest"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setCodeSent(false)
                                setVerificationCode('')
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1"
                              disabled={loading || verificationCode.length !== 6}
                            >
                              {loading ? 'Verificando...' : 'Verificar Código'}
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="link"
                            className="w-full text-sm"
                            onClick={handleSendVerificationCode}
                            disabled={loading}
                          >
                            Reenviar código
                          </Button>
                        </form>
                      )}
                    </div>
                  </>
                )}

                <Alert>
                  <ShieldCheck className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Dica de Segurança:</strong> Sempre mantenha seu email atualizado e seguro, 
                    pois ele será usado para verificação de dois fatores.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}