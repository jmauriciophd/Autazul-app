import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './utils'
import { AuthScreen } from './components/AuthScreen'
import { ParentDashboard } from './components/ParentDashboard'
import { ProfessionalDashboard } from './components/ProfessionalDashboard'
import { ProfessionalAcceptInvite } from './components/ProfessionalAcceptInvite'
import { CoParentAcceptInvite } from './components/CoParentAcceptInvite'
import { AdminPanel } from './components/AdminPanel'
import { MobileDetector } from './components/MobileDetector'
import { Toaster } from './components/ui/sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog'
import { ScrollArea } from './components/ui/scroll-area'

function AppContent() {
  const { user, loading } = useAuth()
  const [professionalInviteToken, setProfessionalInviteToken] = useState<string | null>(null)
  const [coParentInviteToken, setCoParentInviteToken] = useState<string | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  useEffect(() => {
    // Check if URL has invite token (supports both pathname and hash routing)
    const path = window.location.pathname
    const hash = window.location.hash
    
    console.log('Checking for invite token - pathname:', path, 'hash:', hash)
    
    // Check for privacy policy
    if (hash.includes('/privacy')) {
      console.log('Privacy policy requested')
      setShowPrivacyModal(true)
      // Clear hash to prevent showing again on reload
      window.history.replaceState(null, '', window.location.pathname)
      return
    }
    
    // Check for terms of use
    if (hash.includes('/terms')) {
      console.log('Terms of use requested')
      setShowTermsModal(true)
      // Clear hash to prevent showing again on reload
      window.history.replaceState(null, '', window.location.pathname)
      return
    }
    
    // Check for professional invite
    let match = path.match(/\/professional\/accept\/([a-f0-9]+)/)
    if (!match && hash) {
      match = hash.match(/\/professional\/accept\/([a-f0-9]+)/)
    }
    if (match && match[1]) {
      console.log('Found professional invite token:', match[1])
      setProfessionalInviteToken(match[1])
      return
    }

    // Check for co-parent invite
    match = path.match(/\/coparent\/accept\/([a-f0-9]+)/)
    if (!match && hash) {
      match = hash.match(/\/coparent\/accept\/([a-f0-9]+)/)
    }
    if (match && match[1]) {
      console.log('Found co-parent invite token:', match[1])
      setCoParentInviteToken(match[1])
      return
    }

    // Check for admin panel
    if (path.includes('/admin') || hash.includes('/admin')) {
      console.log('Admin panel requested')
      setShowAdminPanel(true)
      return
    }
    
    console.log('No special route found in URL')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // If there's a professional invite token and no user, show invite acceptance
  if (professionalInviteToken && !user) {
    return <ProfessionalAcceptInvite token={professionalInviteToken} />
  }

  // If there's a co-parent invite token and no user, show invite acceptance
  if (coParentInviteToken && !user) {
    return <CoParentAcceptInvite token={coParentInviteToken} />
  }

  // If admin panel is requested and user is authenticated, check if admin
  if (showAdminPanel && user) {
    // Admin check is done by server via environment variables
    if (user.isAdmin) {
      return <AdminPanel />
    }
  }

  // If not authenticated, show auth screen (with modals available)
  if (!user) {
    return (
      <>
        <AuthScreen />
        <PrivacyAndTermsModals 
          showPrivacy={showPrivacyModal} 
          setShowPrivacy={setShowPrivacyModal}
          showTerms={showTermsModal}
          setShowTerms={setShowTermsModal}
        />
      </>
    )
  }

  // If authenticated, show appropriate dashboard (with modals available)
  const dashboard = user.role === 'parent' ? <ParentDashboard /> : user.role === 'professional' ? <ProfessionalDashboard /> : (
    <div className="min-h-screen flex items-center justify-center">
      <p>Tipo de usuário desconhecido</p>
    </div>
  )

  return (
    <>
      {dashboard}
      <PrivacyAndTermsModals 
        showPrivacy={showPrivacyModal} 
        setShowPrivacy={setShowPrivacyModal}
        showTerms={showTermsModal}
        setShowTerms={setShowTermsModal}
      />
    </>
  )
}

function PrivacyAndTermsModals({ showPrivacy, setShowPrivacy, showTerms, setShowTerms }: {
  showPrivacy: boolean
  setShowPrivacy: (show: boolean) => void
  showTerms: boolean
  setShowTerms: (show: boolean) => void
}) {
  return (
    <>
      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <p><strong>Última atualização:</strong> 24 de outubro de 2025</p>
              
              <h3 className="text-lg font-semibold mt-6">1. Informações que Coletamos</h3>
              <p>
                O Autazul coleta informações fornecidas diretamente por você, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dados pessoais (nome, email, senha criptografada)</li>
                <li>Informações sobre crianças sob seu cuidado</li>
                <li>Eventos e observações registrados</li>
                <li>Comunicações entre responsáveis e profissionais</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">2. Como Usamos Suas Informações</h3>
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Facilitar a comunicação entre responsáveis e profissionais</li>
                <li>Gerar relatórios e análises sobre o desenvolvimento</li>
                <li>Enviar notificações relevantes</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">3. Compartilhamento de Informações</h3>
              <p>
                Não vendemos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. 
                Compartilhamos informações apenas quando:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Você autoriza explicitamente (ex: vincular profissionais)</li>
                <li>Requerido por lei</li>
                <li>Necessário para proteção de direitos</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">4. Segurança</h3>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações,
                incluindo criptografia, autenticação de dois fatores e controle de acesso.
              </p>

              <h3 className="text-lg font-semibold mt-6">5. Seus Direitos (LGPD)</h3>
              <p>Você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acessar seus dados pessoais</li>
                <li>Solicitar correção de dados incorretos</li>
                <li>Solicitar exclusão de dados</li>
                <li>Revogar consentimento</li>
                <li>Exportar seus dados</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">6. Contato</h3>
              <p>
                Para questões sobre privacidade, entre em contato: <strong>webservicesbsb@gmail.com</strong>
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Terms of Use Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <p><strong>Última atualização:</strong> 24 de outubro de 2025</p>
              
              <h3 className="text-lg font-semibold mt-6">1. Aceitação dos Termos</h3>
              <p>
                Ao acessar e usar o Autazul, você concorda com estes Termos de Uso e nossa Política de Privacidade.
              </p>

              <h3 className="text-lg font-semibold mt-6">2. Descrição do Serviço</h3>
              <p>
                O Autazul é uma plataforma de acompanhamento colaborativo que permite a responsáveis e profissionais
                registrarem e acompanharem o desenvolvimento de crianças no espectro autista.
              </p>

              <h3 className="text-lg font-semibold mt-6">3. Responsabilidades do Usuário</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações precisas e atualizadas</li>
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Usar o serviço de forma legal e ética</li>
                <li>Respeitar a privacidade de outros usuários</li>
                <li>Não compartilhar informações sensíveis fora da plataforma</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">4. Propriedade Intelectual</h3>
              <p>
                Todo o conteúdo da plataforma, incluindo design, código e funcionalidades, é propriedade do Autazul
                e está protegido por leis de direitos autorais.
              </p>

              <h3 className="text-lg font-semibold mt-6">5. Limitação de Responsabilidade</h3>
              <p>
                O Autazul é uma ferramenta de apoio e não substitui avaliação ou acompanhamento profissional.
                Não nos responsabilizamos por decisões tomadas com base nas informações da plataforma.
              </p>

              <h3 className="text-lg font-semibold mt-6">6. Modificações</h3>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas
                serão comunicadas aos usuários.
              </p>

              <h3 className="text-lg font-semibold mt-6">7. Cancelamento de Conta</h3>
              <p>
                Você pode solicitar o cancelamento de sua conta a qualquer momento através das configurações
                ou entrando em contato conosco.
              </p>

              <h3 className="text-lg font-semibold mt-6">8. Contato</h3>
              <p>
                Para questões sobre estes termos, entre em contato: <strong>webservicesbsb@gmail.com</strong>
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <MobileDetector />
      <Toaster />
    </AuthProvider>
  )
}
