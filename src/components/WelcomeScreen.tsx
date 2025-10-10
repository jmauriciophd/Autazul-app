import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Heart, Users, UserPlus, Calendar, FileText, Link as LinkIcon } from 'lucide-react'

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Heart className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="text-4xl mb-2">Bem-vindo ao Autazul</h1>
          <p className="text-xl text-muted-foreground">
            Sistema de acompanhamento e registro de eventos para autistas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Para Pais/Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p>Cadastre-se como responsável</p>
                  <p className="text-sm text-muted-foreground">
                    Crie sua conta com email e senha
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p>Adicione seus filhos autistas</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastre quantos filhos precisar
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p>Convide profissionais</p>
                  <p className="text-sm text-muted-foreground">
                    Gere links únicos para cada profissional
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <p>Acompanhe eventos no calendário</p>
                  <p className="text-sm text-muted-foreground">
                    Visualize todos os eventos registrados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Para Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p>Receba o link de convite</p>
                  <p className="text-sm text-muted-foreground">
                    O responsável enviará um link único
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p>Aceite o convite</p>
                  <p className="text-sm text-muted-foreground">
                    Crie sua conta através do link
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p>Registre eventos</p>
                  <p className="text-sm text-muted-foreground">
                    Documente observações importantes
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <p>Colabore com a família</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os eventos ficam disponíveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
          <CardHeader>
            <CardTitle>Funcionalidades Principais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="mb-2">Calendário Interativo</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize eventos destacados no calendário mensal
                </p>
              </div>
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="mb-2">Registro Detalhado</h3>
                <p className="text-sm text-muted-foreground">
                  Eventos com tipo, gravidade, descrição e avaliação
                </p>
              </div>
              <div className="text-center">
                <LinkIcon className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="mb-2">Links Únicos</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema seguro de vinculação de profissionais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <h3 className="mb-2 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Importante - Ambiente de Demonstração
          </h3>
          <p className="text-sm text-muted-foreground">
            Este sistema foi desenvolvido no Figma Make para fins de demonstração e prototipagem. 
            Para uso em produção com dados médicos e informações sensíveis, é necessário implementar 
            medidas adicionais de segurança e conformidade com regulamentações como LGPD.
          </p>
        </div>
      </div>
    </div>
  )
}
