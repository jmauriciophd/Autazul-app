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

  useEffect(() => {
    if (open) {
      loadCoParents()
    }
  }, [open, child.id])

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
      const { inviteUrl: url } = await api.createCoParentInvite(child.id, coParentEmail, coParentName)
      setInviteUrl(url)
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify.success('Link copiado!')
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="coparents">Co-Responsáveis</TabsTrigger>
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
                    Convide outro responsável (mãe, pai, parente) para acessar e editar os dados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteCoParent} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="coParentName">Nome</Label>
                      <Input
                        id="coParentName"
                        value={coParentName}
                        onChange={(e) => setCoParentName(e.target.value)}
                        placeholder="Nome do co-responsável"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coParentEmail">Email</Label>
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
                      {loading ? 'Gerando...' : 'Gerar Convite'}
                    </Button>
                  </form>
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
