import { useState } from 'react'
import { useAuth } from '../utils/AuthContext'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Users, Stethoscope, RefreshCw } from 'lucide-react'

export function ProfileSwitcher() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<'parent' | 'professional'>(user?.role || 'parent')

  function handleSwitchProfile() {
    // Save selected profile
    localStorage.setItem('selectedProfile', selectedProfile)
    localStorage.setItem('activeRole', selectedProfile)
    
    // Reload page to apply changes
    window.location.reload()
  }

  const currentProfileLabel = user?.role === 'parent' ? 'Pai/Responsável' : 'Profissional'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          style={{ 
            color: '#5C8599',
            borderColor: '#15C3D6'
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Trocar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar Perfil de Acesso</DialogTitle>
          <DialogDescription>
            Perfil atual: <strong>{currentProfileLabel}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Label>Selecione o perfil desejado:</Label>
          <RadioGroup value={selectedProfile} onValueChange={(value) => setSelectedProfile(value as 'parent' | 'professional')}>
            <div className="space-y-3">
              <div
                className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedProfile === 'parent' ? 'border-[#15C3D6] bg-blue-50' : 'border-[#BDBCBC] bg-white'
                }`}
                onClick={() => setSelectedProfile('parent')}
              >
                <RadioGroupItem value="parent" id="profile-parent" className="sr-only" />
                <Users className="w-6 h-6" style={{ color: selectedProfile === 'parent' ? '#15C3D6' : '#5C8599' }} />
                <div className="flex-1">
                  <Label htmlFor="profile-parent" className="cursor-pointer block font-medium" style={{ color: '#373737' }}>
                    Pai/Responsável
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Acesse o painel de pais e responsáveis
                  </p>
                </div>
              </div>
              
              <div
                className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedProfile === 'professional' ? 'border-[#15C3D6] bg-blue-50' : 'border-[#BDBCBC] bg-white'
                }`}
                onClick={() => setSelectedProfile('professional')}
              >
                <RadioGroupItem value="professional" id="profile-professional" className="sr-only" />
                <Stethoscope className="w-6 h-6" style={{ color: selectedProfile === 'professional' ? '#15C3D6' : '#5C8599' }} />
                <div className="flex-1">
                  <Label htmlFor="profile-professional" className="cursor-pointer block font-medium" style={{ color: '#373737' }}>
                    Profissional
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Acesse o painel de profissionais
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSwitchProfile}
              className="flex-1"
              style={{ backgroundColor: '#15C3D6' }}
              disabled={selectedProfile === user?.role}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
