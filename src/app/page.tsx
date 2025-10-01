'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseBrowser } from "@/lib/supabase/client"
import { FileText, Calculator, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalClients: 0,
    totalCalculations: 0,
    totalDocuments: 0
  })
  const [recentCases, setRecentCases] = useState<Array<{ id: string; title: string; case_no?: string | null; status?: string | null; created_at: string }>>([])
  const sb = supabaseBrowser()

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDashboardData = async () => {
    try {
      // İstatistikleri yükle
      const [casesResult, clientsResult, calculationsResult, documentsResult] = await Promise.all([
        sb.from('cases').select('id', { count: 'exact' }),
        sb.from('clients').select('id', { count: 'exact' }),
        sb.from('calculations').select('id', { count: 'exact' }),
        sb.from('documents').select('id', { count: 'exact' })
      ])

      setStats({
        totalCases: casesResult.count || 0,
        totalClients: clientsResult.count || 0,
        totalCalculations: calculationsResult.count || 0,
        totalDocuments: documentsResult.count || 0
      })

      // Son dosyaları yükle
      const { data: cases } = await sb
        .from('cases')
        .select('id, title, case_no, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentCases((cases as Array<{ id: string; title: string; case_no?: string | null; status?: string | null; created_at: string }>) || [])
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error)
    }
  }

  const statCards = [
    {
      title: 'Toplam Dosya',
      value: stats.totalCases,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Toplam Müvekkil',
      value: stats.totalClients,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Toplam Hesaplama',
      value: stats.totalCalculations,
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Toplam Belge',
      value: stats.totalDocuments,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Hukuk bürosu yönetim paneline hoş geldiniz</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Son Dosyalar */}
      <Card>
        <CardHeader>
          <CardTitle>Son Dosyalar</CardTitle>
          <CardDescription>En son oluşturulan dava dosyaları</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCases.length > 0 ? (
            <div className="space-y-4">
              {recentCases.map((caseItem: any) => (
                <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{caseItem.title}</h3>
                    <p className="text-sm text-gray-600">
                      Dosya No: {caseItem.case_no || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      caseItem.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.status === 'open' ? 'Açık' : 'Kapalı'}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(caseItem.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Henüz dosya bulunmuyor</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
