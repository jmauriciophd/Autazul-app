import { useState } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Menu, Users, UserPlus, Calendar, Home } from 'lucide-react'

interface MobileMenuProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function MobileMenu({ activeView, onViewChange }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'children', label: 'Filhos', icon: Users },
    { id: 'professionals', label: 'Profissionais', icon: UserPlus },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navegue pelo sistema
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  onViewChange(item.id)
                  setOpen(false)
                }}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
