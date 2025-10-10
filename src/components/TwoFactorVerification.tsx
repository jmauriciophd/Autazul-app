import { useState } from 'react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { ShieldCheck, Mail } from 'lucide-react'

interface TwoFactorVerificationProps {
  open: boolean
  onVerified: () => void
  userEmail: string
}

export function TwoFactorVerification({ open, onVerified, userEmail }: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  async function handleSendCode() {
    setLoading(true)
    try {
      await api.generate2FACode()
      setCodeSent(true)
      notify.success('Código enviado!', 'Verifique seu email')
    } catch (error) {
      console.error('Error sending code:', error)
      notify.error('Erro', 'Não foi possível enviar o código')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.verify2FACode(verificationCode)
      notify.success('Verificado!', 'Código verificado com sucesso')
      onVerified()
    } catch (error: any) {
      console.error('Error verifying code:', error)
      notify.error('Código inválido', error.error || 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: '#15C3D6' }} />
            Verificação de Segurança
          </DialogTitle>
          <DialogDescription>
            Para sua segurança, precisamos verificar sua identidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!codeSent ? (
            <>
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  Enviaremos um código de verificação de 6 dígitos para seu email: 
                  <strong className="block mt-1">{userEmail}</strong>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm" style={{ color: '#5C8599' }}>
                  <strong>Por que isso é necessário?</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Você está acessando após 30 dias da última verificação</li>
                  <li>Ou está fazendo login após 6 meses de inatividade</li>
                </ul>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Enviar Código de Verificação'}
              </Button>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  Código enviado para <strong>{userEmail}</strong>
                  <br />
                  <span className="text-xs text-muted-foreground">O código expira em 10 minutos</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-3xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos enviado para seu email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verificando...' : 'Verificar e Continuar'}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={handleSendCode}
                disabled={loading}
              >
                Não recebeu o código? Reenviar
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
