'use client'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface CountdownTimerProps {
  expiresAt: string
  isActive: boolean
}

export default function CountdownTimer({ expiresAt, isActive }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })

  useEffect(() => {
    if (!isActive) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, isActive])

  if (!isActive) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Geri Sayım Yok
      </Badge>
    )
  }

  if (timeLeft.isExpired) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600 animate-pulse">
        <CheckCircle className="h-3 w-3" />
        Tahkim Başvurusu Yapın!
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {timeLeft.days}gün
    </Badge>
  )
}
