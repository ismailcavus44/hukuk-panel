'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, FileText, User, Info, History } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useUserRole } from '@/hooks/useUserRole'
import { PROGRESS_TYPES } from '@/types/case-progress'

interface Client {
  id: string
  full_name: string
  tc_no?: string
  phone?: string
  email?: string
  birth_date?: string
  created_at: string
  cases?: Case[]
}

interface CaseProgress {
  id: string
  progress_type: string
  custom_description?: string
  progress_date: string
  notes?: string
  created_at: string
}

interface Case {
  id: string
  title: string
  case_no?: string
  vehicle_plate?: string
  description?: string
  status: string
  client_id: string
  damage_amount?: number
  insurance_application_date?: string
  countdown_expires_at?: string
  is_countdown_active?: boolean
  created_at: string
  case_progress?: CaseProgress[]
}

export default function MuvekkillerPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { isReadOnly } = useUserRole()
  
  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientInfoDialogOpen, setClientInfoDialogOpen] = useState(false)
  const [selectedClientForInfo, setSelectedClientForInfo] = useState<Client | null>(null)
  const [caseDetailDialogOpen, setCaseDetailDialogOpen] = useState(false)
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<Case | null>(null)
  const [caseProgressDialogOpen, setCaseProgressDialogOpen] = useState(false)
  
  // Form state
  const [clientForm, setClientForm] = useState({ 
    full_name: '', 
    tc_no: '', 
    phone: '', 
    email: '',
    birth_date: ''
  })
  
  const sb = supabaseBrowser()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data, error } = await sb
        .from('clients')
        .select(`
          id, full_name, tc_no, phone, email, birth_date, created_at,
          cases:cases(id, title, case_no, vehicle_plate, description, status, client_id, damage_amount, 
                      insurance_application_date, countdown_expires_at, is_countdown_active, created_at,
                      case_progress:case_progress(id, progress_type, custom_description, progress_date, notes, created_at))
        `)
        .order('full_name')

      if (error) throw error
      setClients(data || [])
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
      setClientForm({ full_name: '', tc_no: '', phone: '', email: '', birth_date: '' })
      setClientDialogOpen(false)
      loadData()
    } catch {
      toast.error('Hata')
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientForm({
      full_name: client.full_name,
      tc_no: client.tc_no || '',
      phone: client.phone || '',
      email: client.email || '',
      birth_date: client.birth_date || ''
    })
    setClientDialogOpen(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    try {
      const { error } = await sb
        .from('clients')
        .update(clientForm)
        .eq('id', editingClient.id)

      if (error) throw error
      
      toast.success('Müvekkil bilgileri güncellendi')
      setClientForm({ full_name: '', tc_no: '', phone: '', email: '', birth_date: '' })
      setEditingClient(null)
      setClientDialogOpen(false)
      loadData()
    } catch {
      toast.error('Hata')
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Bu müvekkili silmek istediğinizden emin misiniz? Dosyaları da silinecektir.')) return
    
    try {
      const { error } = await sb.from('clients').delete().eq('id', id)
      if (error) throw error
      
      toast.success('Müvekkil silindi')
      loadData()
    } catch {
      toast.error('Hata')
    }
  }

  const handleShowCaseDetail = (caseItem: Case) => {
    setSelectedCaseForDetail(caseItem)
    setCaseDetailDialogOpen(true)
  }

  const handleShowClientInfo = (client: Client) => {
    setSelectedClientForInfo(client)
    setClientInfoDialogOpen(true)
  }

  const filteredClients = clients.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tc_no?.includes(searchTerm) ||
    client.phone?.includes(searchTerm)
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Müvekkil Yönetimi</h1>
          <p className="text-gray-600">Müvekkil bilgilerini yönetin</p>
        </div>
        <Dialog open={clientDialogOpen} onOpenChange={(open) => {
          setClientDialogOpen(open)
          if (!open) {
            setEditingClient(null)
            setClientForm({ full_name: '', tc_no: '', phone: '', email: '', birth_date: '' })
          }
        }}>
          <DialogTrigger asChild>
            {!isReadOnly && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müvekkil
              </Button>
            )}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Müvekkil Düzenle' : 'Yeni Müvekkil Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? 'Müvekkil bilgilerini güncelleyin' : 'Yeni müvekkil bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingClient ? handleUpdateClient : handleCreateClient} className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700">
                  Doğum Tarihi
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={clientForm.birth_date}
                  onChange={(e) => setClientForm({...clientForm, birth_date: e.target.value})}
                  className="h-11"
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full h-11 text-base font-medium">
                  {editingClient ? 'Müvekkil Bilgilerini Güncelle' : 'Yeni Müvekkil Ekle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Müvekkil Dosya Bilgileri Modal */}
        <Dialog open={clientInfoDialogOpen} onOpenChange={setClientInfoDialogOpen}>
          <DialogContent className="w-[98vw] max-w-none max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-semibold">
                {selectedClientForInfo?.full_name} - Dosya Listesi
              </DialogTitle>
              <DialogDescription className="text-base">
                Bu müvekkile kayıtlı tüm dosyalar
              </DialogDescription>
            </DialogHeader>
            
            {selectedClientForInfo && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Dosya Listesi */}
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-lg mb-3">
                    Dosyalar ({selectedClientForInfo.cases?.length || 0})
                  </h3>
                  
                  {selectedClientForInfo.cases && selectedClientForInfo.cases.length > 0 ? (
                    <div className="h-full border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[25%]">Dosya Başlığı</TableHead>
                            <TableHead className="w-[20%]">Dosya No</TableHead>
                            <TableHead className="w-[20%]">Araç Plakası</TableHead>
                            <TableHead className="w-[15%]">Durum</TableHead>
                            <TableHead className="w-[20%]">Oluşturulma Tarihi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedClientForInfo.cases.map((caseItem) => (
                            <TableRow key={caseItem.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{caseItem.title}</TableCell>
                              <TableCell>
                                {caseItem.case_no ? (
                                  <button
                                    onClick={() => handleShowCaseDetail(caseItem)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                  >
                                    {caseItem.case_no}
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {caseItem.vehicle_plate || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={caseItem.status === 'open' ? 'default' : 'secondary'}>
                                  {caseItem.status === 'open' ? 'Açık' : 'Kapalı'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(caseItem.created_at).toLocaleDateString('tr-TR')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Bu müvekkile henüz dosya kayıtlı değil</p>
                      <p className="text-gray-400 text-sm mt-2">Dosyalar sayfasından yeni dosya ekleyebilirsiniz</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dosya Detay Modal */}
        <Dialog open={caseDetailDialogOpen} onOpenChange={setCaseDetailDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Dosya Detayları
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Dosya bilgileri ve durumu
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setCaseProgressDialogOpen(true)}
                  >
                    <History className="h-4 w-4" />
                    Safahat Geçmişi
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            {selectedCaseForDetail && (
              <div className="space-y-6">
                {/* Temel Bilgiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dosya Başlığı</p>
                    <p className="font-medium text-lg">{selectedCaseForDetail.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dosya No</p>
                    <p className="font-medium">{selectedCaseForDetail.case_no || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Araç Plakası</p>
                    <p className="font-medium">{selectedCaseForDetail.vehicle_plate || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Durum</p>
                    <Badge variant={selectedCaseForDetail.status === 'open' ? 'default' : 'secondary'}>
                      {selectedCaseForDetail.status === 'open' ? 'Açık' : 'Kapalı'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hasar Bedeli</p>
                    <p className="font-medium">
                      {selectedCaseForDetail.damage_amount ? (
                        <span className="text-green-600">
                          {selectedCaseForDetail.damage_amount.toLocaleString('tr-TR')} TL
                        </span>
                      ) : (
                        <span className="text-gray-400">Belirtilmemiş</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Açıklama */}
                {selectedCaseForDetail.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedCaseForDetail.description}</p>
                    </div>
                  </div>
                )}

                {/* Sigorta Başvurusu Bilgileri */}
                {selectedCaseForDetail.title === 'Sigorta Başvurusu' && selectedCaseForDetail.insurance_application_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Sigorta Başvurusu Bilgileri</p>
                    <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Başvuru Tarihi</p>
                        <p className="font-medium">
                          {new Date(selectedCaseForDetail.insurance_application_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      {selectedCaseForDetail.countdown_expires_at && (
                        <div>
                          <p className="text-sm text-gray-600">Tahkim Süresi</p>
                          <p className="font-medium">
                            {new Date(selectedCaseForDetail.countdown_expires_at).toLocaleDateString('tr-TR')} tarihinde
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
                    <p className="font-medium">
                      {new Date(selectedCaseForDetail.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Oluşturulma Saati</p>
                    <p className="font-medium">
                      {new Date(selectedCaseForDetail.created_at).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Safahat Geçmişi Modal */}
        <Dialog open={caseProgressDialogOpen} onOpenChange={setCaseProgressDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Safahat Geçmişi
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedCaseForDetail?.title} dosyasının safahat geçmişi
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedCaseForDetail?.case_progress && selectedCaseForDetail.case_progress.length > 0 ? (
                <div className="space-y-4">
                  {selectedCaseForDetail.case_progress
                    .sort((a, b) => new Date(a.progress_date).getTime() - new Date(b.progress_date).getTime())
                    .map((progress) => {
                      const progressType = PROGRESS_TYPES.find(t => t.value === progress.progress_type)
                      const displayText = progressType ? progressType.label : progress.custom_description || 'Bilinmeyen'
                      
                      return (
                        <div key={progress.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{displayText}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(progress.progress_date).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          {progress.notes && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                              {progress.notes}
                            </p>
                          )}
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Bu dosya için henüz safahat kaydı bulunmuyor</p>
                  <p className="text-sm text-gray-400 mt-2">Dosyalar sayfasından safahat ekleyebilirsiniz</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Arama */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ad soyad, TC kimlik no veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Müvekkil Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Müvekkil Listesi</CardTitle>
          <CardDescription>
            {filteredClients.length} müvekkil bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>TC Kimlik No</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Dosya Sayısı</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.full_name}</TableCell>
                    <TableCell>{client.tc_no || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.cases?.length || 0} dosya
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShowClientInfo(client)}
                          className="cursor-pointer"
                          title="Dosyaları görüntüle"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        {!isReadOnly && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditClient(client)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteClient(client.id)}
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz müvekkil bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
