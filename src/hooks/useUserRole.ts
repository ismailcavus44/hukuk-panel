import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { UserRole, UserProfile } from '@/types/auth'

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>('admin')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const supabase = supabaseBrowser()
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Kullanıcı email'ine göre rol belirle
          // Burada email kontrolü yapabilirsin veya ayrı bir user_profiles tablosu kullanabilirsin
          const isReadOnly = user.email?.includes('readonly') || 
                            user.email?.includes('viewer') ||
                            user.email === 'emre@sayhukuk.com'
          
          const profile: UserProfile = {
            id: user.id,
            email: user.email || '',
            role: isReadOnly ? 'readonly' : 'admin',
            full_name: user.user_metadata?.full_name
          }
          
          setUserProfile(profile)
          setUserRole(profile.role)
        }
      } catch (error) {
        console.error('Kullanıcı rolü alınamadı:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()
  }, [])

  return {
    userRole,
    userProfile,
    loading,
    isReadOnly: userRole === 'readonly',
    isAdmin: userRole === 'admin'
  }
}
