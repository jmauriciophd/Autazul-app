import { useState } from 'react'
import { useAuth } from '../utils'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Users, Stethoscope, RefreshCw, UserCircle } from 'lucide-react'

export function ProfileSwitcher() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<'parent' | 'professional'>(user?.role || 'parent')

  function handleSwitchProfile() {
    // Save selected profile in sessionStorage
    sessionStorage.setItem('selectedProfile', selectedProfile)
    sessionStorage.setItem('activeRole', selectedProfile)
    
    // Close dialog
    setOpen(false)
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }

  const currentProfileLabel = user?.role === 'parent' ? 'Pai/Responsável' : 'Profissional'
  const currentProfileIcon = user?.role === 'parent' ? Users : Stethoscope

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          style={{ 
            color: '#5C8599',
            borderColor: '#D1D5DB'
          }}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Trocar Perfil</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <UserCircle className="w-8 h-8" style={{ color: '#5C8599' }} />
          </div>
          <DialogTitle className="text-2xl" style={{ color: '#373737' }}>
            Acessar como
          </DialogTitle>
          <DialogDescription>
            Perfil atual: <strong>{currentProfileLabel}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <RadioGroup value={selectedProfile} onValueChange={(value) => setSelectedProfile(value as 'parent' | 'professional')}>
            <div className="grid gap-3">
              {/* Pai/Responsável Option */}
              <div
                className={`relative flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                  selectedProfile === 'parent' 
                    ? 'border-[#15C3D6] bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedProfile('parent')}
              >
                <RadioGroupItem value="parent" id="profile-parent" className="sr-only" />
                <div 
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                    selectedProfile === 'parent' 
                      ? 'bg-[#15C3D6]/10' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Users 
                    className="w-6 h-6" 
                    style={{ color: selectedProfile === 'parent' ? '#15C3D6' : '#5C8599' }} 
                  />
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor="profile-parent" 
                    className="cursor-pointer block font-semibold text-base mb-1" 
                    style={{ color: '#373737' }}
                  >
                    Pai/Responsável
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe o desenvolvimento dos seus filhos
                  </p>
                </div>
                {selectedProfile === 'parent' && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#15C3D6' }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profissional Option */}
              <div
                className={`relative flex items-center gap-4 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                  selectedProfile === 'professional' 
                    ? 'border-[#15C3D6] bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedProfile('professional')}
              >
                <RadioGroupItem value="professional" id="profile-professional" className="sr-only" />
                <div 
                  className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                    selectedProfile === 'professional' 
                      ? 'bg-[#15C3D6]/10' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Stethoscope 
                    className="w-6 h-6" 
                    style={{ color: selectedProfile === 'professional' ? '#15C3D6' : '#5C8599' }} 
                  />
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor="profile-professional" 
                    className="cursor-pointer block font-semibold text-base mb-1" 
                    style={{ color: '#373737' }}
                  >
                    Profissional
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Registre eventos e acompanhe pacientes
                  </p>
                </div>
                {selectedProfile === 'professional' && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#15C3D6' }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          <div className="flex gap-3 pt-2">
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
              {selectedProfile === user?.role ? 'Perfil Atual' : 'Aplicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}