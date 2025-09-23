'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Upload, Edit, Trash2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CountdownTimer from '@/components/countdown-timer'

interface Client {
  id: string
  full_name: string
  tc_no?: string
  phone?: string
  email?: string
  created_at: string
}

interface Case {
  id: string
  title: string
  case_no?: string
  description?: string
  status: string
  client_id?: string
  damage_amount?: number
  insurance_application_date?: string
  countdown_expires_at?: string
  is_countdown_active?: boolean
  created_at: string
  client?: Client
}

export default function DosyalarPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [caseDialogOpen, setCaseDialogOpen] = useState(false)
  const [clientSelectDialogOpen, setClientSelectDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  
  // Form states
  const [clientForm, setClientForm] = useState({ full_name: '', tc_no: '', phone: '', email: '' })
  const [caseForm, setCaseForm] = useState({ 
    title: '', 
    case_no: '', 
    description: '', 
    status: 'open', 
    client_id: '',
    damage_amount: '' 
  })
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // Dosya başlığı seçenekleri
  const caseTitles = [
    'Sigorta Başvurusu',
    'Tahkim Başvurusu'
  ]
  
  const sb = supabaseBrowser()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [casesResult, clientsResult] = await Promise.all([
        sb.from('cases')
          .select(`
            id, title, case_no, description, status, client_id, damage_amount,
            insurance_application_date, countdown_expires_at, is_countdown_active,
            created_at,
            client:clients(id, full_name, phone, email)
          `)
          .order('created_at', { ascending: false }),
        sb.from('clients').select('*').order('full_name')
      ])

      setCases(casesResult.data || [])
      setClients(clientsResult.data || [])
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Kullanıcı bilgisini al
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        toast.error('Giriş yapmanız gerekiyor')
        return
      }

      const { error } = await sb.from('clients').insert({
        ...clientForm,
        created_by: user.id
      })
      if (error) throw error
      
      toast.success('Müvekkil başarıyla eklendi')
      setClientForm({ full_name: '', tc_no: '', phone: '', email: '' })
      setClientDialogOpen(false)
      loadData()
    } catch (error: unknown) {
      const msg = (error as { message?: unknown })?.message
      toast.error(typeof msg === 'string' ? msg : 'Bir hata oluştu')
    }
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Kullanıcı bilgisini al
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        toast.error('Giriş yapmanız gerekiyor')
        return
      }

      // Sigorta başvurusu için geri sayım hesapla
      let caseData: Record<string, unknown> = {
        ...caseForm,
        damage_amount: caseForm.damage_amount ? parseFloat(caseForm.damage_amount) : null,
        created_by: user.id
      }

      if (caseForm.title === 'Sigorta Başvurusu') {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)) // 15 gün sonra
        
        caseData = {
          ...caseData,
          insurance_application_date: now.toISOString(),
          countdown_expires_at: expiresAt.toISOString(),
          is_countdown_active: true
        }
      }

      const { error } = await sb.from('cases').insert(caseData)
      if (error) throw error
      
      if (caseForm.title === 'Sigorta Başvurusu') {
        toast.success('Sigorta başvurusu oluşturuldu! 15 günlük süre başladı.')
      } else {
        toast.success('Dosya başarıyla oluşturuldu')
      }
      
      setCaseForm({ title: '', case_no: '', description: '', status: 'open', client_id: '', damage_amount: '' })
      setSelectedClient(null)
      setCaseDialogOpen(false)
      loadData()
    } catch (error: unknown) {
      const msg = (error as { message?: unknown })?.message
      toast.error(typeof msg === 'string' ? msg : 'Bir hata oluştu')
    }
  }

  const handleEditCase = (caseItem: Case) => {
    // Sigorta başvurusu ve geri sayım aktifse düzenlemeyi engelle
    if (caseItem.title === 'Sigorta Başvurusu' && caseItem.is_countdown_active) {
      const now = new Date()
      const expiresAt = new Date(caseItem.countdown_expires_at!)
      
      if (now < expiresAt) {
        toast.error('Sigorta başvurusu dosyası 15 günlük süre bitmeden düzenlenemez!')
        return
      }
    }

    setEditingCase(caseItem)
    setCaseForm({
      title: caseItem.title,
      case_no: caseItem.case_no || '',
      description: caseItem.description || '',
      status: caseItem.status,
      client_id: caseItem.client_id || '',
      damage_amount: caseItem.damage_amount?.toString() || ''
    })
    
    // Müvekkil bilgisini bul ve set et
    const client = clients.find(c => c.id === caseItem.client_id)
    setSelectedClient(client || null)
    
    setCaseDialogOpen(true)
  }

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCase) return

    // Sigorta başvurusu dosyasında başlık değişikliğini engelle
    if (editingCase.title === 'Sigorta Başvurusu' && caseForm.title !== 'Sigorta Başvurusu') {
      toast.error('Sigorta başvurusu dosyasının başlığı değiştirilemez!')
      return
    }

    try {
      const { error } = await sb
        .from('cases')
        .update({
          title: caseForm.title,
          case_no: caseForm.case_no,
          description: caseForm.description,
          status: caseForm.status,
          client_id: caseForm.client_id,
          damage_amount: caseForm.damage_amount ? parseFloat(caseForm.damage_amount) : null
        })
        .eq('id', editingCase.id)

      if (error) throw error
      
      toast.success('Dosya bilgileri güncellendi')
      setCaseForm({ title: '', case_no: '', description: '', status: 'open', client_id: '', damage_amount: '' })
      setSelectedClient(null)
      setEditingCase(null)
      setCaseDialogOpen(false)
      loadData()
    } catch (error: unknown) {
      const msg = (error as { message?: unknown })?.message
      toast.error(typeof msg === 'string' ? msg : 'Bir hata oluştu')
    }
  }

  const handleDeleteCase = async (id: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return
    
    try {
      const { error } = await sb.from('cases').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Dosya silindi')
      loadData()
    } catch (error: unknown) {
      const msg = (error as { message?: unknown })?.message
      toast.error(typeof msg === 'string' ? msg : 'Bir hata oluştu')
    }
  }

  const handleToggleStatus = async (e: React.MouseEvent, caseItem: Case) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newStatus = caseItem.status === 'open' ? 'closed' : 'open'
    const statusText = newStatus === 'open' ? 'açık' : 'kapalı'
    
    try {
      const { error } = await sb
        .from('cases')
        .update({ status: newStatus })
        .eq('id', caseItem.id)

      if (error) throw error
      
      toast.success(`Dosya ${statusText} olarak işaretlendi`)
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.case_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.client?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dosya Yönetimi</h1>
          <p className="text-gray-600">Müvekkil ve dava dosyalarını yönetin</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müvekkil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Müvekkil Ekle</DialogTitle>
                <DialogDescription>
                  Yeni müvekkil bilgilerini girin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Ad Soyad *
                  </Label>
                  <Input
                    id="full_name"
                    value={clientForm.full_name}
                    onChange={(e) => setClientForm({...clientForm, full_name: e.target.value})}
                    required
                    className="h-11"
                    placeholder="Müvekkil adı ve soyadı"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tc_no" className="text-sm font-medium text-gray-700">
                    TC Kimlik No
                  </Label>
                  <Input
                    id="tc_no"
                    value={clientForm.tc_no}
                    onChange={(e) => setClientForm({...clientForm, tc_no: e.target.value})}
                    placeholder="11 haneli TC kimlik numarası"
                    maxLength={11}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">Opsiyonel - 11 haneli TC kimlik numarası</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                      placeholder="0555 123 45 67"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      E-posta
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                      placeholder="ornek@email.com"
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full h-11 text-base font-medium">
                    Yeni Müvekkil Ekle
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={caseDialogOpen} onOpenChange={(open) => {
            setCaseDialogOpen(open)
            if (!open) {
              setEditingCase(null)
              setCaseForm({ title: '', case_no: '', description: '', status: 'open', client_id: '', damage_amount: '' })
              setSelectedClient(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Dosya
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCase ? 'Dosya Düzenle' : 'Yeni Dosya Oluştur'}
              </DialogTitle>
              <DialogDescription>
                {editingCase ? 'Dosya bilgilerini güncelleyin' : 'Yeni dava dosyası bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
              <form onSubmit={editingCase ? handleUpdateCase : handleCreateCase} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Dosya Başlığı *
                  </Label>
                  <Select value={caseForm.title} onValueChange={(value) => setCaseForm({...caseForm, title: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Dosya başlığını seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTitles.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case_no" className="text-sm font-medium text-gray-700">
                      Dosya No
                    </Label>
                    <Input
                      id="case_no"
                      value={caseForm.case_no}
                      onChange={(e) => setCaseForm({...caseForm, case_no: e.target.value})}
                      className="h-11"
                      placeholder="Dosya numarası (opsiyonel)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damage_amount" className="text-sm font-medium text-gray-700">
                      Hasar Bedeli (TL)
                    </Label>
                    <Input
                      id="damage_amount"
                      type="number"
                      value={caseForm.damage_amount}
                      onChange={(e) => setCaseForm({...caseForm, damage_amount: e.target.value})}
                      className="h-11"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">Opsiyonel - Hasar bedeli tutarı</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-sm font-medium text-gray-700">
                    Müvekkil
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={selectedClient?.full_name || ''}
                        placeholder="Müvekkil seçin"
                        readOnly
                        className="h-11"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setClientSelectDialogOpen(true)}
                      className="h-11 px-4 cursor-pointer"
                    >
                      Seç
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Dosyayı hangi müvekkile bağlayacağınızı seçin</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Açıklama
                  </Label>
                  <Textarea
                    id="description"
                    value={caseForm.description}
                    onChange={(e) => setCaseForm({...caseForm, description: e.target.value})}
                    placeholder="Dosya hakkında açıklama (opsiyonel)"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full h-11 text-base font-medium">
                    {editingCase ? 'Dosya Bilgilerini Güncelle' : 'Yeni Dosya Oluştur'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Müvekkil Seçim Dialog'u */}
          <Dialog open={clientSelectDialogOpen} onOpenChange={setClientSelectDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Müvekkil Seç</DialogTitle>
                <DialogDescription className="text-base">
                  Bu dosyayı hangi müvekkile bağlayacağınızı seçin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Müvekkil adı, TC kimlik no veya telefon ile ara..."
                    className="pl-12 h-12 text-base"
                  />
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedClient?.id === client.id 
                            ? 'bg-blue-50 border-blue-300 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedClient(client)
                          setCaseForm({...caseForm, client_id: client.id})
                          setClientSelectDialogOpen(false)
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                              {client.full_name}
                            </h3>
                            <div className="space-y-1">
                              {client.tc_no && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">TC:</span> {client.tc_no}
                                </p>
                              )}
                              {client.phone && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Tel:</span> {client.phone}
                                </p>
                              )}
                              {client.email && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">E-posta:</span> {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <Badge variant="outline" className="mb-2">
                              {client.cases?.length || 0} dosya
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {new Date(client.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz müvekkil bulunmuyor</h3>
                      <p className="text-gray-500 mb-4">Önce müvekkil eklemeniz gerekiyor</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setClientSelectDialogOpen(false)
                          setClientDialogOpen(true)
                        }}
                        className="cursor-pointer"
                      >
                        Yeni Müvekkil Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Ara</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Dosya başlığı, numarası veya müvekkil adı..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="open">Açık</SelectItem>
                  <SelectItem value="closed">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dosya Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Dosya Listesi</CardTitle>
          <CardDescription>
            {filteredCases.length} dosya bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya Başlığı</TableHead>
                  <TableHead>Dosya No</TableHead>
                  <TableHead>Müvekkil</TableHead>
                  <TableHead>Hasar Bedeli</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tahkime Kalan Süre</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.title}</TableCell>
                    <TableCell>{caseItem.case_no || '-'}</TableCell>
                    <TableCell>{caseItem.client?.full_name || '-'}</TableCell>
                    <TableCell>
                      {caseItem.damage_amount ? (
                        <span className="font-medium text-green-600">
                          {caseItem.damage_amount.toLocaleString('tr-TR')} TL
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={caseItem.status === 'open' ? 'default' : 'secondary'}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => handleToggleStatus(e, caseItem)}
                        title={`Durumu değiştir (${caseItem.status === 'open' ? 'Kapalı' : 'Açık'} yap)`}
                      >
                        {caseItem.status === 'open' ? 'Açık' : 'Kapalı'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {caseItem.countdown_expires_at ? (
                        <CountdownTimer 
                          expiresAt={caseItem.countdown_expires_at} 
                          isActive={caseItem.is_countdown_active || false} 
                        />
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(caseItem.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCase(caseItem)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteCase(caseItem.id)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz dosya bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
