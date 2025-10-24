import { useState } from 'react'
import { useAuth } from '../utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Users, Stethoscope } from 'lucide-react'
import { autazulLogo, loginBackground } from '../assets/logo'
import { Checkbox } from './ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'

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
  const [consent, setConsent] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

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
        if (!consent) {
          setError('Você deve aceitar os termos e a política de privacidade para se cadastrar')
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
            {!isLogin && (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: '#373737' }}>
                    Eu li e aceito os{' '}
                    <button
                      type="button"
                      className="underline"
                      style={{ color: '#15C3D6' }}
                      onClick={() => setShowTerms(true)}
                    >
                      termos de serviço
                    </button>
                    {' '}e a{' '}
                    <button
                      type="button"
                      className="underline"
                      style={{ color: '#15C3D6' }}
                      onClick={() => setShowPrivacyPolicy(true)}
                    >
                      política de privacidade
                    </button>
                    {' '}da Autazul.
                  </Label>
                </div>
              </div>
            )}
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

      {/* Dialogs for Privacy Policy and Terms of Service */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
            <DialogDescription>
              Última atualização: 24/10/2025
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[70vh] pr-4">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Introdução</h3>
                <p className="text-muted-foreground">
                  Bem-vindo ao Autazul. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais e as informações das crianças autistas sob seus cuidados. Estamos comprometidos em proteger sua privacidade e cumprir integralmente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Dados Coletados</h3>
                <p className="text-muted-foreground mb-2">Coletamos as seguintes categorias de dados:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Dados Cadastrais:</strong> Nome, e-mail, senha criptografada</li>
                  <li><strong>Dados da Criança:</strong> Nome, data de nascimento, foto (opcional), escola (opcional)</li>
                  <li><strong>Dados de Eventos:</strong> Tipo de evento, data, hora, descrição, gravidade, observações, fotos (opcional)</li>
                  <li><strong>Dados de Relacionamentos:</strong> Vínculos entre pais, co-responsáveis e profissionais</li>
                  <li><strong>Dados de Uso:</strong> Logs de acesso, interações com o sistema, notificações</li>
                  <li><strong>Dados de Segurança:</strong> Código de autenticação em dois fatores (2FA)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Finalidade do Tratamento</h3>
                <p className="text-muted-foreground mb-2">Utilizamos seus dados para:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Fornecer acesso à plataforma e seus recursos</li>
                  <li>Permitir o registro e acompanhamento de eventos relacionados às crianças autistas</li>
                  <li>Facilitar a colaboração entre pais, co-responsáveis e profissionais de saúde/educação</li>
                  <li>Gerar relatórios e estatísticas para melhor compreensão do desenvolvimento da criança</li>
                  <li>Enviar notificações relevantes sobre eventos e convites</li>
                  <li>Garantir a segurança e integridade da plataforma</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Base Legal</h3>
                <p className="text-muted-foreground mb-2">O tratamento de dados é fundamentado em:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Consentimento:</strong> Ao criar uma conta, você consente com esta política</li>
                  <li><strong>Execução de Contrato:</strong> Necessário para fornecer os serviços contratados</li>
                  <li><strong>Legítimo Interesse:</strong> Melhorar nossos serviços e garantir segurança</li>
                  <li><strong>Proteção da Criança:</strong> Tutela da saúde e do melhor interesse da criança (Art. 11, LGPD)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Proteção de Dados de Crianças</h3>
                <p className="text-muted-foreground">
                  Reconhecemos que dados de crianças, especialmente relacionados à saúde e condições especiais, são extremamente sensíveis. Implementamos medidas adicionais de segurança e só permitimos o acesso a esses dados por responsáveis legais autorizados e profissionais devidamente vinculados através de convites verificados.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Compartilhamento de Dados</h3>
                <p className="text-muted-foreground mb-2">Seus dados podem ser compartilhados apenas nas seguintes situações:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Com Profissionais Autorizados:</strong> Mediante convite aceito pelos pais/responsáveis</li>
                  <li><strong>Com Co-responsáveis:</strong> Mediante convite aceito pelos pais/responsáveis</li>
                  <li><strong>Com Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                  <li><strong>Fornecedores de Serviço:</strong> Provedores de infraestrutura (Supabase) sob acordos de confidencialidade</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  <strong>Nunca vendemos ou alugamos seus dados pessoais a terceiros.</strong>
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Segurança dos Dados</h3>
                <p className="text-muted-foreground mb-2">Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Criptografia de senhas usando algoritmos seguros</li>
                  <li>Autenticação em dois fatores (2FA) opcional</li>
                  <li>Conexões seguras via HTTPS</li>
                  <li>Controle de acesso baseado em permissões</li>
                  <li>Auditoria de logs de acesso</li>
                  <li>Backups regulares e recuperação de desastres</li>
                  <li>Monitoramento contínuo de segurança</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Seus Direitos (LGPD)</h3>
                <p className="text-muted-foreground mb-2">Você tem os seguintes direitos em relação aos seus dados:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                  <li><strong>Correção:</strong> Atualizar dados incompletos, inexatos ou desatualizados</li>
                  <li><strong>Eliminação:</strong> Solicitar a exclusão de dados desnecessários ou tratados em desconformidade</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                  <li><strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento</li>
                  <li><strong>Oposição:</strong> Opor-se a tratamento realizado sem consentimento</li>
                  <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem seus dados foram compartilhados</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Para exercer seus direitos, entre em contato: <strong>webservicesbsb@gmail.com</strong>
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Retenção de Dados</h3>
                <p className="text-muted-foreground">
                  Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas, salvo obrigação legal de retenção por prazo superior. Após a exclusão da conta, os dados são anonimizados ou deletados de forma segura em até 30 dias, exceto dados que devam ser mantidos por exigência legal.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">10. Cookies e Tecnologias Similares</h3>
                <p className="text-muted-foreground">
                  Utilizamos armazenamento local (localStorage) para manter sua sessão ativa e melhorar a experiência do usuário. Não utilizamos cookies de terceiros para rastreamento ou publicidade comportamental.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">11. Alterações nesta Política</h3>
                <p className="text-muted-foreground">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas através do sistema ou por e-mail. A data da última atualização estará sempre visível no topo deste documento.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">12. Encarregado de Dados (DPO)</h3>
                <p className="text-muted-foreground">
                  Para questões relacionadas à proteção de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>E-mail:</strong> webservicesbsb@gmail.com
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">13. Legislação Aplicável</h3>
                <p className="text-muted-foreground">
                  Esta Política de Privacidade é regida pela legislação brasileira, especialmente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e o Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">14. Contato</h3>
                <p className="text-muted-foreground">
                  Para dúvidas, sugestões ou solicitações relacionadas a esta Política de Privacidade:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>E-mail de Suporte:</strong> webservicesbsb@gmail.com
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
            <DialogDescription>
              Última atualização: 24/10/2025
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[70vh] pr-4">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Aceitação dos Termos</h3>
                <p className="text-muted-foreground">
                  Ao criar uma conta e utilizar a plataforma Autazul, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Descrição do Serviço</h3>
                <p className="text-muted-foreground mb-2">O Autazul é uma plataforma digital que permite pais e responsáveis acompanharem eventos e comportamentos de crianças autistas, com a colaboração de profissionais de saúde e educação. O serviço inclui:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Cadastro de crianças autistas e seus responsáveis</li>
                  <li>Registro de eventos e observações comportamentais</li>
                  <li>Sistema de convites para profissionais e co-responsáveis</li>
                  <li>Calendário de eventos e acompanhamentos</li>
                  <li>Geração de relatórios em PDF</li>
                  <li>Sistema de notificações</li>
                  <li>Agendamento de atendimentos</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Elegibilidade</h3>
                <p className="text-muted-foreground mb-2">Para utilizar o Autazul, você deve:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Ter pelo menos 18 anos de idade</li>
                  <li>Ser responsável legal da criança cadastrada, ou profissional devidamente autorizado</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Responsabilidades do Usuário</h3>
                <p className="text-muted-foreground mb-2"><strong>4.1 Você concorda em:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Utilizar a plataforma apenas para fins legítimos e de acordo com estes Termos</li>
                  <li>Não compartilhar suas credenciais de acesso com terceiros</li>
                  <li>Manter informações precisas e atualizadas</li>
                  <li>Respeitar a privacidade de outras pessoas</li>
                  <li>Não utilizar a plataforma para atividades ilegais ou não autorizadas</li>
                  <li>Notificar imediatamente sobre qualquer uso não autorizado de sua conta</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-2"><strong>4.2 Você NÃO deve:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Tentar acessar áreas restritas da plataforma</li>
                  <li>Interferir no funcionamento normal do sistema</li>
                  <li>Transmitir vírus, malware ou qualquer código malicioso</li>
                  <li>Coletar informações de outros usuários sem autorização</li>
                  <li>Usar a plataforma para spam, phishing ou fraude</li>
                  <li>Fazer engenharia reversa, descompilar ou tentar extrair o código-fonte</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Conteúdo do Usuário</h3>
                <p className="text-muted-foreground">
                  <strong>5.1 Propriedade:</strong> Você mantém todos os direitos sobre o conteúdo que publica (eventos, observações, fotos, etc.).
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>5.2 Licença de Uso:</strong> Ao publicar conteúdo, você concede ao Autazul uma licença não exclusiva, mundial e gratuita para armazenar, processar e exibir esse conteúdo apenas para fornecer os serviços da plataforma.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>5.3 Responsabilidade:</strong> Você é responsável pelo conteúdo que publica e garante que possui todos os direitos necessários, incluindo autorização para publicar fotos de crianças.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Profissionais de Saúde e Educação</h3>
                <p className="text-muted-foreground mb-2">Profissionais cadastrados na plataforma devem:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Possuir qualificação adequada para suas áreas de atuação</li>
                  <li>Respeitar o sigilo profissional e ética de suas profissões</li>
                  <li>Utilizar a plataforma apenas para crianças sob seus cuidados profissionais autorizados</li>
                  <li>Registrar informações precisas, objetivas e profissionais</li>
                  <li>Cumprir com suas obrigações regulatórias e códigos de ética profissional</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Natureza do Serviço</h3>
                <p className="text-muted-foreground mb-2"><strong>IMPORTANTE:</strong> O Autazul é uma ferramenta de acompanhamento e registro. NÃO somos:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Um serviço de diagnóstico médico</li>
                  <li>Um substituto para consultas profissionais presenciais</li>
                  <li>Uma plataforma de telemedicina</li>
                  <li>Prestadores de serviços de saúde ou educação</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Sempre consulte profissionais qualificados para diagnósticos, tratamentos e decisões relacionadas à saúde e educação da criança.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Limitação de Responsabilidade</h3>
                <p className="text-muted-foreground">
                  <strong>8.1</strong> O Autazul fornece a plataforma "como está" e "conforme disponível", sem garantias de qualquer tipo.
                </p>
                <p className="text-muted-foreground mt-2 mb-2">
                  <strong>8.2</strong> Não nos responsabilizamos por:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Decisões tomadas com base nas informações da plataforma</li>
                  <li>Conteúdo publicado por usuários</li>
                  <li>Interrupções temporárias ou permanentes do serviço</li>
                  <li>Perda de dados causada por eventos fora de nosso controle</li>
                  <li>Ações de profissionais registrados na plataforma</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  <strong>8.3</strong> Nossa responsabilidade total, em qualquer caso, não excederá o valor pago por você nos últimos 12 meses (ou R$ 100,00 se o serviço for gratuito).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Disponibilidade do Serviço</h3>
                <p className="text-muted-foreground">
                  Embora nos esforcemos para manter a plataforma disponível 24/7, não garantimos operação ininterrupta. Podemos realizar manutenções programadas ou emergenciais, que podem temporariamente indisponibilizar o serviço.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">10. Propriedade Intelectual</h3>
                <p className="text-muted-foreground">
                  Todos os direitos sobre o software, design, marcas, logos e conteúdo da plataforma Autazul pertencem a nós ou nossos licenciadores. Você não pode copiar, modificar, distribuir ou criar trabalhos derivados sem autorização expressa.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">11. Suspensão e Término</h3>
                <p className="text-muted-foreground mb-2">
                  <strong>11.1</strong> Podemos suspender ou encerrar sua conta se você:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Violar estes Termos de Uso</li>
                  <li>Usar a plataforma de forma fraudulenta ou ilegal</li>
                  <li>Representar risco à segurança de outros usuários</li>
                  <li>Fornecer informações falsas ou enganosas</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  <strong>11.2</strong> Você pode encerrar sua conta a qualquer momento através das configurações ou entrando em contato conosco.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>11.3</strong> Após o término, seus dados serão tratados conforme nossa Política de Privacidade.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">12. Modificações dos Termos</h3>
                <p className="text-muted-foreground">
                  Reservamos o direito de modificar estes Termos a qualquer momento. Notificaremos sobre mudanças significativas através da plataforma ou por e-mail. O uso continuado após as modificações constitui aceitação dos novos termos.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">13. Gratuidade do Serviço</h3>
                <p className="text-muted-foreground">
                  Atualmente, o Autazul é oferecido gratuitamente. Reservamos o direito de introduzir planos pagos no futuro, com notificação prévia aos usuários.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">14. Indenização</h3>
                <p className="text-muted-foreground">
                  Você concorda em indenizar e isentar o Autazul, seus diretores, funcionários e parceiros de quaisquer reclamações, danos, perdas ou despesas (incluindo honorários advocatícios) decorrentes de seu uso da plataforma ou violação destes Termos.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">15. Legislação Aplicável e Foro</h3>
                <p className="text-muted-foreground">
                  Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no foro da comarca de Brasília/DF, com exclusão de qualquer outro, por mais privilegiado que seja.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">16. Divisibilidade</h3>
                <p className="text-muted-foreground">
                  Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">17. Contato</h3>
                <p className="text-muted-foreground">
                  Para dúvidas, sugestões ou questões relacionadas a estes Termos de Uso:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>E-mail de Suporte:</strong> webservicesbsb@gmail.com
                </p>
              </section>

              <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-900">
                  <strong>📝 Importante:</strong> Ao utilizar o Autazul, você confirma que leu, compreendeu e concorda com estes Termos de Uso e nossa Política de Privacidade. Se você é um profissional de saúde ou educação, também se compromete a cumprir com os códigos de ética e regulamentações de sua profissão.
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}