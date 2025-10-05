import { Button } from '@/components/ui/button'
import { useUserRole } from '@/hooks/useUserRole'

interface ProtectedButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: boolean
}

export function ProtectedButton({ onClick, children, variant = 'default', disabled }: ProtectedButtonProps) {
  const { isReadOnly } = useUserRole()
  
  if (isReadOnly) {
    return null // Salt okunur kullanıcılar için butonu gizle
  }
  
  return (
    <Button onClick={onClick} variant={variant} disabled={disabled}>
      {children}
    </Button>
  )
}
