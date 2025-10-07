// Kullanıcı rolleri ve yetkileri
export type UserRole = 'admin' | 'readonly'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name?: string
}

// Yetki kontrolü için yardımcı fonksiyonlar
export const hasPermission = (userRole: UserRole, action: 'create' | 'update' | 'delete' | 'read'): boolean => {
  if (userRole === 'admin') return true
  if (userRole === 'readonly') return action === 'read'
  return false
}

export const canEdit = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'update')
}

export const canDelete = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'delete')
}

export const canCreate = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'create')
}

