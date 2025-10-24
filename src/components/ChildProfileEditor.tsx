import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Users, School, Image, UserPlus, Copy, Check, Trash2 } from 'lucide-react'
import { Badge } from './ui/badge'
import { copyToClipboard as copyToClipboardUtil } from '../utils/clipboard'

interface Child {
  id: string
  name: string
  birthDate: string
  photo?: string
  school?: string
  parentId: string
}

interface CoParent {
  id: string
  name: string
  email: string
}

interface ChildProfileEditorProps {
  child: Child
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function ChildProfileEditor({ child, open, onOpenChange, onUpdate }: ChildProfileEditorProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(child.name)
  const [birthDate, setBirthDate] = useState(child.birthDate)
  const [photo, setPhoto] = useState(child.photo || '')
  const [school, setSchool] = useState(child.school || '')
  const [coParents, setCoParents] = useState<CoParent[]>([])
  
  // Co-parent invite states
  const [coParentName, setCoParentName] = useState('')
  const [coParentEmail, setCoParentEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Child sharing states
  const [shareEmail, setShareEmail] = useState('')
  const [sharedWithUsers, setSharedWithUsers] = useState<Array<{ id: string; name: string; email: string }>>([])

  useEffect(() => {
    if (open) {
      loadSharedWith()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      loadCoParents()
      // Atualiza os estados com os dados do child atual
      setName(child.name)
      setBirthDate(child.birthDate)
      setPhoto(child.photo || '')
      setSchool(child.school || '')
    }
  }, [open, child.id, child.name, child.birthDate, child.photo, child.school])

  async function loadCoParents() {
    try {
      const { coParents: coParentsData } = await api.getCoParentsForChild(child.id)
      setCoParents(coParentsData)
    } catch (error) {
      console.error('Error loading co-parents:', error)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await api.updateChild(child.id, {
        name,
        birthDate,
        photo,
        school
      })
      notify.success('Perfil atualizado', 'As informações foram salvas com sucesso')
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating child:', error)
      notify.error('Erro ao atualizar', 'Não foi possível salvar as informações')
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteCoParent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { inviteUrl: url, token } = await api.createCoParentInvite(child.id, coParentEmail, coParentName)
      
      // Garantir que o link use o domínio correto do frontend
      const correctUrl = `${window.location.origin}/#/coparent/accept/${token}`
      setInviteUrl(correctUrl)
      
      setShowInviteDialog(true)
      setCoParentName('')
      setCoParentEmail('')
      await loadCoParents()
      notify.success('Convite criado', 'Compartilhe o link com o co-responsável')
    } catch (error: any) {
      console.error('Error creating co-parent invite:', error)
      notify.error('Erro ao criar convite', 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  async function handleInviteCoParentByEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { coParentName: cpName } = await api.inviteCoParentByEmail(child.id, coParentEmail)
      setCoParentEmail('')
      notify.success(
        'Convite enviado!', 
        `${cpName} receberá uma notificação no sistema e por email`
      )
    } catch (error: any) {
      console.error('Error inviting co-parent by email:', error)
      const errorMessage = error?.error || 'Tente novamente'
      if (errorMessage.includes('não encontrado')) {
        notify.error('Co-responsável não encontrado', 'Verifique se o email está correto e se a pessoa já possui cadastro no sistema')
      } else if (errorMessage.includes('já está vinculado')) {
        notify.error('Co-responsável já vinculado', 'Esta pessoa já tem acesso a esta criança')
      } else if (errorMessage.includes('não pode adicionar a si mesmo')) {
        notify.error('Erro', 'Você não pode adicionar a si mesmo como co-responsável')
      } else {
        notify.error('Erro ao enviar convite', errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    copyToClipboardUtil(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify.success('Link copiado!')
  }

  async function loadSharedWith() {
    // Esta função seria implementada no servidor para listar com quem o filho está compartilhado
    // Por enquanto vamos deixar vazio, pode ser implementado depois se necessário
    setSharedWithUsers([])
  }

  async function handleShareChild(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { parentName } = await api.shareChild(child.id, shareEmail)
      setShareEmail('')
      await loadSharedWith()
      notify.success(
        'Filho compartilhado!', 
        `${parentName} receberá uma notificação e poderá visualizar as informações`
      )
    } catch (error: any) {
      console.error('Error sharing child:', error)
      const errorMessage = error?.error || 'Tente novamente'
      if (errorMessage.includes('não encontrado')) {
        notify.error('Responsável não encontrado', 'Verifique se o email está correto e se a pessoa já possui cadastro no sistema')
      } else if (errorMessage.includes('já está compartilhado')) {
        notify.error('Já compartilhado', 'Este filho já está compartilhado com este responsável')
      } else if (errorMessage.includes('não pode compartilhar com você mesmo')) {
        notify.error('Erro', 'Você não pode compartilhar com você mesmo')
      } else if (errorMessage.includes('já é co-responsável')) {
        notify.error('Já vinculado', 'Esta pessoa já é co-responsável desta criança')
      } else {
        notify.error('Erro ao compartilhar', errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil de {child.name}</DialogTitle>
            <DialogDescription>
              Atualize as informações e gerencie co-responsáveis
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="coparents">Co-Responsáveis</TabsTrigger>
              <TabsTrigger value="share">Compartilhar</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={photo} alt={name} />
                      <AvatarFallback className="text-2xl">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2">
                      <Image className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">URL da Foto</Label>
                  <Input
                    id="photo"
                    type="url"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL de uma foto do autista
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">Escola</Label>
                  <div className="flex gap-2">
                    <School className="w-5 h-5 text-muted-foreground mt-2" />
                    <Input
                      id="school"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Nome da escola onde estuda"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="coparents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="w-5 h-5" />
                    Adicionar Co-Responsável
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja convidar o co-responsável
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="link" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="link">
                        🔗 Link de Convite
                      </TabsTrigger>
                      <TabsTrigger value="email">
                        📧 Convite por Email
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="link" className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900">
                          <strong>💡 Para quem não tem cadastro</strong>
                          <br />
                          Gere um link único que permite criar uma conta e aceitar o convite.
                        </p>
                      </div>
                      
                      <form onSubmit={handleInviteCoParent} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="coParentName">Nome *</Label>
                          <Input
                            id="coParentName"
                            value={coParentName}
                            onChange={(e) => setCoParentName(e.target.value)}
                            placeholder="Nome completo"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="coParentEmail">Email *</Label>
                          <Input
                            id="coParentEmail"
                            type="email"
                            value={coParentEmail}
                            onChange={(e) => setCoParentEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Gerando Link...' : '🔗 Gerar Link de Convite'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="email" className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-purple-900">
                          <strong>✅ Para quem já tem cadastro</strong>
                          <br />
                          Envie um convite direto por email. A pessoa poderá aceitar através do sistema ou pelo email.
                        </p>
                      </div>
                      
                      <form onSubmit={handleInviteCoParentByEmail} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="coParentEmailInvite">Email do Co-Responsável *</Label>
                          <Input
                            id="coParentEmailInvite"
                            type="email"
                            value={coParentEmail}
                            onChange={(e) => setCoParentEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Digite o email de alguém que já possui conta no Autazul
                          </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? 'Enviando Convite...' : '📧 Enviar Convite'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Co-Responsáveis Vinculados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coParents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum co-responsável vinculado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {coParents.map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div>
                            <p>{cp.name}</p>
                            <p className="text-sm text-muted-foreground">{cp.email}</p>
                          </div>
                          <Badge variant="secondary">Co-Responsável</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="share" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="w-5 h-5" />
                    Compartilhar Filho
                  </CardTitle>
                  <CardDescription>
                    Compartilhe {child.name} com outro responsável para que ele possa visualizar eventos e profissionais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>ℹ️ Sobre o compartilhamento:</strong>
                      <br />
                      • O responsável poderá <strong>visualizar</strong> eventos e profissionais
                      <br />
                      • O responsável <strong>NÃO poderá editar</strong> dados da criança
                      <br />
                      • O responsável <strong>NÃO poderá adicionar/remover</strong> profissionais
                      <br />
                      • Você pode remover o acesso a qualquer momento
                    </p>
                  </div>
                  
                  <form onSubmit={handleShareChild} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shareEmail">Email do Responsável *</Label>
                      <Input
                        id="shareEmail"
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite o email de um responsável já cadastrado no sistema
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Compartilhando...' : '📤 Compartilhar Filho'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Compartilhado Com
                  </CardTitle>
                  <CardDescription>
                    Responsáveis que têm acesso de visualização
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sharedWithUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum compartilhamento ativo
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sharedWithUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div>
                            <p>{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">👁️ Visualização</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (confirm('Remover acesso deste responsável?')) {
                                  try {
                                    await api.removeSharedAccess(child.id, user.id)
                                    await loadSharedWith()
                                    notify.success('Acesso removido')
                                  } catch (error) {
                                    notify.error('Erro ao remover acesso')
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Invite URL Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Convite para Co-Responsável</DialogTitle>
            <DialogDescription>
              Compartilhe este link com o co-responsável para que ele possa se cadastrar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg break-all text-sm">
              {inviteUrl}
            </div>
            <Button
              onClick={() => copyToClipboard(inviteUrl)}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}