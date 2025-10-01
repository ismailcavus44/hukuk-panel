'use client'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith('/auth')
  return (
    <div className={`${isAuthRoute ? 'min-h-screen' : 'min-h-screen bg-gray-50'}`}>
      {!isAuthRoute && <Sidebar />}
      <main className={`${isAuthRoute ? '' : 'md:ml-64'} min-h-screen`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}




